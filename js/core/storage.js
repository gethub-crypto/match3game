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

