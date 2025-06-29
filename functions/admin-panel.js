const userList = document.querySelector(".admin-users");
const adminList = document.querySelector(".admin-withdraws");
const txList = document.querySelector(".admin-transactions");
const searchUserInput = document.getElementById("search-user");
const searchWithdrawInput = document.getElementById("search-withdraw");
const purchaseList = document.querySelector(".admin-purchases");

const modal = document.querySelector(".modal");
const modalForm = document.querySelector(".modal-form");
const modalInputs = {
  accID: document.getElementById("edit-accid"),
  name: document.getElementById("edit-name"),
  password: document.getElementById("edit-password"),
  telegram: document.getElementById("edit-telegram"),
  eBalance: document.getElementById("edit-balance"),
  status: document.getElementById("edit-status"),
};

const USERS_API_BASE = CONFIG.USERS_API;
const TRANSACTIONS_API = CONFIG.TRANSACTIONS_API;
const WITHD_API = "https://67c8964c0acf98d07087272b.mockapi.io/withdraws";
const PURCHASE_API = "https://67c8964c0acf98d07087272b.mockapi.io/purchaseReq";

let allUsers = [];
let allWithdraws = [];
let selectedUserId = null;

function searchSort(list, query, key) {
  const q = query.toLowerCase();
  return list
    .map((item) => ({
      item,
      score: item[key].toLowerCase().startsWith(q)
        ? 2
        : item[key].toLowerCase().includes(q)
        ? 1
        : 0,
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}

function renderUserList(users, limit = true) {
  userList.innerHTML = "";
  const displayUsers = limit ? users.slice(-15).reverse() : users;
  displayUsers.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user.name;
    li.style.cursor = "pointer";
    li.onclick = () => openUserModal(user);
    userList.appendChild(li);
  });
}
function renderAdminWithdraws(withdraws, limit = true) {
  adminList.innerHTML = "";
  const displayWithdraws = limit ? withdraws.slice(-15).reverse() : withdraws;

  displayWithdraws.forEach((w) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div><b>UserID:</b> ${w.by}</div>
      <div><b>Amount:</b> ${w.amount}</div>
      <div><b>Status:</b> ${w.status}</div>
      <div><b>Date:</b> ${new Date(w.date).toLocaleString()}</div>
      <div><b>wId:</b> ${w.wId}</div>
      ${
        w.status.toLowerCase() === "waiting" ||
        w.status.toLowerCase() === "pending"
          ? `
        <button data-id="${w.id}" class="approve">✅ Approve</button>
        <button data-id="${w.id}" class="deny">❌ Deny</button>
      `
          : ""
      }
    `;

    adminList.appendChild(li);
  });

  document
    .querySelectorAll(".approve")
    .forEach(
      (btn) => (btn.onclick = () => updateWithdraw(btn.dataset.id, "approved"))
    );
  document
    .querySelectorAll(".deny")
    .forEach(
      (btn) => (btn.onclick = () => updateWithdraw(btn.dataset.id, "denied"))
    );
}

searchUserInput.oninput = () => {
  const query = searchUserInput.value.trim();
  if (!query) return renderUserList(allUsers, true);
  const filtered = searchSort(allUsers, query, "accID");
  renderUserList(filtered, false);
};

searchWithdrawInput.oninput = () => {
  const query = searchWithdrawInput.value.trim();
  if (!query) return renderAdminWithdraws(allWithdraws, true);
  const filtered = searchSort(allWithdraws, query, "wId");
  renderAdminWithdraws(filtered, false);
};

modalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedUserId) return;

  const updatedUser = {
    status: modalInputs.status.value,
    name: modalInputs.name.value,
    password: modalInputs.password.value,
    telegram: modalInputs.telegram.value,
    eBalance: parseFloat(modalInputs.eBalance.value) || 0,
  };

  try {
    await axios.put(`${USERS_API_BASE}/${selectedUserId}`, updatedUser);
    closeModal();
    await fetchUsers();
  } catch (_) {}
});

// === DATA FETCHERS ===
async function fetchUsers() {
  try {
    const res = await axios.get(USERS_API_BASE);
    allUsers = res.data || [];
    renderUserList(allUsers, true);
  } catch (_) {}
}

async function fetchWithdraws() {
  try {
    const res = await axios.get(WITHD_API);
    allWithdraws = res.data || [];
    renderAdminWithdraws(allWithdraws, true);
  } catch (_) {}
}

// === UTILITIES ===
function openUserModal(user) {
  selectedUserId = user.id;
  modalInputs.accID.value = user.accID || "";
  modalInputs.name.value = user.name || "";
  modalInputs.password.value = user.password || "";
  modalInputs.telegram.value = user.telegram || "";
  modalInputs.eBalance.value = user.eBalance || 0;
  modalInputs.status.value = user.status || "";
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
  selectedUserId = null;
}

async function updateWithdraw(id, status) {
  try {
    const res = await axios.get(`${WITHD_API}/${id}`);
    const oldData = res.data;
    const updated = { ...oldData, status };
    const updateRes = await axios.put(`${WITHD_API}/${id}`, updated);
    console.log("Updated:", updateRes.data);
    await fetchWithdraws();
  } catch (err) {
    console.error("Withdraw update failed:", err);
    alert("Something went wrong.");
  }
}
window.onclick = function (e) {
  if (e.target === modal) closeModal();
};

async function fetchTransactions() {
  try {
    const res = await axios.get(TRANSACTIONS_API);
    const transactions = (res.data || []).slice(-15).reverse();
    renderTransactions(transactions);
  } catch (_) {}
}

function renderTransactions(list) {
  txList.innerHTML = "";
  if (!list.length) {
    txList.innerHTML = "<li>No transactions found.</li>";
    return;
  }

  list.forEach((tx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div><b>ID:</b> ${tx.trId}</div>
      <div><b>From:</b> ${tx.host.name || "?"}</div>
      <div><b>To:</b> ${tx.guest?.name || "?"}</div>
      <div><b>Amount:</b> ${tx.amount}</div>
      <div><b>Date:</b> ${new Date(tx.date).toLocaleString()}</div>
    `;
    txList.appendChild(li);
  });
}

