import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig } from "../config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Check login
const telegram = localStorage.getItem("telegram");
if (!telegram) window.location.href = "../index.html";

// Elements
const displayBal = document.querySelector(".displayBalance");
const mineBtn = document.querySelector(".button");

let currentUser = null;

// Get user data
async function getUser() {
  const q = query(collection(db, "users"), where("telegram", "==", telegram));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    alert("User not found.");
    return;
  }
  const docSnap = querySnapshot.docs[0];
  currentUser = { id: docSnap.id, ...docSnap.data() };
  displayBal.innerText = `Your Balance: ${currentUser.eBalance}`;
}

await getUser();

// Click handler
mineBtn.onclick = async (e) => {
  if (!currentUser) return;

  try {
    mineBtn.disabled = true;

    // Crit logic
    let isCrit = currentUser.status === "Admin" ? true : Math.random() < 0.05;
    let earnAmount = isCrit ? 10 : 1;

    mineBtn.innerText = isCrit ? "💥 CRIT +10!" : "⛏️ Mining...";

    createFloatingText(e.clientX, e.clientY, `+${earnAmount}`, isCrit);

    // Update balance in Firestore
    const newBalance = currentUser.eBalance + earnAmount;
    const userRef = doc(db, "users", currentUser.id);
    await updateDoc(userRef, { eBalance: newBalance });

    currentUser.eBalance = newBalance;
    displayBal.innerText = `Your Balance: ${newBalance}`;

    setTimeout(() => {
      mineBtn.disabled = false;
      mineBtn.innerText = "TAP!";
    }, 100);
  } catch (err) {
    alert("Mining error: " + err.message);
    mineBtn.disabled = false;
    mineBtn.innerText = "TAP!";
  }
};

// Floating animation
function createFloatingText(x, y, text, isCrit) {
  const floatText = document.createElement("div");
  floatText.innerText = text;
  floatText.className = "floating-text";
  if (isCrit) floatText.classList.add("crit");

  floatText.style.left = `${x}px`;
  floatText.style.top = `${y}px`;
  document.body.appendChild(floatText);

  setTimeout(() => floatText.remove(), 1000);
}
