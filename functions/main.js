import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const usersRef = collection(db, "users");

if (localStorage.getItem("telegram")) {
  window.location.href = "../src/profile.html";
} else {
  const nameInput = document.querySelector(".nameInput");
  const passwordInput = document.querySelector(".passwordInput");
  const telegramInput = document.querySelector(".telegramInput");
  const signupBtn = document.querySelector(".signupBtn");
  const form = document.querySelector(".form");
  const loginLink = document.querySelector(".loginLink");
  const nameLabel = document.querySelector(".nameLabel");
  const successAlert = document.querySelector(".success-alert");

  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567891234567890";
  function generateID(length) {
    let id = "";
    for (let i = 0; i < length; i++) {
      id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
  }

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

    form.addEventListener(
      "submit",
      async (e) => {
        e.preventDefault();

        const tg = telegramInput.value.trim();
        const pw = passwordInput.value;

        const q = query(usersRef, where("telegram", "==", tg));
        const querySnapshot = await getDocs(q);

        let foundUser = null;
        querySnapshot.forEach((doc) => {
          const user = doc.data();
          if (user.password === pw) {
            foundUser = user;
          }
        });

        if (!foundUser) {
          alert("Incorrect telegram or password");
          return;
        }

        localStorage.setItem("telegram", foundUser.telegram);
        localStorage.setItem("accID", foundUser.accID);
        localStorage.setItem("goodTG", true);

        window.location.href = "../src/profile.html";
      },
      { once: true }
    );
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (nameInput.style.display === "none") return;

    try {
      const tg = telegramInput.value.trim();
      const pw = passwordInput.value;
      const name = nameInput.value.trim();

      const q = query(usersRef, where("telegram", "==", tg));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        alert("This telegram is already in use. Try Logging In");
        return;
      }

      const newUser = {
        name,
        accID: generateID(12),
        eBalance: 0,
        status: tg === "@AzizbekEshimov" ? "Admin" : "User",
        password: pw,
        telegram: tg,
      };

      console.log("Registering new user:", newUser);
      await addDoc(usersRef, newUser);

      localStorage.setItem("telegram", newUser.telegram);
      localStorage.setItem("accID", newUser.accID);
      localStorage.setItem("goodTG", true);

      if (successAlert) successAlert.style.display = "flex";

      window.location.href = "../src/profile.html";
      form.reset();
    } catch (error) {
      console.error("Error during signup:", error);
      alert("Signup failed. Try again.");
    }
  });
}
