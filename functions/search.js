// main check
if (localStorage.getItem("telegram")) {
  console.log("You are good to go!");
} else {
  window.location.href = "../index.html";
}

// importing
let displayBal = document.querySelector(".displayBalance");
let mineBtn = document.querySelector(".button");

let telegram = localStorage.getItem("telegram");
let users_api = CONFIG.USERS_API;

// functions
axios
  .get(`${users_api}?telegram=${telegram}`)
  .then((response) => {
    displayBal.innerHTML += response.data[0].eBalance;
  })
  .catch((err) => alert(err));

mineBtn.onclick = async (e) => {
  if (mineBtn.disabled) return;

  try {
    mineBtn.disabled = true;

    let user = (await axios.get(`${users_api}?telegram=${telegram}`)).data[0];

    // 100% crit for admins, 5% for normal users
    let isCrit = user.status === "Admin" ? true : Math.random() < 0.05;
    let earnAmount = isCrit ? 10 : 1;

    mineBtn.innerText = isCrit ? "💥 CRIT +10!" : "⛏️ Mining...";

    createFloatingText(e.clientX, e.clientY, `+${earnAmount}`, isCrit);

    let newBalance = user.eBalance + earnAmount;

    await axios.put(`${users_api}/${user.id}`, {
      ...user,
      eBalance: newBalance,
    });

    displayBal.innerHTML = `Your Balance: ${newBalance}`;

    setTimeout(() => {
      mineBtn.disabled = false;
      mineBtn.innerText = "TAP!";
    }, 100);
  } catch (err) {
    alert("Error: " + err.message);
    mineBtn.disabled = false;
    mineBtn.innerText = "TAP!";
  }
};


function createFloatingText(x, y, text, isCrit) {
  const floatText = document.createElement("div");
  floatText.innerText = text;
  floatText.className = "floating-text";
  if (isCrit) floatText.classList.add("crit");

  floatText.style.left = `${x}px`;
  floatText.style.top = `${y}px`;
  document.body.appendChild(floatText);

  setTimeout(() => {
    floatText.remove();
  }, 1000);
}
