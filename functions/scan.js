const WITHDRAW_API = "https://67c8964c0acf98d07087272b.mockapi.io/withdraws";
const USER_API_BASE = "https://67c8964c0acf98d07087272b.mockapi.io/users";
const resultBox = document.getElementById("result");

async function scanAndApply() {
  const params = new URLSearchParams(window.location.search);
  const wIdParam = params.get("id");
  const telegram = localStorage.getItem("telegram");

  if (!wIdParam) {
    resultBox.classList.add("error");
    resultBox.textContent = "❌ Missing 'id' in URL.";
    return;
  }

  if (!telegram) {
    resultBox.classList.add("error");
    resultBox.textContent = "❌ No Telegram ID in localStorage.";
    return;
  }

  try {
    const userRes = await axios.get(`${USER_API_BASE}?telegram=${telegram}`);
    const user = userRes.data[0];

    if (!user) {
      resultBox.classList.add("error");
      resultBox.textContent = `❌ User not found for Telegram: ${telegram}`;
      return;
    }

    const withdrawRes = await axios.get(WITHDRAW_API);
    const withdraw = withdrawRes.data.find(w => w.wId === wIdParam);

    if (!withdraw) {
      resultBox.classList.add("error");
      resultBox.textContent = `❌ Withdraw ID '${wIdParam}' not found.`;
      return;
    }

    if (withdraw.isUsed === "true") {
      resultBox.classList.add("error");
      resultBox.textContent = `⚠️ This code has already been used.`;
      return;
    }

    const updatedBalance = user.eBalance + Number(withdraw.amount);

    await axios.put(`${USER_API_BASE}/${user.id}`, {
      ...user,
      eBalance: updatedBalance
    });

    await axios.put(`${WITHDRAW_API}/${withdraw.id}`, {
      ...withdraw,
      isUsed: "true"
    });

    resultBox.classList.add("success");
    resultBox.innerHTML = `
      ✅ <b>Balance Updated!</b><br/>
      You received <b>${withdraw.amount.toLocaleString()} Eshims</b><br/>
      <b>New Balance:</b> ${updatedBalance.toLocaleString()}<br/>
      <b>Date:</b> ${withdraw.date}<br/>
      <b>wId:</b> ${withdraw.wId}
    `;
  } catch (err) {
    resultBox.classList.add("error");
    resultBox.textContent = "⚠️ Something went wrong during the scan.";
  }
}

scanAndApply();
