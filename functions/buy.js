let accIDInput = document.querySelector(".accIDInput");
let buyBtn = document.querySelector(".buyBtn");
let amount = document.querySelector(".amountInput");
let userTelegram = localStorage.getItem("telegram");
let xBtn = document.querySelector(".x-btn");
let successAlert = document.querySelector(".success-alert");
let priceAmount = document.querySelector(".priceAmount");

const BOT_TOKEN = "7213789475:AAEmE6PldmI0tfVkM1oZ--Ef4HcpvBewIk8";
const URI_API = `https://api.telegram.org/bot${BOT_TOKEN}/SendMessage`;
const CHAT_ID = "-4754251527";

async function getUsers() {
  await axios
    .get("https://67c8964c0acf98d07087272b.mockapi.io/users")
    .then((response) => {
      return response;
    });
}

async function fillID() {
  await axios
    .get(
      `https://67c8964c0acf98d07087272b.mockapi.io/users?telegram=${userTelegram}`
    )
    .then((response) => {
      accIDInput.value = response.data[0].accID;
      // console.log(response);
    });
}

buyBtn.onclick = async (e) => {
  e.preventDefault();
  await axios
    .post(`https://67c8964c0acf98d07087272b.mockapi.io/purchaseReq`, {
      createdAt: new Date().toISOString(),
      accID: await axios
        .get(
          `https://67c8964c0acf98d07087272b.mockapi.io/users?telegram=${userTelegram}`
        )
        .then((response) => {
          return response.data[0].accID;
        })
        .catch((err) => alert("Error Fetching AccID" + " " + err)),
      status: "waiting",
      amount: amount.value,
      price: amount.value * 50,
    })
    .then(async (response) => {
      console.log(response);

      let message = `<b>🗒 Purchase Response Log</b> \n`;
      message += `<b>Status:</b> ${response.status}\n`;
      message += `<b>Status Text:</b> ${response.statusText}\n`;
      message += `<b>Accaunt:</b> ${await axios
        .get(
          `https://67c8964c0acf98d07087272b.mockapi.io/users?telegram=${userTelegram}`
        )
        .then((response) => {
          return response.data[0].accID;
        })}\n`;
      message += `<b>Price:</b> ${amount.value * 50}`;
      axios
        .post(URI_API, {
          parse_mode: "html",
          text: message,
          chat_id: CHAT_ID,
        })
        .then((response) => {
          console.log(response);
          successAlert.style.display = "flex";
          amount.value = "";
        });
    })
    .catch((err) => alert("Error While Posting a Purchase" + " " + err));
};

xBtn.onclick = () => {
  successAlert.style.display = "none";
};

function amountOnChange() {
  priceAmount.innerHTML = amount.value * 50;
}

fillID();
