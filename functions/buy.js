let accIDInput = document.querySelector(".accIDInput");
let buyBtn = document.querySelector(".buyBtn")
let amount = document.querySelector(".amount")
let userTelegram = localStorage.getItem("telegram");

async function getUsers() {
  await axios
    .get("https://67c8964c0acf98d07087272b.mockapi.io/users")
    .then((response) => {
      return response;
    });
}

async function fillID() {
  await axios
    .get(`https://67c8964c0acf98d07087272b.mockapi.io/users?${userTelegram}`)
    .then((response) => {
      accIDInput.value = response.data[0].accID
      console.log(response);
    });
}

buyBtn.onclick = async (e) => {
  e.preventDefault()
  await axios.post(`https://67c8964c0acf98d07087272b.mockapi.io/purchaseReq`, {
    createdAt: new Date().toISOString(),
    accID: "1",
    status: "waiting",
    amount: amount.value
  })
}

fillID()