// DOM Elements
const submitBtn = document.querySelector(".submitBtn");
const amntInp = document.querySelector(".amntInp");
const btnText = submitBtn.querySelector(".btnText");
const spinner = submitBtn.querySelector(".spinner");
const withdrawList = document.querySelector(".withdraws");
const balanceDisplay = document.querySelector(".balance");

// API Endpoints
const WITHD_API = "https://67c8964c0acf98d07087272b.mockapi.io/withdraws";
const USERS_API_BASE = CONFIG.USERS_API;
const BOT_TOKEN = CONFIG.ADMIN_BOT_TOKEN;
const CHAT_ID = CONFIG.ADMIN_CHAT_ID;
const characters = "ABCDEFGHIJKLMNOPQRSTUVXYZ1234567890";

// Initialize with safe localStorage access
let TELEGRAM = "";
try {
  TELEGRAM = localStorage.getItem("telegram") || "";
} catch (e) {
  console.error("LocalStorage access error:", e);
}

// Add request/response logging for debugging
axios.interceptors.request.use(request => {
  console.log('Request:', request.method, request.url);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('API Error:', error.config?.url, error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// Helper functions
function idGenerator(length) {
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
}

async function getUserId() {
  try {
    if (!TELEGRAM) throw new Error("Telegram ID not available");
    
    const userResponse = await axios.get(`${USERS_API_BASE}?telegram=${TELEGRAM}`);
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
      balanceDisplay.textContent = "0";
      return;
    }

    const userResponse = await axios.get(`${USERS_API_BASE}?telegram=${TELEGRAM}`);
    const user = userResponse.data[0];
    balanceDisplay.textContent = user?.eBalance || "0";
  } catch (error) {
    console.error("Failed to get balance:", error);
    balanceDisplay.textContent = "Error";
  }
}

function renderWithdraws(withdraws) {
  withdrawList.innerHTML = "";
  
  if (!withdraws || withdraws.length === 0) {
    withdrawList.innerHTML = '<li class="no-withdraws">No withdraw history</li>';
    return;
  }

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
      li.onclick = () => removeWithdraw(w.wId);
    }

    Object.assign(li.style, {
      padding: "10px",
      marginBottom: "10px",
      borderRadius: "10px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      color: "#000",
      fontWeight: "bold"
    });

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
    console.error("Failed to delete withdraw:", err);
    alert("Failed to remove. Please try again.");
  }
}

// Form submission handler
document.querySelector(".form").addEventListener("submit", async function (e) {
  e.preventDefault();
  
  // UI state update
  submitBtn.disabled = true;
  btnText.textContent = "Processing...";
  spinner.style.display = "inline-block";
  submitBtn.style.background = "none";

  try {
    // Validate input
    const amount = parseFloat(amntInp.value);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Please enter a valid amount");
    }

    // Get user data
    const userResponse = await axios.get(`${USERS_API_BASE}?telegram=${TELEGRAM}`);
    const user = userResponse.data[0];
    if (!user) throw new Error("User account not found");

    // Check balance
    const balance = parseFloat(user.eBalance);
    if (amount > balance) {
      throw new Error("Insufficient balance");
    }

    // Check existing withdraws
    const existing = await axios.get(`${WITHD_API}?by=${user.accID}`);
    const activeWithdraws = existing.data.filter(w => w.status === "pending");

    if (activeWithdraws.length >= 3) {
      throw new Error("Maximum 3 pending withdraws allowed");
    }

    // Create withdraw
    const withdrawal = {
      wId: idGenerator(7),
      amount,
      by: user.accID,
      date: new Date().toLocaleString(),
      status: "pending",
    };

    const { data: newWithdraw } = await axios.post(WITHD_API, withdrawal);

    // Update balance
    await axios.put(`${USERS_API_BASE}/${user.id}`, {
      eBalance: balance - amount,
    });

    // Notify admin
    try {
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: CHAT_ID,
        parse_mode: "HTML",
        text: `<b>New Withdraw Request</b>\n<b>User: </b> ${user.name}\n<b>Date: </b> ${new Date().toLocaleDateString()}\n<b>Amount: </b> ${amount}`,
      });
    } catch (tgError) {
      console.warn("Telegram notification failed:", tgError);
    }

    // Update local storage
    const updatedWithdraws = [...existing.data, newWithdraw];
    localStorage.setItem("myWithdraws", JSON.stringify(updatedWithdraws));
    renderWithdraws(updatedWithdraws);
    amntInp.value = "";
    
    // Refresh balance display
    await getBalance();
  } catch (err) {
    console.error("Withdraw error:", err);
    alert("Withdraw failed: " + (err.response?.data?.message || err.message));
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

// Live updates
async function updateWithdraws() {
  try {
    const userId = await getUserId();
    const response = await axios.get(`${WITHD_API}?by=${userId}`);
    const stored = JSON.stringify(JSON.parse(localStorage.getItem("myWithdraws")) || []);
    const latest = JSON.stringify(response.data);
    
    if (stored !== latest) {
      localStorage.setItem("myWithdraws", latest);
      renderWithdraws(response.data);
    }
  } catch (err) {
    console.warn("Live update failed:", err.message);
  }
}

// Initialize
(async () => {
  try {
    await getBalance();
    const userId = await getUserId();
    if (userId) {
      const response = await axios.get(`${WITHD_API}?by=${userId}`);
      localStorage.setItem("myWithdraws", JSON.stringify(response.data));
      renderWithdraws(response.data);
    }
  } catch (err) {
    console.error("Initialization error:", err);
    renderWithdraws([]);
  }

  // Set up periodic updates
  setInterval(updateWithdraws, 10000);
})();