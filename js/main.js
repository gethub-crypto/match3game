
// ================= GLOBAL =================
let currentLevel = 1;
let levelData = null;

let movesLeft = 0;
let score = 0;
let collected = 0;


// ================= INIT =================
async function init() {
  console.log("Game started");

  LivesSystem.init();

  await Levels.load(); // загрузка CSV

  updateScreens();
}

window.onload = init;


// ================= START LEVEL =================
function startLevel() {
  goTo('game');
  initLevel();
}


// ================= INIT LEVEL =================
function initLevel() {
  // проверка жизней
  if (!LivesSystem.useLife()) {
    goTo('map');
    return;
  }

  levelData = Levels.get(currentLevel);

  if (!levelData) {
    alert("Нет данных уровня");
    return;
  }

  console.log("Level:", levelData);

  createBoard();
  startGameplay();
}


// ================= GAMEPLAY =================
function startGameplay() {
  movesLeft = levelData.moves;
  score = 0;
  collected = 0;

  updateHUD();
}


// ================= BOARD =================
function createBoard() {
  const board = document.getElementById('board');
  if (!board) return;

  board.innerHTML = '';

  for (let i = 0; i < 64; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';

    // ТЕСТ: клик = ход
    cell.onclick = () => {
      if (movesLeft <= 0) return;

      movesLeft--;

      // тест логики
      score += 100;

      if (levelData.type === "collect") {
        collected++;
      }

      updateHUD();
      checkWin();
    };

    board.appendChild(cell);
  }
}


// ================= HUD =================
function updateHUD() {
  const movesEl = document.getElementById('movesDisplay');
  const targetEl = document.getElementById('targetDisplay');

  if (movesEl) {
    movesEl.innerText = `Ходы: ${movesLeft}`;
  }

  if (targetEl) {
    if (levelData.type === "score") {
      targetEl.innerText = `Цель: ${score} / ${levelData.target}`;
    }

    if (levelData.type === "collect") {
      targetEl.innerText = `Собрано: ${collected} / ${levelData.target}`;
    }
  }
}


// ================= CHECK =================
function checkWin() {
  if (levelData.type === "score") {
    if (score >= levelData.target) {
      winLevel();
      return;
    }
  }

  if (levelData.type === "collect") {
    if (collected >= levelData.target) {
      winLevel();
      return;
    }
  }

  if (movesLeft <= 0) {
    loseLevel();
  }
}


// ================= WIN =================
function winLevel() {
  showPopup(`
    <h2>Победа!</h2>
    <p>Награда: ${levelData.reward} монет</p>
    <button onclick="nextLevel()">Далее</button>
  `);
}


// ================= LOSE =================
function loseLevel() {
  showPopup(`
    <h2>Поражение</h2>
    <button onclick="restartLevel()">Заново</button>
  `);
}


// ================= NEXT =================
function nextLevel() {
  currentLevel++;
  hidePopup();
  initLevel();
}


// ================= RESTART =================
function restartLevel() {
  hidePopup();
  initLevel();
}







