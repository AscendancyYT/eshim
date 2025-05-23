// main check

if (localStorage.getItem("telegram")) {
  window.location.href = "../src/profile.html";
} else {
  // DOM elements
  let nameInput = document.querySelector(".nameInput");
  let passwordInput = document.querySelector(".passwordInput");
  let telegramInput = document.querySelector(".telegramInput");
  let signupBtn = document.querySelector(".signupBtn");
  let form = document.querySelector(".form");
  let loginLink = document.querySelector(".loginLink");
  let nameLabel = document.querySelector(".nameLabel");
  let xBtn = document.querySelector(".x-btn");
  let successAlert = document.querySelector(".success-alert");

  // Constants
  const DB_API = CONFIG.USERS_API;
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567891234567890";

  function generateID(length) {
    let id = "";
    for (let i = 0; i < length; i++) {
      id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
  }

  loginLink.addEventListener("click", function (e) {
    e.preventDefault();

    nameInput.style.display = "none";
    signupBtn.remove();
    loginLink.remove();
    nameLabel.style.display = "none";

    // Create Login Button
    const loginBtn = document.createElement("button");
    loginBtn.className = "loginBtn";
    loginBtn.type = "submit";
    loginBtn.textContent = "Log In";
    document.querySelector(".buttons").appendChild(loginBtn);

    // Switch form logic
    form.addEventListener(
      "submit",
      async function (e) {
        e.preventDefault();

        try {
          const response = await axios.get(DB_API);
          const user = response.data.find(
            (u) =>
              u.telegram === telegramInput.value.trim() &&
              u.password === passwordInput.value
          );

          if (!user) {
            alert("Incorrect telegram or password");
            return;
          }

          window.location.href = "../src/profile.html";
          localStorage.setItem("telegram", telegramInput.value);

          localStorage.setItem("goodTG", true);
          console.log("Logged in:", user);
        } catch (error) {
          console.log("Login error:", error);
          alert("Login failed. Try again later.");
        }
      },
      { once: true }
    );
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (nameInput.style.display === "none") return;

    try {
      let response = await axios.get(DB_API);
      let userExists = response.data.some(
        (user) => user.telegram === telegramInput.value.trim()
      );

      if (userExists) {
        alert("This telegram is already in use. Try Logging In");
        return;
      }

      await axios.post(DB_API, {
        name: nameInput.value.trim(),
        accID: generateID(12),
        eBalance: 0,
        status:
          telegramInput.value.trim() === "@AzizbekEshimov" ? "Admin" : "User",
        password: passwordInput.value,
        telegram: telegramInput.value.trim(),
      });

      window.location.href = "../src/profile.html";
      successAlert.style.display = "flex";
      localStorage.setItem("telegram", telegramInput.value);
      localStorage.setItem("goodTG", true);
      form.reset();
    } catch (error) {
      console.log("Error", error);
      alert("Signup failed. Try again.");
    }
  });

  xBtn.onclick = () => {
    successAlert.style.display = "none";
  };
}
