let submitBtn = document.querySelector(".submitBtn");
const amntInp = document.querySelector(".amntInp");
const btnText = submitBtn.querySelector(".btnText");
const spinner = submitBtn.querySelector(".spinner");
const withdrawList = document.querySelector(".withdraws");

const WITHD_API = "https://67c8964c0acf98d07087272b.mockapi.io/withdraws";
const USERS_API_BASE = CONFIG.USERS_API;
const TELEGRAM = localStorage.getItem("telegram");
const BOT_TOKEN = CONFIG.ADMIN_BOT_TOKEN;
const CHAT_ID = CONFIG.ADMIN_CHAT_ID;
const characters = "ABCDEFGHIJKLMNOPQRSTUVXYZ1234567890";

function idGenerator(length) {
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
}

async function getUserId() {
  const userResponse = await axios.get(`${USERS_API_BASE}?telegram=${TELEGRAM}`);
  const user = userResponse.data[0];
  return user?.accID;
}

async function getBalance() {
  const userResponse = await axios.get(`${USERS_API_BASE}?telegram=${TELEGRAM}`);
  const user = userResponse.data[0];
  let balance = document.querySelector(".balance");
  balance.innerHTML += user.eBalance;
}

function renderWithdraws(withdraws) {
  withdrawList.innerHTML = "";
  withdraws.forEach((w) => {
    const li = document.createElement("li");
    li.className = "withdraw";
    li.innerHTML = `
      <span class="wDate">${w.date}</span>
      <span class="wAmount">💸 ${w.amount} Eshim</span>
      <span class="wStatus">${w.status}</span>
    `;

    if (w.status === "pending") {
      li.style.background = "#ffe066";
      li.style.borderLeft = "5px solid orange";
    } else {
      li.style.background = "#00ff9c";
      li.style.borderLeft = "5px solid #00cc7a";
      li.style.cursor = "pointer";
      li.onclick = () => {
        removeWithdraw(w.wId);
      };
    }

    li.style.padding = "10px";
    li.style.marginBottom = "10px";
    li.style.borderRadius = "10px";
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";
    li.style.color = "#000";
    li.style.fontWeight = "bold";
    withdrawList.appendChild(li);
  });
}


async function removeWithdraw(wId) {
  try {
    let withdraws = JSON.parse(localStorage.getItem("myWithdraws")) || [];
    const target = withdraws.find(w => w.wId === wId);
    if (!target) return;

    await axios.delete(`${WITHD_API}/${target.id}`);
    withdraws = withdraws.filter(w => w.wId !== wId);
    localStorage.setItem("myWithdraws", JSON.stringify(withdraws));
    renderWithdraws(withdraws);
  } catch (err) {
    console.error("Failed to delete withdraw from DB:", err);
    alert("Failed to remove. Try again later.");
  }
}

document.querySelector(".form").addEventListener("submit", async function (e) {
  e.preventDefault();
  submitBtn.disabled = true;
  btnText.textContent = "Sending";
  spinner.style.display = "inline-block";
  submitBtn.style.background = "none";

  try {
    const userResponse = await axios.get(`${USERS_API_BASE}?telegram=${TELEGRAM}`);
    const user = userResponse.data[0];
    if (!user) throw new Error("User not found");

    const balance = parseFloat(user.eBalance);
    const amount = parseFloat(amntInp.value);
    if (isNaN(amount) || amount > balance)
      throw new Error("Invalid or insufficient balance");

    const existing = await axios.get(`${WITHD_API}?by=${user.accID}`);
    const activeWithdraws = existing.data.filter(w => w.status === "pending");

    if (activeWithdraws.length >= 3) {
      alert("Max 3 pending withdraws allowed.");
      resetButton();
      return;
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

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      parse_mode: "HTML",
      text: `<b>Новая Заявка</b>\n<b>Отправитель: </b> ${user.name}\n<b>Дата: </b> ${new Date().toLocaleDateString()}\n<b>Сумма: </b> ${amount}`,
    });

    localStorage.setItem(
      "myWithdraws",
      JSON.stringify([...existing.data, newWithdraw])
    );
    renderWithdraws([...existing.data, newWithdraw]);
    amntInp.value = "";
  } catch (err) {
    console.error(err.message);
    alert("Withdraw failed: " + err.message);
  }

  resetButton();
});

function resetButton() {
  btnText.textContent = "Submit";
  spinner.style.display = "none";
  submitBtn.disabled = false;
  submitBtn.style.background = "lightgreen";
}

setInterval(async () => {
  try {
    const response = await axios.get(`${WITHD_API}?by=${await getUserId()}`);
    const stored = JSON.stringify(JSON.parse(localStorage.getItem("myWithdraws")) || []);
    const latest = JSON.stringify(response.data);
    if (stored !== latest) {
      localStorage.setItem("myWithdraws", latest);
      renderWithdraws(response.data);
    }
  } catch (err) {
    console.warn("Live update failed");
  }
}, 10000);

(async () => {
  try {
    const userId = await getUserId();
    const response = await axios.get(`${WITHD_API}?by=${userId}`);
    const myWithdraws = response.data;
    localStorage.setItem("myWithdraws", JSON.stringify(myWithdraws));
    renderWithdraws(myWithdraws);
  } catch (err) {
    console.error("Failed to load withdraws:", err);
  }

  getBalance();
})();
