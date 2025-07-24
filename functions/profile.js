import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
      import {
        getFirestore,
        collection,
        query,
        where,
        getDocs,
      } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

      window.addEventListener("load", fetchUserByTelegram);

      async function fetchUserByTelegram() {
        const telegramHandle = localStorage.getItem("telegram");

        if (!telegramHandle) {
          window.location.href = "../index.html";
          return;
        }

        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("telegram", "==", telegramHandle));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            alert("No user found with this Telegram handle.");
            return;
          }

          const userDoc = querySnapshot.docs[0];
          const user = userDoc.data();

          document.getElementById("profile-name").childNodes[0].textContent = user.name || "Unnamed";
          document.getElementById("telegram").innerText = user.telegram;
          document.getElementById("accID").innerText = user.accID;
          document.getElementById("balance").innerText = user.eBalance;
          document.getElementById("status").innerText = user.status;
          document.getElementById("avatar").innerText = user.name?.charAt(0).toUpperCase() || "E";

          const badgeEl = document.getElementById("badge");

          if (user.badge) {
            badgeEl.textContent = `🏅 ${user.badge}`;
            badgeEl.style.display = "inline-block";

            const badgeType = user.badge.toLowerCase();
            if (badgeType === "vip") badgeEl.style.backgroundColor = "gold";
            else if (badgeType === "founder") badgeEl.style.backgroundColor = "#9b59b6";
            else if (badgeType === "mod") badgeEl.style.backgroundColor = "#3498db";
            else badgeEl.style.backgroundColor = "gray";
          } else {
            badgeEl.style.display = "none";
          }

        } catch (error) {
          console.error("Failed to fetch user from Firebase:", error);
          alert("Error loading user data.");
        }
      }

      document.getElementById("mineEshim").addEventListener("click", () => {
        window.location.href = "./search-codes.html";
      });

      document.getElementById("transactionBtn").addEventListener("click", () => {
        window.location.href = "./transactions.html";
      });

      document.getElementById("withdrawBtn").addEventListener("click", () => {
        window.location.href = "./wApply.html";
      });

      document.getElementById("buyBtn").addEventListener("click", () => {
        window.location.href = "./buy.html";
      });

      document.getElementById("auctionBtn").addEventListener("click", () => {
        window.location.href = "./auction.html";
      });

      document.getElementById("quitBtn").addEventListener("click", () => {
        localStorage.removeItem("telegram");
        window.location.reload();
      });