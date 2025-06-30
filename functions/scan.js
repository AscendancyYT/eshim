const WITHDRAW_API = "https://67c8964c0acf98d07087272b.mockapi.io/withdraws";
const USER_API = "https://67c8964c0acf98d07087272b.mockapi.io/users";
const resultBox = document.getElementById("result");

async function scanAndUpdate() {
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id");

  if (!idParam) {
    resultBox.classList.add("error");
    resultBox.textContent = "❌ Missing 'id' in query.";
    return;
  }

  try {
    const withdrawRes = await axios.get(WITHDRAW_API);
    const withdraw = withdrawRes.data.find(w => w.wId === idParam);

    if (!withdraw) {
      resultBox.classList.add("error");
      resultBox.textContent = `❌ No withdraw found for ID: ${idParam}`;
      return;
    }

    if (withdraw.isUsed === "true") {
      resultBox.classList.add("error");
      resultBox.textContent = `⚠️ This withdraw code is already used.`;
      return;
    }

    const userRes = await axios.get(USER_API);
    const user = userRes.data.find(u => u.accID === withdraw.by);

    if (!user) {
      resultBox.classList.add("error");
      resultBox.textContent = `❌ No user found with accID: ${withdraw.by}`;
      return;
    }

    const updatedBalance = user.eBalance + Number(withdraw.amount);

    await axios.put(`${USER_API}/${user.id}`, {
      ...user,
      eBalance: updatedBalance
    });

    await axios.put(`${WITHDRAW_API}/${withdraw.id}`, {
      ...withdraw,
      isUsed: "true"
    });

    resultBox.classList.add("success");
    resultBox.innerHTML = `
      ✅ <b>Success!</b><br/>
      <b>${withdraw.amount.toLocaleString()} Eshims</b> added to account: <b>${user.accID}</b><br/>
      <b>New Balance:</b> ${updatedBalance.toLocaleString()}<br/>
      <b>Status:</b> ${withdraw.status}<br/>
      <b>Date:</b> ${withdraw.date}
    `;
  } catch (err) {
    resultBox.classList.add("error");
    resultBox.textContent = "⚠️ Failed to complete operation.";
  }
}

scanAndUpdate();
