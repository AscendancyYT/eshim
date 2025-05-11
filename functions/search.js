let codes = []; // Make it globally available
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
let interval;

// Fetch the codes and populate the global array
fetch("https://67c8964c0acf98d07087272b.mockapi.io/coins")
  .then((response) => response.json())
  .then((data) => {
    data.forEach((entry) => {
      const freeCoinValues = entry.free.map((freeCoin) => freeCoin.coin);
      codes.push(...freeCoinValues); // Fill global array
    });
    console.log("Loaded free coin codes:", codes);
  })
  .catch((error) => console.error("Error fetching coins:", error));

function generateCode(length) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return code;
}

function searchCodes() {
  const btn = document.getElementById("searchBtn");
  const log = document.getElementById("log");
  const log2 = document.getElementById("log2");
  const log3 = document.getElementById("log3");
  const foundEl = document.getElementById("foundList");

  btn.disabled = true;
  log.innerHTML = "";
  log2.innerHTML = "";
  log3.innerHTML = "";
  foundEl.innerHTML = "";

  interval = setInterval(() => {
    const code1 = generateCode(5);
    const code2 = generateCode(5);
    const code3 = generateCode(5);

    updateLog(code1, log);
    updateLog(code2, log2);
    updateLog(code3, log3);

    [code1, code2, code3].forEach((code) => {
      if (codes.includes(code)) {
        const previous = JSON.parse(
          localStorage.getItem("foundCodes") || "[]"
        );

        if (!previous.includes(code)) {
          displayFoundCode(code);
          previous.push(code);
          localStorage.setItem("foundCodes", JSON.stringify(previous));
        }
      }
    });
  }, 300);
}

function updateLog(code, logElement) {
  const line = document.createElement("div");
  line.textContent = `> ${code}`;
  logElement.appendChild(line);
  logElement.scrollTop = logElement.scrollHeight;
}

function displayFoundCode(code) {
  setTimeout(() => {
    const foundEl = document.getElementById("foundList");
    const foundEntry = document.createElement("div");
    foundEntry.textContent = `> ${code}`;
    foundEl.appendChild(foundEntry);
  }, 10);
}

function stopMining() {
  clearInterval(interval);
  document.getElementById("searchBtn").disabled = false;
}