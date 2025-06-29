let accIDInput = document.querySelector(".accIDInput");
let buyBtn = document.querySelector(".buyBtn");
let amount = document.querySelector(".amountInput");
let userTelegram = localStorage.getItem("telegram");
let xBtn = document.querySelector(".x-btn");
let successAlert = document.querySelector(".success-alert");
let priceAmount = document.querySelector(".priceAmount");
let historyList = document.querySelector(".history-list");

const BOT_TOKEN = "7213789475:AAEmE6PldmI0tfVkM1oZ--Ef4HcpvBewIk8";
const URI_API = `https://api.telegram.org/bot${BOT_TOKEN}/SendMessage`;
const CHAT_ID = "-4754251527";

function amountOnChange() {
  priceAmount.innerHTML = amount.value * 50;
}

xBtn.onclick = () => {
  successAlert.style.display = "none";
};

async function fillID() {
  try {
    const response = await axios.get(`https://67c8964c0acf98d07087272b.mockapi.io/users?telegram=${userTelegram}`);
    const user = response.data[0];
    accIDInput.value = user.accID;
    fetchPurchaseHistory(); // Load purchase history
  } catch (err) {
    console.error("Error fetching user accID:", err);
  }
}

async function fetchPurchaseHistory() {
  try {
    const res = await axios.get(`https://67c8964c0acf98d07087272b.mockapi.io/purchaseReq?accID=${accIDInput.value}`);
    const purchases = res.data.reverse();

    if (!purchases.length) {
      historyList.innerHTML = "<li>No purchases yet.</li>";
      return;
    }

    historyList.innerHTML = "";
    purchases.forEach(p => {
      const li = document.createElement("li");
      li.classList.add(p.status.toLowerCase());
      li.innerHTML = `
        <b>Amount:</b> ${p.amount} Eshims<br/>
        <b>Price:</b> ${p.price.toLocaleString()} UZS<br/>
        <b>Status:</b> ${p.status}<br/>
        <b>Date:</b> ${new Date(p.createdAt).toLocaleString()}
      `;
      historyList.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to fetch history:", err);
    historyList.innerHTML = "<li>Error loading history.</li>";
  }
}

buyBtn.onclick = async (e) => {
  e.preventDefault();
  try {
    const userRes = await axios.get(`https://67c8964c0acf98d07087272b.mockapi.io/users?telegram=${userTelegram}`);
    const accID = userRes.data[0].accID;
    const eshimAmount = amount.value;
    const totalPrice = eshimAmount * 50;

    const res = await axios.post(`https://67c8964c0acf98d07087272b.mockapi.io/purchaseReq`, {
      createdAt: new Date().toISOString(),
      accID,
      status: "waiting",
      amount: eshimAmount,
      price: totalPrice,
    });

    let message = `<b>🗒 Purchase Request</b>\n`;
    message += `<b>Status:</b> ${res.status}\n`;
    message += `<b>Account:</b> ${accID}\n`;
    message += `<b>Amount:</b> ${eshimAmount}\n`;
    message += `<b>Price:</b> ${totalPrice.toLocaleString()} UZS`;

    await axios.post(URI_API, {
      parse_mode: "html",
      text: message,
      chat_id: CHAT_ID,
    });

    successAlert.style.display = "flex";
    amount.value = "";
    priceAmount.innerHTML = "";
    fetchPurchaseHistory(); // Refresh list after new purchase
  } catch (err) {
    alert("Error submitting purchase: " + err);
  }
};

fillID();
