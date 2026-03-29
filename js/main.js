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
}

window.onload = init;


// ================= START =================
function startLevel() {

  goTo('gameScreen');
  initLevel();
}


// ================= LEVEL =================
function initLevel() {

  if (!LivesSystem.useLife()) {
    goTo('mapScreen');
    return;
  }

  levelData = Levels.get(currentLevel);

  if (!levelData) {
    alert("Ошибка уровня");
    return;
  }

  createBoard();

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


// ================= WIN =================
function checkWin() {

  if (levelData.type === "score" &&
      score >= levelData.target) {
    winLevel();
  }

  if (levelData.type === "collect" &&
      collected >= levelData.target) {
    winLevel();
  }

  if (movesLeft <= 0) {
    loseLevel();
  }
}


// ================= RESULT =================
function winLevel() {

  showPopup(`
    <h2>Победа!</h2>
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
