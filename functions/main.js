import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0BvBkEdHI2TCt1MH4I8VFAteTUkMw_PE",
  authDomain: "eshim-coin.firebaseapp.com",
  projectId: "eshim-coin",
  storageBucket: "eshim-coin.firebasestorage.app",
  messagingSenderId: "1027852914663",
  appId: "1:1027852914663:web:9381d871eedca60896f742",
  measurementId: "G-M1K1X7QVTS",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const usersRef = collection(db, "users");

// Local check
if (localStorage.getItem("telegram")) {
  window.location.href = "../src/profile.html";
} else {
  // DOM elements
  const nameInput = document.querySelector(".nameInput");
  const passwordInput = document.querySelector(".passwordInput");
  const telegramInput = document.querySelector(".telegramInput");
  const signupBtn = document.querySelector(".signupBtn");
  const form = document.querySelector(".form");
  const loginLink = document.querySelector(".loginLink");
  const nameLabel = document.querySelector(".nameLabel");
  const xBtn = document.querySelector(".x-btn");
  const successAlert = document.querySelector(".success-alert");

  // Generate Random Account ID
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567891234567890";
  function generateID(length) {
    let id = "";
    for (let i = 0; i < length; i++) {
      id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
  }

  // 🔓 SWITCH TO LOGIN MODE
  loginLink.addEventListener("click", (e) => {
    e.preventDefault();

    nameInput.style.display = "none";
    signupBtn.remove();
    loginLink.remove();
    nameLabel.style.display = "none";

    const loginBtn = document.createElement("button");
    loginBtn.className = "loginBtn";
    loginBtn.type = "submit";
    loginBtn.textContent = "Log In";
    document.querySelector(".buttons").appendChild(loginBtn);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const q = query(usersRef, where("telegram", "==", telegramInput.value.trim()));
      const querySnapshot = await getDocs(q);

      let foundUser = null;
      querySnapshot.forEach((doc) => {
        const user = doc.data();
        if (user.password === passwordInput.value) {
          foundUser = user;
        }
      });

      if (!foundUser) {
        alert("Incorrect telegram or password");
        return;
      }

      window.location.href = "../src/profile.html";
      localStorage.setItem("telegram", telegramInput.value);
      localStorage.setItem("goodTG", true);
      console.log("Logged in:", foundUser);
    }, { once: true });
  });

  // ✅ SIGN UP NEW USER
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (nameInput.style.display === "none") return;

    try {
      const q = query(usersRef, where("telegram", "==", telegramInput.value.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        alert("This telegram is already in use. Try Logging In");
        return;
      }

      await addDoc(usersRef, {
        name: nameInput.value.trim(),
        accID: generateID(12),
        eBalance: 0,
        status: telegramInput.value.trim() === "@AzizbekEshimov" ? "Admin" : "User",
        password: passwordInput.value,
        telegram: telegramInput.value.trim(),
      });

      window.location.href = "../src/profile.html";
      successAlert.style.display = "flex";
      localStorage.setItem("telegram", telegramInput.value);
      localStorage.setItem("goodTG", true);
      form.reset();
    } catch (error) {
      console.error("Error:", error);
      alert("Signup failed. Try again.");
    }
  });

  // ❌ CLOSE SUCCESS ALERT
  xBtn.onclick = () => {
    successAlert.style.display = "none";
  };
}
