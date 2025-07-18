import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = window.db;

const userList = document.querySelector(".admin-users");
const adminList = document.querySelector(".admin-withdraws");
const txList = document.querySelector(".admin-transactions");
const purchaseList = document.querySelector(".admin-purchases");

const searchUserInput = document.getElementById("search-user");
const searchWithdrawInput = document.getElementById("search-withdraw");

const modal = document.querySelector(".modal");
const modalForm = document.querySelector(".modal-form");
const modalInputs = {
  accID: document.getElementById("edit-accid"),
  name: document.getElementById("edit-name"),
  password: document.getElementById("edit-password"),
  telegram: document.getElementById("edit-telegram"),
  eBalance: document.getElementById("edit-balance"),
  status: document.getElementById("edit-status")
};

let allUsers = [];
let allWithdraws = [];
let allPurchases = [];
let selectedUserId = null;

function searchSort(list, query, key) {
  const q = query.toLowerCase();
  return list
    .map((item) => ({
      item,
      score: item[key]?.toLowerCase().startsWith(q)
        ? 2
        : item[key]?.toLowerCase().includes(q)
        ? 1
        : 0
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}

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
  const display = limit ? withdraws.slice(-15).reverse() : withdraws;

  display.forEach((w) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div><b>UserID:</b> ${w.by}</div>
      <div><b>Amount:</b> ${w.amount}</div>
      <div><b>Status:</b> ${w.status}</div>
      <div><b>Date:</b> ${w.date}</div>
      <div><b>wId:</b> ${w.wId}</div>
      ${w.status === "pending" ? `
        <button data-id="${w.id}" class="approve">✅ Approve</button>
        <button data-id="${w.id}" class="deny">❌ Deny</button>
      ` : ""}
    `;
    adminList.appendChild(li);
  });

  document.querySelectorAll(".approve").forEach(
    (btn) => (btn.onclick = () => updateWithdraw(btn.dataset.id, "approved"))
  );
  document.querySelectorAll(".deny").forEach(
    (btn) => (btn.onclick = () => updateWithdraw(btn.dataset.id, "denied"))
  );
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
      <div><b>From:</b> ${tx.host?.name || "?"}</div>
      <div><b>To:</b> ${tx.guest?.name || "?"}</div>
      <div><b>Amount:</b> ${tx.amount}</div>
      <div><b>Date:</b> ${new Date(tx.date).toLocaleString()}</div>
    `;
    txList.appendChild(li);
  });
}

function renderPurchases(purchases, limit = true) {
  purchaseList.innerHTML = "";
  const display = limit ? purchases.slice(-15).reverse() : purchases;

  if (!display.length) {
    purchaseList.innerHTML = "<li>No purchases found.</li>";
    return;
  }

  display.forEach((p) => {
    const li = document.createElement("li");
    li.classList.add(p.status?.toLowerCase());
    li.innerHTML = `
      <b>AccID:</b> ${p.accID}<br/>
      <b>Amount:</b> ${p.amount} Eshims<br/>
      <b>Price:</b> ${p.price?.toLocaleString()} UZS<br/>
      <b>Status:</b> ${p.status}<br/>
      <b>Date:</b> ${new Date(p.createdAt).toLocaleString()}<br/>
      ${p.status === "waiting" ? `
        <button class="approve" data-id="${p.id}">✅ Approve</button>
        <button class="deny" data-id="${p.id}">❌ Deny</button>
      ` : ""}
    `;
    purchaseList.appendChild(li);
  });

  document.querySelectorAll(".admin-purchases .approve").forEach(
    (btn) => (btn.onclick = () => updatePurchase(btn.dataset.id, "approved"))
  );
  document.querySelectorAll(".admin-purchases .deny").forEach(
    (btn) => (btn.onclick = () => updatePurchase(btn.dataset.id, "denied"))
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
    eBalance: parseFloat(modalInputs.eBalance.value) || 0
  };

  await updateDoc(doc(db, "users", selectedUserId), updatedUser);
  closeModal();
  await fetchUsers();
});

window.onclick = function (e) {
  if (e.target === modal) closeModal();
};

// Fetchers
async function fetchUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderUserList(allUsers, true);
}

async function fetchWithdraws() {
  const snapshot = await getDocs(collection(db, "withdraws"));
  allWithdraws = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderAdminWithdraws(allWithdraws, true);
}

async function fetchTransactions() {
  const snapshot = await getDocs(collection(db, "transactions"));
  const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderTransactions(txs.slice(-15).reverse());
}

async function fetchPurchases() {
  const snapshot = await getDocs(collection(db, "purchaseReq"));
  allPurchases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderPurchases(allPurchases, true);
}

async function updateWithdraw(id, status) {
  await updateDoc(doc(db, "withdraws", id), { status });
  await fetchWithdraws();
}

async function updatePurchase(id, status) {
  await updateDoc(doc(db, "purchaseReq", id), { status });

  if (status === "approved") {
    const snapshot = await getDocs(collection(db, "purchaseReq"));
    const purchaseDoc = snapshot.docs.find(doc => doc.id === id);
    const purchase = purchaseDoc?.data();

    if (purchase) {
      const { accID, amount } = purchase;
      const user = allUsers.find(u => u.accID === accID);

      if (user) {
        const updatedBalance = (parseFloat(user.eBalance) || 0) + (parseFloat(amount) || 0);
        await updateDoc(doc(db, "users", user.id), { eBalance: updatedBalance });
      }
    }
  }

  await fetchPurchases();
}


fetchUsers();
fetchWithdraws();
fetchTransactions();
fetchPurchases();

setInterval(fetchWithdraws, 1500);
setInterval(fetchTransactions, 1500);
setInterval(fetchPurchases, 1500);
