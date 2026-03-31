// ================= GLOBAL =================
let currentLevel = 1;
let levelData = null;

let movesLeft = 0;
let score = 0;
let collected = 0;


// ================= INIT =================
async function init() {
  LivesSystem.init();
  await Levels.load();
  updateScreens();
  updateCoinsUI();
}

window.onload = init;


// ================= START LEVEL =================
function startLevel() {
  goTo('game');
  initLevel();
}


// ================= INIT LEVEL =================
function initLevel() {

  if (!LivesSystem.useLife()) {
    goTo('map');
    return;
  }

  levelData = Levels.get(currentLevel);

  createBoard(); // из match3.js
  startGameplay();
}


// ================= GAMEPLAY =================
function startGameplay() {

  movesLeft = levelData.moves;
  score = 0;
  collected = 0;

  updateHUD();
}


// ================= HUD =================
function updateHUD() {

  document.getElementById('movesDisplay').innerText =
    `Ходы: ${movesLeft}`;

  if (levelData.type === "score") {

    document.getElementById('targetDisplay').innerText =
      `Цель: ${score} / ${levelData.target}`;

  }

  if (levelData.type === "collect") {

    document.getElementById('targetDisplay').innerText =
      `Собрано: ${collected} / ${levelData.target}`;

  }

}


// ================= CHECK =================
function checkWin() {

  if (levelData.type === "score" &&
      score >= levelData.target) {

    winLevel();
    return;

  }

  if (levelData.type === "collect" &&
      collected >= levelData.target) {

    winLevel();
    return;

  }

  if (movesLeft <= 0) {
    loseLevel();
  }

}


// ================= WIN =================
function winLevel() {

  addCoins(levelData.reward);

  showPopup(`
    <h2>Победа!</h2>
    <p>Награда: ${levelData.reward} монет</p>
    <button onclick="nextLevel()">Далее</button>
  `);

}


function loseLevel() {

  showPopup(`
    <h2>Поражение</h2>
    <button onclick="restartLevel()">Заново</button>
  `);

}


function nextLevel() {

  currentLevel++;

  hidePopup();

  initLevel();

}


function restartLevel() {

  hidePopup();

  initLevel();

}


// ================= COINS =================
function updateCoinsUI() {

  const el = document.getElementById("coinsDisplay");

  if (el) {
    el.innerText = "💰 " + getCoins();
  }

      }
