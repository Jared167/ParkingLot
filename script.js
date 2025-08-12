const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");
const coinCounter = document.getElementById("coinCounter");
const winCounter = document.getElementById("winCounter");

const shopBtn = document.getElementById("shopBtn");
const shopModal = document.getElementById("shopModal");
const closeShopBtn = document.getElementById("closeShop");
const shopItemsContainer = document.getElementById("shopItems");
const shopCoinsDisplay = document.getElementById("shopCoins");

const rebirthBtn = document.getElementById("rebirthBtn");

// Base levels
const baseLevels = [
  {
    parkingSpot: { x: 500, y: 150, width: 60, height: 30 },
    surroundingCars: [
      { x: 500, y: 120, width: 40, height: 20 },
      { x: 460, y: 150, width: 40, height: 20 },
      { x: 580, y: 150, width: 40, height: 20 },
    ],
  },
  {
    parkingSpot: { x: 100, y: 50, width: 60, height: 30 },
    surroundingCars: [
      { x: 100, y: 20, width: 40, height: 20 },
      { x: 60, y: 50, width: 40, height: 20 },
      { x: 180, y: 50, width: 40, height: 20 },
    ],
  },
  {
    parkingSpot: { x: 300, y: 300, width: 60, height: 30 },
    surroundingCars: [
      { x: 300, y: 270, width: 40, height: 20 },
      { x: 260, y: 300, width: 40, height: 20 },
      { x: 380, y: 300, width: 40, height: 20 },
    ],
  },
  {
    parkingSpot: { x: 40, y: 360, width: 70, height: 40 },
    surroundingCars: [
      { x: 20, y: 320, width: 40, height: 20 },
      { x: 100, y: 350, width: 40, height: 20 },
      { x: 50, y: 380, width: 40, height: 20 },
    ],
  },
  {
    parkingSpot: { x: 450, y: 50, width: 60, height: 30 },
    surroundingCars: [
      { x: 450, y: 20, width: 40, height: 20 },
      { x: 410, y: 50, width: 40, height: 20 },
      { x: 530, y: 50, width: 40, height: 20 },
    ],
  },
  {
    parkingSpot: { x: 200, y: 180, width: 60, height: 30 },
    surroundingCars: [
      { x: 200, y: 150, width: 40, height: 20 },
      { x: 160, y: 180, width: 40, height: 20 },
      { x: 280, y: 180, width: 40, height: 20 },
    ],
  },
  {
    parkingSpot: { x: 350, y: 80, width: 60, height: 30 },
    surroundingCars: [
      { x: 350, y: 50, width: 40, height: 20 },
      { x: 310, y: 80, width: 40, height: 20 },
      { x: 430, y: 80, width: 40, height: 20 },
    ],
  },
  {
    parkingSpot: { x: 100, y: 250, width: 60, height: 30 },
    surroundingCars: [
      { x: 100, y: 220, width: 40, height: 20 },
      { x: 60, y: 250, width: 40, height: 20 },
      { x: 180, y: 250, width: 40, height: 20 },
    ],
  },
  {
    parkingSpot: { x: 500, y: 300, width: 60, height: 30 },
    surroundingCars: [
      { x: 500, y: 270, width: 40, height: 20 },
      { x: 460, y: 300, width: 40, height: 20 },
      { x: 580, y: 300, width: 40, height: 20 },
    ],
  },
  {
    parkingSpot: { x: 250, y: 120, width: 60, height: 30 },
    surroundingCars: [
      { x: 250, y: 90, width: 40, height: 20 },
      { x: 210, y: 120, width: 40, height: 20 },
      { x: 330, y: 120, width: 40, height: 20 },
    ],
  },
];

let levels = [...baseLevels]; // current level list (can grow with rebirth)

let level = 0;
let car = { x: 50, y: 300, width: 40, height: 20, speed: 2 };
let keys = {};

let crashed = false;
let parked = false;
let crashedThisLevel = false;

let scatteredCars = [];
let coins = 0;
let wins = 0; // total wins (levels completed)

let rebirthCount = 0; // track how many rebirths done

// Base rebirth cost
const baseRebirthWinsCost = 10;
const baseRebirthCoinsCost = 20;

