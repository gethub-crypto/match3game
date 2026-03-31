// ================= GLOBAL =================
let currentLevel = 1;
let levelData = null;

let movesLeft = 0;
let score = 0;
let collected = 0;

const SIZE = 8;
const COLORS = ["red", "blue", "green", "yellow", "purple"];

let board = [];
let selected = null;


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
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  board = [];

  for (let y = 0; y < SIZE; y++) {
    board[y] = [];

    for (let x = 0; x < SIZE; x++) {

      let color;

      // ❗ НЕ создаём сразу совпадения
      do {
        color = randomColor();
        board[y][x] = color;
      } while (hasMatchAt(x, y));

      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;

      setColor(cell, color);
      cell.onclick = () => onCellClick(x, y);

      boardEl.appendChild(cell);
    }
  }
}


// ================= ПРОВЕРКА НА СТАРТОВЫЕ МАТЧИ =================
function hasMatchAt(x, y) {
  const color = board[y][x];

  // горизонталь
  if (x >= 2 &&
      board[y][x - 1] === color &&
      board[y][x - 2] === color) {
    return true;
  }

  // вертикаль
  if (y >= 2 &&
      board[y - 1][x] === color &&
      board[y - 2][x] === color) {
    return true;
  }

  return false;
}


// ================= COLOR =================
function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function setColor(cell, color) {
  cell.style.background = color;
}


// ================= CLICK =================
function onCellClick(x, y) {
  if (!selected) {
    selected = { x, y };
    return;
  }

  const dx = Math.abs(selected.x - x);
  const dy = Math.abs(selected.y - y);

  if (dx + dy !== 1) {
    selected = null;
    return;
  }

  swap(selected, { x, y });

  const matches = checkMatches();

  if (matches.length === 0) {
    swap(selected, { x, y }); // отмена
  } else {
    movesLeft--;
    processMatches();
  }

  selected = null;
  updateHUD();
}


// ================= SWAP =================
function swap(a, b) {
  const temp = board[a.y][a.x];
  board[a.y][a.x] = board[b.y][b.x];
  board[b.y][b.x] = temp;

  renderBoard();
}


// ================= RENDER =================
function renderBoard() {
  const cells = document.querySelectorAll('.cell');

  cells.forEach(cell => {
    const x = cell.dataset.x;
    const y = cell.dataset.y;
    setColor(cell, board[y][x]);
  });
}


// ================= MATCHES =================
function checkMatches() {
  let matches = [];

  // горизонталь
  for (let y = 0; y < SIZE; y++) {
    let count = 1;

    for (let x = 1; x < SIZE; x++) {
      if (board[y][x] === board[y][x - 1]) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = 0; i < count; i++) {
            matches.push({ x: x - 1 - i, y });
          }
        }
        count = 1;
      }
    }

    if (count >= 3) {
      for (let i = 0; i < count; i++) {
        matches.push({ x: SIZE - 1 - i, y });
      }
    }
  }

  // вертикаль
  for (let x = 0; x < SIZE; x++) {
    let count = 1;

    for (let y = 1; y < SIZE; y++) {
      if (board[y][x] === board[y - 1][x]) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = 0; i < count; i++) {
            matches.push({ x, y: y - 1 - i });
          }
        }
        count = 1;
      }
    }

    if (count >= 3) {
      for (let i = 0; i < count; i++) {
        matches.push({ x, y: SIZE - 1 - i });
      }
    }
  }

  return matches;
}


// ================= PROCESS =================
function processMatches() {
  let matches = checkMatches();

  if (matches.length === 0) {
    checkWin();
    return;
  }

  matches.forEach(m => {
    const color = board[m.y][m.x];

    // начисление очков
    score += 50;

    // collect только нужного цвета
    if (levelData.type === "collect") {
      if (!levelData.colors || color === levelData.colors) {
        collected++;
      }
    }

    board[m.y][m.x] = null;
  });

  drop();
  renderBoard();

  setTimeout(processMatches, 250);
}


// ================= DROP =================
function drop() {
  for (let x = 0; x < SIZE; x++) {
    for (let y = SIZE - 1; y >= 0; y--) {

      if (board[y][x] === null) {
        for (let k = y - 1; k >= 0; k--) {
          if (board[k][x] !== null) {
            board[y][x] = board[k][x];
            board[k][x] = null;
            break;
          }
        }
      }

      if (board[y][x] === null) {
        board[y][x] = randomColor();
      }
    }
  }
}


// ================= HUD =================
function updateHUD() {
  document.getElementById('movesDisplay').innerText = `Ходы: ${movesLeft}`;

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
  if (levelData.type === "score" && score >= levelData.target) {
    winLevel();
    return;
  }

  if (levelData.type === "collect" && collected >= levelData.target) {
    winLevel();
    return;
  }

  if (movesLeft <= 0) {
    loseLevel();
  }
}


// ================= WIN / LOSE =================
//function winLevel() {
 // showPopup(`<h2>Победа!</h2><button onclick="nextLevel()">Далее</button>`);
//} 
function winLevel() {
  showPopup(`
    <h2>Победа!</h2>
    <p>Награда: ${levelData.reward} монет</p>
    <button onclick="nextLevel()">Далее</button>
  `);
}

function loseLevel() {
  showPopup(`<h2>Поражение</h2><button onclick="restartLevel()">Заново</button>`);
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


 //----- COIN--- 
function updateCoinsUI() {
  const el = document.getElementById("coinsDisplay");
  if (el) {
    el.innerText = "💰 " + getCoins();
  }
}
