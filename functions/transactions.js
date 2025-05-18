if (localStorage.getItem("telegram")) {
  const USERS_API = "https://67c8964c0acf98d07087272b.mockapi.io/users";
  const TELEGRAM = localStorage.getItem("telegram");

  let recipient = null;
  
  async function getCurrentUser() {
    const res = await axios.get(`${USERS_API}?telegram=${TELEGRAM}`);
    return res.data[0];
  }
  
  let currentInputValue = "";
  
  async function findRecipient() {
    const id = document.getElementById("recipientId").value.trim();
    const sendBtn = document.getElementById("sendBtn");
    const display = document.getElementById("recipientNameDisplay");
    const msg = document.getElementById("msg");
    
    currentInputValue = id;
    recipient = null;
    display.textContent = "🔍 Searching...";
    msg.textContent = "";
    sendBtn.disabled = true;
    
    if (id === "") {
      display.textContent = "Recipient: None";
      return;
    }
    
    try {
      const res = await axios.get(`${USERS_API}?accID=${id}`);
      
      // Check AGAIN that it's exact match and input didn’t change mid-request
      if (currentInputValue !== id) return;
      
      if (res.data.length === 1 && res.data[0].accID === id) {
        recipient = res.data[0];
        display.textContent = `Recipient: ${recipient.name}`;
        sendBtn.disabled = false;
      } else {
        display.textContent = "❌ Recipient not found";
      }
    } catch (err) {
      console.error(err);
      display.textContent = "❌ Error fetching recipient";
    }
  }

  async function sendTransaction() {
    const amount = parseFloat(document.getElementById("amount").value);
    const msgEl = document.getElementById("msg");
    
    if (!recipient) {
      msgEl.textContent = "❌ No valid recipient selected.";
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      msgEl.textContent = "❌ Invalid amount.";
      return;
    }

    try {
      const sender = await getCurrentUser();
      if (!sender) throw new Error("Sender not found");
      
      if (sender.eBalance < amount) {
        msgEl.textContent = "❌ Not enough balance.";
        return;
      }

      // Update recipient
      await axios.put(`${USERS_API}/${recipient.id}`, {
        eBalance: parseFloat(recipient.eBalance) + amount,
      });
      
      // Update sender
      await axios.put(`${USERS_API}/${sender.id}`, {
        eBalance: parseFloat(sender.eBalance) - amount,
      });
      
      msgEl.textContent = `✅ Sent ${amount} Eshim to ${recipient.name}`;
      document.getElementById("recipientId").value = "";
      document.getElementById("amount").value = "";
      document.getElementById("recipientNameDisplay").textContent =
      "Recipient: None";
      document.getElementById("sendBtn").disabled = true;
      recipient = null;
    } catch (err) {
      console.error(err);
      msgEl.textContent = "❌ Transaction failed.";
    }
  }
} else {
  window.location.href="../index.html"
}