// Shop upgrades
const shopUpgrades = [
  {
    id: "speed",
    name: "Speed Upgrade",
    description: "Increase car speed by 1",
    price: 20,
    purchased: false,
    applyUpgrade: () => {
      car.speed += 1;
    },
  },
  {
    id: "skip",
    name: "Level Skipper",
    description:
      "Skip current level instantly (Costs coins, adds 1 win each use)",
    price: 15,
    purchased: false, // ignore purchased for infinite purchase
    applyUpgrade: () => {
      // On purchase, skip level and add a win
      if (coins < shopUpgrades[1].price) {
        alert("Not enough coins!");
        return false;
      }
      coins -= shopUpgrades[1].price;
      wins += 1;
      saveProgress();
      coinCounter.textContent = coins;
      winCounter.textContent = wins;

      // Skip level logic
      level = Math.min(level + 1, levels.length - 1);
      crashed = false;
      parked = false;
      crashedThisLevel = false;
      resetCar();
      generateScatteredCars(level);
      restartBtn.style.display = "none";
      update();

      return true;
    },
  },
];

restartBtn.addEventListener("click", restartLevel);
shopBtn.addEventListener("click", openShop);
closeShopBtn.addEventListener("click", closeShop);
rebirthBtn.addEventListener("click", tryRebirth);

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  if ((crashed || parked) && (e.key === "r" || e.key === "R")) {
    restartLevel();
  }
});
document.addEventListener("keyup", (e) => (keys[e.key] = false));

function getRebirthCost() {
  // Cost increases by rebirthCount times the increments
  return {
    wins: baseRebirthWinsCost + rebirthCount * 10,
    coins: baseRebirthCoinsCost + rebirthCount * 5,
  };
}

function updateRebirthButton() {
  const cost = getRebirthCost();
  rebirthBtn.textContent = `Rebirth (Cost: ${cost.wins} Wins + ${cost.coins} Coins)`;
}

function tryRebirth() {
  const cost = getRebirthCost();
  if (wins < cost.wins) {
    alert(`You need at least ${cost.wins} wins to rebirth!`);
    return;
  }
  if (coins < cost.coins) {
    alert(`You need at least ${cost.coins} coins to rebirth!`);
    return;
  }

  if (
    confirm(
      `Rebirth costs ${cost.wins} wins and ${cost.coins} coins. This will reset your current progress but add 10 more levels. Proceed?`
    )
  ) {
    // subtract wins cost
    wins -= cost.wins;
    // RESET coins to 0 as requested
    coins = 0;

    rebirthCount++;

    // Add 10 levels by duplicating baseLevels again (wrap-around)
    for (let i = 0; i < 10; i++) {
      levels.push(baseLevels[i % baseLevels.length]);
    }

    // Reset game progress but keep upgrades (upgrades persist) and reset coins to 0
    level = 0;
    crashed = false;
    parked = false;
    crashedThisLevel = false;
    resetCar();
    generateScatteredCars(level);
    restartBtn.style.display = "none";

    // Update UI
    coinCounter.textContent = coins;
    winCounter.textContent = wins;

    updateRebirthButton();

    saveProgress();

    alert(`Rebirth successful! 10 more levels added. Your coins were reset to 0.`);
    update();
  }
}

function restartLevel() {
  crashed = false;
  parked = false;
  crashedThisLevel = false;
  resetCar();
  generateScatteredCars(level);
  restartBtn.style.display = "none";
  update();
  saveProgress();
}

function resetCar() {
  car.x = 50;
  car.y = 300;
}

function generateScatteredCars(levelNum) {
  scatteredCars = [];
  const numberOfCars = levelNum + 4;

  const parkingSpot = levels[levelNum].parkingSpot;
  const surroundingCars = levels[levelNum].surroundingCars;

  for (let i = 0; i < numberOfCars; i++) {
    let pos;
    let tries = 0;
    do {
      pos = {
        x: Math.floor(Math.random() * (canvas.width - 40)),
        y: Math.floor(Math.random() * (canvas.height - 20)),
        width: 40,
        height: 20,
      };
      tries++;
    } while (
      (isOverlapping(pos, parkingSpot) ||
        surroundingCars.some((c) => isOverlapping(pos, c)) ||
        scatteredCars.some((c) => isOverlapping(pos, c))) &&
      tries < 100
    );
    scatteredCars.push(pos);
  }
}

function isOverlapping(r1, r2) {
  return !(
    r1.x + r1.width < r2.x ||
    r1.x > r2.x + r2.width ||
    r1.y + r1.height < r2.y ||
    r1.y > r2.y + r2.height
  );
}

