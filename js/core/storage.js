const Storage = { get(key, def)
{ return JSON.parse(localStorage.getItem(key)) ?? def; }, 
set(key, value) { localStorage.setItem(key, JSON.stringify(value)); } };

// ================= COINS =================

function getCoins() {
  return parseInt(localStorage.getItem("coins") || "0");
}

function addCoins(amount) {
  const current = getCoins();
  const total = current + amount;

  localStorage.setItem("coins", total);

  updateCoinsUI();
}

// ================= LEVEL PROGRESS =================

function getCompletedLevels() {
  return Storage.get("completedLevels", []);
}

function completeLevel(levelId) {
  const completed = getCompletedLevels();
  if (!completed.includes(levelId)) {
    completed.push(levelId);
    Storage.set("completedLevels", completed);
  }
}

function isLevelUnlocked(levelId) {
  if (levelId === 1) return true;
  const completed = getCompletedLevels();
  return completed.includes(levelId - 1);
}
