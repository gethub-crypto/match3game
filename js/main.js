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
      const color = randomColor();

      board[y][x] = color;

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

  if (checkMatches().length === 0) {
    // отмена
    swap(selected, { x, y });
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
    board[m.y][m.x] = null;
    score += 100;

    if (levelData.type === "collect") {
      collected++;
    }
  });

  drop();
  renderBoard();

  setTimeout(processMatches, 300);
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
  }

  if (levelData.type === "collect" && collected >= levelData.target) {
    winLevel();
  }

  if (movesLeft <= 0) {
    loseLevel();
  }
}


// ================= WIN / LOSE =================
function winLevel() {
  showPopup(`<h2>Победа!</h2><button onclick="nextLevel()">Далее</button>`);
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
