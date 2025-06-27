let accIDInput = document.querySelector(".accIDInput");
let buyBtn = document.querySelector(".buyBtn");
let amount = document.querySelector(".amountInput");
let userTelegram = localStorage.getItem("telegram");
let xBtn = document.querySelector(".x-btn");
let successAlert = document.querySelector(".success-alert");

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
      console.log(response);
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
    })
    .then((response) => {
      console.log(response);
      successAlert.style.display = "flex";
      amount.value = " "
    })
    .catch((err) => alert("Error While Posting a Purchase" + " " + err));
};

xBtn.onclick = () => {
  successAlert.style.display = "none";
};

fillID();
