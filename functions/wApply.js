const submitBtn = document.querySelector(".submitBtn");
const amntInp = document.querySelector(".amntInp");
const btnText = submitBtn.querySelector(".btnText");
const spinner = submitBtn.querySelector(".spinner");
const withdrawList = document.querySelector(".withdraws");
const balanceDisplay = document.querySelector(".balance");

const WITHD_API = "https://67c8964c0acf98d07087272b.mockapi.io/withdraws";
const USERS_API_BASE = CONFIG.USERS_API;
const BOT_TOKEN = CONFIG.ADMIN_BOT_TOKEN;
const CHAT_ID = CONFIG.ADMIN_CHAT_ID;
const characters = "ABCDEFGHIJKLMNOPQRSTUVXYZ1234567890";

let TELEGRAM = "";
try {
  TELEGRAM = localStorage.getItem("telegram") || "";
} catch (e) {
  console.error("LocalStorage access error:", e);
}

axios.interceptors.response.use(
  (response) => {
    console.log("Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error(
      "API Error:",
      error.config?.url,
      error.response?.status,
      error.message
    );
    return Promise.reject(error);
  }
);

function idGenerator(length) {
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
}

async function getUserId() {
  try {
    if (!TELEGRAM) throw new Error("Telegram ID not available");

    const userResponse = await axios.get(
      `${USERS_API_BASE}?telegram=${TELEGRAM}`
    );
    if (!userResponse.data || userResponse.data.length === 0) {
      throw new Error("User not found");
    }
    return userResponse.data[0].accID;
  } catch (error) {
    console.error("Failed to get user ID:", error);
    throw error;
  }
}

async function getBalance() {
  try {
    if (!TELEGRAM) {
      balanceDisplay.textContent += "0";
      return;
    }

    const userResponse = await axios.get(
      `${USERS_API_BASE}?telegram=${TELEGRAM}`
    );
    const user = userResponse.data[0];
    balanceDisplay.textContent = "Your Balance:" + " " + user?.eBalance || "0";
  } catch (error) {
    console.error("Failed to get balance:", error);
    balanceDisplay.textContent += "Error";
  }
}

function renderWithdraws(withdraws) {
  withdrawList.innerHTML = "";

  if (!withdraws || withdraws.length === 0) {
    withdrawList.innerHTML =
      '<li class="no-withdraws">No withdraw history</li>';
    return;
  }

  withdraws.forEach((w) => {
    const li = document.createElement("li");
    li.className = "withdraw";
    li.innerHTML = `
    <div class="wContainer">
    <span class="wStatus">${w.status}</span>
    <span class="wDate">${w.date}</span>
    </div>
    <span class="wAmount">Amount: ${w.amount} Eshim</span>
    `;

    if (w.status === "pending") {
    } else if (w.status === "denied") {
      li.style.cursor = "pointer";
      li.onclick = () => removeWithdraw(w.wId);
    } else {
      li.style.cursor = "pointer";
      li.onclick = () => removeWithdraw(w.wId);
    }

    Object.assign(li.style, {
      padding: "10px",
      marginBottom: "10px",
      borderRadius: "10px",
      display: "flex",
      justifyContent: "center",
      alignItems: "start",
      color: "#fff",
      fontWeight: "bold",
    });

    withdrawList.appendChild(li);
  });
}

async function removeWithdraw(wId) {
  try {
    let withdraws = JSON.parse(localStorage.getItem("myWithdraws")) || [];
    const target = withdraws.find((w) => w.wId === wId);
    if (!target) return;

    await axios.delete(`${WITHD_API}/${target.id}`);
    withdraws = withdraws.filter((w) => w.wId !== wId);
    localStorage.setItem("myWithdraws", JSON.stringify(withdraws));
    renderWithdraws(withdraws);
  } catch (err) {
    console.error("Failed to delete withdraw:", err);
    console.log("Failed to remove. Please try again.");
  }
}

document.querySelector(".form").addEventListener("submit", async function (e) {
  e.preventDefault();

  submitBtn.disabled = true;
  btnText.textContent = "Processing...";
  spinner.style.display = "inline-block";
  submitBtn.style.background = "none";

  try {
    const amount = parseFloat(amntInp.value);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Please enter a valid amount");
    }

    const userResponse = await axios.get(
      `${USERS_API_BASE}?telegram=${TELEGRAM}`
    );
    const user = userResponse.data[0];
    if (!user) throw new Error("User account not found");

    const balance = parseFloat(user.eBalance);
    if (amount > balance) throw new Error("Insufficient balance");

    let existing = [];
    try {
      const res = await axios.get(`${WITHD_API}?by=${user.accID}`);
      existing = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }

    const activeWithdraws = existing.filter((w) => w.status === "pending");
    if (activeWithdraws.length >= 3) {
      throw new Error("Maximum 3 pending withdraws allowed");
    }

    const withdrawal = {
      wId: idGenerator(7),
      amount,
      by: user.accID,
      date: new Date().toLocaleString(),
      status: "pending",
    };

    const { data: newWithdraw } = await axios.post(WITHD_API, withdrawal);

    await axios.put(`${USERS_API_BASE}/${user.id}`, {
      eBalance: balance - amount,
    });

    try {
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: CHAT_ID,
        parse_mode: "HTML",
        text: `<b>New Withdraw Request</b>\n<b>User: </b> ${
          user.name
        }\n<b>Date: </b> ${new Date().toLocaleDateString()}\n<b>Amount: </b> ${amount}`,
      });
    } catch (tgError) {
      console.warn("Telegram notification failed:", tgError.message);
    }

    const updatedWithdraws = [...existing, newWithdraw];
    localStorage.setItem("myWithdraws", JSON.stringify(updatedWithdraws));
    renderWithdraws(updatedWithdraws);
    amntInp.value = "";
    await getBalance();
  } catch (err) {
    console.error("Withdraw failed:", err.message);
  } finally {
    resetButton();
  }
});

function resetButton() {
  btnText.textContent = "Submit";
  spinner.style.display = "none";
  submitBtn.disabled = false;
  submitBtn.style.background = "lightgreen";
}

async function updateWithdraws() {
  try {
    const userId = await getUserId();
    let latest = [];
    try {
      const response = await axios.get(`${WITHD_API}?by=${userId}`);
      latest = Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }

    const stored = JSON.stringify(
      JSON.parse(localStorage.getItem("myWithdraws")) || []
    );
    const latestJSON = JSON.stringify(latest);

    if (stored !== latestJSON) {
      localStorage.setItem("myWithdraws", latestJSON);
      renderWithdraws(latest);
    }
  } catch (err) {
    return err;
  }
}

(async () => {
  try {
    await getBalance();
    const userId = await getUserId();
    let withdraws = [];
    try {
      const response = await axios.get(`${WITHD_API}?by=${userId}`);
      withdraws = Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }
    localStorage.setItem("myWithdraws", JSON.stringify(withdraws));
    renderWithdraws(withdraws);
  } catch (err) {
    renderWithdraws([]);
    console.log(err);
  }

  setInterval(updateWithdraws, 10000);
})();