function update() {
  if (crashed) {
    crashedThisLevel = true;
    draw();
    drawCrashScreen();
    restartBtn.style.display = "block";
    return;
  }

  if (!parked) {
    if (keys["ArrowUp"]) car.y -= car.speed;
    if (keys["ArrowDown"]) car.y += car.speed;
    if (keys["ArrowLeft"]) car.x -= car.speed;
    if (keys["ArrowRight"]) car.x += car.speed;
  }

  if (car.x < 0) car.x = 0;
  if (car.y < 0) car.y = 0;
  if (car.x + car.width > canvas.width) car.x = canvas.width - car.width;
  if (car.y + car.height > canvas.height) car.y = canvas.height - car.height;

  const parkingSpot = levels[level].parkingSpot;
  const surroundingCars = levels[level].surroundingCars;

  for (const pCar of [...surroundingCars, ...scatteredCars]) {
    if (isColliding(car, pCar)) {
      crashed = true;
      restartBtn.style.display = "block";
      saveProgress();
      break;
    }
  }

  if (
    !crashed &&
    !parked &&
    car.x > parkingSpot.x &&
    car.x + car.width < parkingSpot.x + parkingSpot.width &&
    car.y > parkingSpot.y &&
    car.y + car.height < parkingSpot.y + parkingSpot.height
  ) {
    parked = true;
    restartBtn.style.display = "block";

    // Award coins and wins only if no crash this level
    if (!crashedThisLevel) {
      coins += 5;
      wins += 1;
      coinCounter.textContent = coins;
      winCounter.textContent = wins;
      saveProgress();
    }

    if (level < levels.length - 1) {
      level++;
      setTimeout(() => {
        alert(`Level ${level} complete! Get ready for level ${level + 1}.`);
        crashed = false;
        parked = false;
        crashedThisLevel = false;
        resetCar();
        generateScatteredCars(level);
        restartBtn.style.display = "none";
        update();
        saveProgress();
      }, 1000);
    } else {
      setTimeout(() => {
        alert(
          `🎉 You parked perfectly through all levels! You earned ${coins} coins and ${wins} wins! You win! 🎉`
        );
      }, 1000);
    }
  }

  draw();
  if (!crashed && !parked) requestAnimationFrame(update);
}

function isColliding(r1, r2) {
  return !(
    r1.x + r1.width < r2.x ||
    r1.x > r2.x + r2.width ||
    r1.y + r1.height < r2.y ||
    r1.y > r2.y + r2.height
  );
}

// === PIXEL CAR DRAWING ===
// Draw a pixelated car at (x, y) with given color
function drawPixelCar(x, y, color) {
  // Car is 40x20 pixels total
  ctx.fillStyle = color;

  // Car body
  ctx.fillRect(x + 4, y + 4, 32, 12); // main body
  ctx.fillRect(x, y + 8, 4, 8); // front bumper
  ctx.fillRect(x + 36, y + 8, 4, 8); // rear bumper

  // Windows (lighter color)
  ctx.fillStyle = "#a0c8ff";
  ctx.fillRect(x + 10, y + 6, 8, 6); // front window
  ctx.fillRect(x + 22, y + 6, 8, 6); // rear window

  // Tires (black)
  ctx.fillStyle = "black";
  ctx.fillRect(x + 6, y + 16, 8, 4); // front tire
  ctx.fillRect(x + 26, y + 16, 8, 4); // rear tire
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw parking spot green box
  const spot = levels[level].parkingSpot;
  ctx.fillStyle = "green";
  ctx.fillRect(spot.x, spot.y, spot.width, spot.height);

  // Draw surrounding cars (blue pixel cars)
  levels[level].surroundingCars.forEach((pCar) => {
    drawPixelCar(pCar.x, pCar.y, "blue");
  });

  // Draw scattered cars (red pixel cars)
  scatteredCars.forEach((cCar) => {
    drawPixelCar(cCar.x, cCar.y, "red");
  });

  // Draw player's car (orange pixel car)
  drawPixelCar(car.x, car.y, "#ff7f00");

  // Draw coins and wins on canvas
  ctx.fillStyle = "black";
  ctx.font = "18px Arial";
  ctx.fillText(`Coins: ${coins}`, 10, 20);
  ctx.fillText(`Wins: ${wins}`, 10, 40);
  ctx.fillText(`Level: ${level + 1}/${levels.length}`, 10, 60);
  ctx.fillText(`Rebirths: ${rebirthCount}`, 10, 80);
}