function renderPurchases(purchases) {
  purchaseList.innerHTML = "";
  const display = purchases.slice(-15).reverse();

  display.forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div><b>Account:</b> ${p.accID}</div>
      <div><b>Amount:</b> ${p.amount}</div>
      <div><b>Price:</b> ${p.price.toLocaleString()} UZS</div>
      <div><b>Status:</b> ${p.status}</div>
      <div><b>Date:</b> ${new Date(p.createdAt).toLocaleString()}</div>
      ${
        p.status === "waiting"
          ? `
        <button class="approve" data-id="${p.id}">✅ Approve</button>
        <button class="deny" data-id="${p.id}">❌ Deny</button>
      `
          : ""
      }
    `;
    purchaseList.appendChild(li);
  });

  document
    .querySelectorAll(".purchase-panel .approve")
    .forEach(
      (btn) =>
        (btn.onclick = () => updatePurchaseStatus(btn.dataset.id, "approved"))
    );
  document
    .querySelectorAll(".purchase-panel .deny")
    .forEach(
      (btn) =>
        (btn.onclick = () => updatePurchaseStatus(btn.dataset.id, "denied"))
    );
}

async function fetchPurchases() {
  try {
    const res = await axios.get(PURCHASE_API);
    renderPurchases(res.data || []);
  } catch (err) {
    console.error("Failed to fetch purchases:", err);
  }
}

async function updatePurchaseStatus(id, status) {
  try {
    await axios.put(`${PURCHASE_API}/${id}`, { status });
    await fetchPurchases();
  } catch (err) {
    console.error("Failed to update purchase:", err);
  }
}

fetchPurchases();
fetchUsers();
fetchWithdraws();
fetchTransactions();
setInterval(fetchPurchases, 15000);
setInterval(fetchTransactions, 15000);
setInterval(fetchWithdraws, 15000);