function drawCrashScreen() {
  ctx.fillStyle = "rgba(255,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "40px Arial";
  ctx.fillText("CRASHED!", canvas.width / 2 - 100, canvas.height / 2);
}

// --- SHOP ---

function openShop() {
  shopCoinsDisplay.textContent = coins;
  shopModal.style.display = "block";
  renderShopItems();
}

function closeShop() {
  shopModal.style.display = "none";
}

function renderShopItems() {
  shopItemsContainer.innerHTML = "";
  shopUpgrades.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "buy-btn";

    if (item.id === "skip") {
      btn.textContent = `${item.name} - Cost: ${item.price} coins (Use to skip level)`;
    } else {
      btn.textContent = `${item.name} - Cost: ${item.price} coins`;
    }

    btn.disabled = item.purchased && item.id !== "skip";
    btn.title = item.description;

    btn.addEventListener("click", () => {
      if (item.id === "skip") {
        // special case: use skip
        if (item.applyUpgrade()) {
          shopCoinsDisplay.textContent = coins;
          coinCounter.textContent = coins;
          winCounter.textContent = wins;
          saveProgress();
        }
      } else {
        if (coins >= item.price && !item.purchased) {
          coins -= item.price;
          item.purchased = true;
          item.applyUpgrade();
          btn.disabled = true;
          shopCoinsDisplay.textContent = coins;
          coinCounter.textContent = coins;
          saveProgress();
          alert(`${item.name} purchased!`);
        } else if (item.purchased) {
          alert("You already own this upgrade.");
        } else {
          alert("Not enough coins!");
        }
      }
    });

    shopItemsContainer.appendChild(btn);
  });
}

// --- PERSISTENCE ---

const STORAGE_KEYS = {
  progress: "parkingGameProgress",
  upgrades: "parkingGameUpgrades",
  rebirth: "parkingGameRebirth",
};

function saveProgress() {
  const progressData = {
    coins,
    wins,
    level,
    carSpeed: car.speed,
  };
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progressData));

  const upgradesData = shopUpgrades.map((u) => ({
    id: u.id,
    purchased: u.purchased,
  }));
  localStorage.setItem(STORAGE_KEYS.upgrades, JSON.stringify(upgradesData));

  const rebirthData = {
    rebirthCount,
    levelsCount: levels.length,
  };
  localStorage.setItem(STORAGE_KEYS.rebirth, JSON.stringify(rebirthData));
}

function loadProgress() {
  const progressStr = localStorage.getItem(STORAGE_KEYS.progress);
  const upgradesStr = localStorage.getItem(STORAGE_KEYS.upgrades);
  const rebirthStr = localStorage.getItem(STORAGE_KEYS.rebirth);

  if (progressStr) {
    const progress = JSON.parse(progressStr);
    coins = progress.coins || 0;
    wins = progress.wins || 0;
    level = progress.level || 0;
    car.speed = progress.carSpeed || 2;
  }
  if (upgradesStr) {
    const upgradesData = JSON.parse(upgradesStr);
    upgradesData.forEach((uData) => {
      const u = shopUpgrades.find((s) => s.id === uData.id);
      if (u) {
        u.purchased = uData.purchased;
        if (u.purchased && u.id !== "skip") {
          u.applyUpgrade();
        }
      }
    });
  }
  if (rebirthStr) {
    const rebirthData = JSON.parse(rebirthStr);
    rebirthCount = rebirthData.rebirthCount || 0;

    // Rebuild levels if rebirth was done (length > baseLevels)
    if (rebirthData.levelsCount && rebirthData.levelsCount > baseLevels.length) {
      levels = [...baseLevels];
      // add extra levels for each rebirth
      const extra = rebirthData.levelsCount - baseLevels.length;
      for (let i = 0; i < extra; i++) {
        levels.push(baseLevels[i % baseLevels.length]);
      }
    }
  }
  updateRebirthButton();
  coinCounter.textContent = coins;
  winCounter.textContent = wins;
}

// On load
loadProgress();
resetCar();
generateScatteredCars(level);
update();

window.addEventListener("beforeunload", () => {
  saveProgress();
});
