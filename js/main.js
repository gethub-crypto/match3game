// ================= ACTION LOCK MANAGER =================

class ActionLockManager {
  constructor() {
    this.locks = new Map();
    this.queue = [];
    this.isProcessing = false;
    this.currentAction = null;
  }

  async acquireLock(lockType, priority = 0) {
    return new Promise((resolve) => {
      if (!this.isProcessing || priority > 10) {
        this.isProcessing = true;
        this.currentAction = lockType;
        this.locks.set(lockType, true);
        resolve();
      } else {
        this.queue.push({ lockType, priority, resolve });
      }
    });
  }

  releaseLock(lockType) {
    this.locks.delete(lockType);
    this.currentAction = null;
    
    if (this.queue.length > 0) {
      // Сортируем по приоритету (высший первый)
      this.queue.sort((a, b) => b.priority - a.priority);
      const next = this.queue.shift();
      this.currentAction = next.lockType;
      this.locks.set(next.lockType, true);
      next.resolve();
    } else {
      this.isProcessing = false;
    }
  }

  isLocked() {
    return this.isProcessing || this.locks.size > 0;
  }

  clearAll() {
    this.queue = [];
    this.locks.clear();
    this.isProcessing = false;
    this.currentAction = null;
  }
}

// ================= GLOBAL STATE MANAGER =================

class GameStateManager {
  constructor() {
    this.state = 'idle'; // idle, animating, processing, locked
    this.allowedInputs = {
      'idle': ['tap', 'swipe'],
      'animating': [],
      'processing': [],
      'locked': []
    };
  }

  setState(newState) {
    console.log(`GameState: ${this.state} -> ${newState}`);
    this.state = newState;
  }

  canAcceptInput(inputType) {
    return this.allowedInputs[this.state]?.includes(inputType);
  }

  isAnimating() {
    return this.state === 'animating' || this.state === 'processing';
  }
}

// ================= GLOBAL =================

let currentLevel = 1;
let levelData = null;
let movesLeft = 0;
let score = 0;
let collected = 0;
let levelFinished = false;
let gameLocked = false;
let hintTimer = null;

const actionLock = new ActionLockManager();
const gameState = new GameStateManager();

const SIZE = 8;
const COLORS = ["red", "blue", "green", "yellow", "purple"];
let board = [];
let cells = [];
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
  if (actionLock.isLocked()) return;
  
  if (!LivesSystem.hasLives()) {
    LivesSystem.showNoLivesPopup();
    return;
  }
  
  goTo("game");
  initLevel();
}

// ================= INIT LEVEL =================

async function initLevel() {
  actionLock.clearAll();
  gameState.setState('idle');
  
  levelFinished = false;
  gameLocked = false;
  
  levelData = Levels.get(currentLevel);
  
  createBoard();
  startGameplay();
  startHintTimer();
}

// ================= GAMEPLAY =================

function startGameplay() {
  movesLeft = levelData.moves;
  score = 0;
  collected = 0;
  updateHUD();
}

// ================= CREATE BOARD =================

function createBoard() {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";
  
  board = [];
  cells = [];
  
  for (let y = 0; y < SIZE; y++) {
    board[y] = [];
    cells[y] = [];
    
    for (let x = 0; x < SIZE; x++) {
      let color;
      
      do {
        color = randomColor();
        board[y][x] = color;
      } while (hasMatchAt(x, y));
      
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = x;
      cell.dataset.y = y;
      
      setColor(cell, color);
      addInputHandlers(cell, x, y);
      
      boardEl.appendChild(cell);
      cells[y][x] = cell;
    }
  }
}

// ================= RANDOM =================

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// ================= START MATCH CHECK =================

function hasMatchAt(x, y) {
  const color = board[y][x];
  
  if (x >= 2 && board[y][x-1] === color && board[y][x-2] === color) return true;
  if (y >= 2 && board[y-1][x] === color && board[y-2][x] === color) return true;
  
  return false;
}

// ================= COLOR =================

function setColor(cell, data) {
  if (typeof data === "object" && data !== null) {
    if (data.special === "rocket") cell.innerHTML = "🚀";
    if (data.special === "bomb") cell.innerHTML = "💣";
    if (data.special === "color") cell.innerHTML = "🌈";
    cell.style.background = "#444";
  } else if (typeof data === "string") {
    cell.innerHTML = "";
    cell.style.background = data;
  }
}

// ================= INPUT HANDLERS (УЛУЧШЕННЫЕ) =================

function addInputHandlers(cell, x, y) {
  let startX = 0;
  let startY = 0;
  
  // Единый обработчик для всех типов взаимодействия
  cell.addEventListener("pointerdown", (e) => {
    if (!gameState.canAcceptInput('tap') || actionLock.isLocked()) return;
    
    startX = e.clientX;
    startY = e.clientY;
    selected = { x, y };
    highlightCell(x, y);
  });
  
  cell.addEventListener("pointerup", (e) => {
    if (!gameState.canAcceptInput('tap') || actionLock.isLocked()) {
      clearHighlight();
      selected = null;
      return;
    }
    
    const endX = e.clientX;
    const endY = e.clientY;
    
    const dx = endX - startX;
    const dy = endY - startY;
    
    let targetX = x;
    let targetY = y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) targetX = x + 1;
      if (dx < -30) targetX = x - 1;
    } else {
      if (dy > 30) targetY = y + 1;
      if (dy < -30) targetY = y - 1;
    }
    
    onCellClick(targetX, targetY);
  });
  
  // Предотвращаем множественные касания
  cell.addEventListener("touchstart", (e) => {
    if (!gameState.canAcceptInput('tap') || actionLock.isLocked()) {
      e.preventDefault();
      return;
    }
  }, { passive: false });
}

// ================= HIGHLIGHT =================

function highlightCell(x, y) {
  clearHints();
  
  for (let yy = 0; yy < SIZE; yy++) {
    for (let xx = 0; xx < SIZE; xx++) {
      cells[yy][xx].classList.remove("selected");
    }
  }
  
  cells[y][x].classList.add("selected");
}

function clearHighlight() {
  for (let yy = 0; yy < SIZE; yy++) {
    for (let xx = 0; xx < SIZE; xx++) {
      cells[yy][xx].classList.remove("selected");
    }
  }
}

// ================= CLICK (ЗАЩИЩЕННЫЙ) =================

async function onCellClick(x, y) {
  // МНОЖЕСТВЕННЫЕ ПРОВЕРКИ ЗАЩИТЫ
  if (gameLocked || levelFinished) return;
  if (actionLock.isLocked()) return;
  if (gameState.isAnimating()) return;
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  
  if (!selected) {
    selected = { x, y };
    highlightCell(x, y);
    return;
  }
  
  const dx = Math.abs(selected.x - x);
  const dy = Math.abs(selected.y - y);
  
  if (dx + dy !== 1) {
    clearHighlight();
    selected = null;
    return;
  }
  
  // БЛОКИРУЕМ ВВОД НА ВРЕМЯ ВСЕЙ ОПЕРАЦИИ
  await actionLock.acquireLock('swap', 1);
  gameState.setState('animating');
  
  try {
    const result = await performSwap(selected, { x, y });
    
    if (!result) {
      // Неудачный swap - откатываем
      await performSwap(selected, { x, y });
    } else {
      movesLeft--;
      await processBoardState();
    }
  } finally {
    // ГАРАНТИРОВАННО РАЗБЛОКИРУЕМ
    clearHighlight();
    selected = null;
    updateHUD();
    startHintTimer();
    
    gameState.setState('idle');
    actionLock.releaseLock('swap');
  }
}

// ================= УЛУЧШЕННЫЙ SWAP =================

async function performSwap(a, b) {
  const A = board[a.y][a.x];
  const B = board[b.y][b.x];
  
  // Выполняем swap асинхронно с анимацией
  board[a.y][a.x] = B;
  board[b.y][b.x] = A;
  
  renderBoard();
  await delay(200); // Визуальная задержка для анимации
  
  // Проверяем special tiles
  if (typeof A === "object" && A?.special) {
    await handleSpecialTile(b.x, b.y);
    return true;
  }
  
  if (typeof B === "object" && B?.special) {
    await handleSpecialTile(a.x, a.y);
    return true;
  }
  
  // Проверяем обычные matches
  const matches = MatchDetection.getMatches(board);
  return matches.length > 0;
}

// ================= ОБРАБОТКА SPECIAL =================

async function handleSpecialTile(x, y) {
  gameState.setState('processing');
  
  await Specials.activateWithDelay(x, y);
  
  board[y][x] = null;
  await processGravityAndSpawn();
  renderBoard();
  
  await processMatchesWithDelay();
  
  gameState.setState('animating');
}

// ================= ОБРАБОТКА СОСТОЯНИЯ ДОСКИ =================

async function processBoardState() {
  await processMatchesWithDelay();
  
  updateHUD();
  checkWin();
  
  if (!hasPossibleMoves()) {
    await shuffleBoard();
  }
}

// ================= УЛУЧШЕННАЯ ОБРАБОТКА МАТЧЕЙ =================

async function processMatchesWithDelay() {
  const matches = MatchDetection.getMatches(board);
  
  if (matches.length === 0) return;
  
  for (const match of matches) {
    await showMatchEffect(match);
    await delay(350);
    
    let specialCell = null;
    
    if (match.type === "rocket") specialCell = match.cells[1];
    if (match.type === "color") specialCell = match.cells[2];
    if (match.type === "bomb") specialCell = match.cells[0];
    
    for (const cellPos of match.cells) {
      if (specialCell && cellPos.x === specialCell.x && cellPos.y === specialCell.y) continue;
      
      const cell = board[cellPos.y][cellPos.x];
      
      if (typeof cell === "object" && cell !== null) {
        await Specials.activate(cellPos.x, cellPos.y);
      }
      
      score += 50;
      board[cellPos.y][cellPos.x] = null;
    }
    
    if (specialCell) {
      board[specialCell.y][specialCell.x] = {
        color: randomColor(),
        special: match.type,
        type: "special"
      };
    }
  }
  
  renderBoard();
  
  await processGravityAndSpawn();
  renderBoard();
  
  updateHUD();
  
  // Рекурсивно обрабатываем каскады
  await processMatchesWithDelay();
}

// ================= УЛУЧШЕННАЯ ГРАВИТАЦИЯ =================

async function processGravityAndSpawn() {
  let changed = false;
  
  // Гравитация
  for (let x = 0; x < SIZE; x++) {
    let writePos = SIZE - 1;
    
    for (let y = SIZE - 1; y >= 0; y--) {
      if (board[y][x] !== null) {
        if (writePos !== y) {
          board[writePos][x] = board[y][x];
          board[y][x] = null;
          changed = true;
        }
        writePos--;
      }
    }
    
    // Заполняем пустоты
    for (let y = writePos; y >= 0; y--) {
      if (board[y][x] === null) {
        board[y][x] = randomColor();
        changed = true;
      }
    }
  }
  
  if (changed) {
    renderBoard();
    await delay(300);
  }
}

// ================= RENDER =================

function renderBoard() {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      setColor(cells[y][x], board[y][x]);
    }
  }
}

// ================= MATCH CHECK =================

function checkMatches() {
  let matches = [];
  
  // Горизонтальные
  for (let y = 0; y < SIZE; y++) {
    let count = 1;
    for (let x = 1; x < SIZE; x++) {
      if (board[y][x] === board[y][x-1]) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = 0; i < count; i++) {
            matches.push({ x: x-1-i, y });
          }
        }
        count = 1;
      }
    }
    if (count >= 3) {
      for (let i = 0; i < count; i++) {
        matches.push({ x: SIZE-1-i, y });
      }
    }
  }
  
  // Вертикальные
  for (let x = 0; x < SIZE; x++) {
    let count = 1;
    for (let y = 1; y < SIZE; y++) {
      if (board[y][x] === board[y-1][x]) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = 0; i < count; i++) {
            matches.push({ x, y: y-1-i });
          }
        }
        count = 1;
      }
    }
    if (count >= 3) {
      for (let i = 0; i < count; i++) {
        matches.push({ x, y: SIZE-1-i });
      }
    }
  }
  
  return matches;
}

// ================= POSSIBLE MOVES =================

function hasPossibleMoves() {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (x < SIZE - 1) {
        swapTest(x, y, x + 1, y);
        if (checkMatches().length > 0) {
          swapTest(x, y, x + 1, y);
          return true;
        }
        swapTest(x, y, x + 1, y);
      }
      
      if (y < SIZE - 1) {
        swapTest(x, y, x, y + 1);
        if (checkMatches().length > 0) {
          swapTest(x, y, x, y + 1);
          return true;
        }
        swapTest(x, y, x, y + 1);
      }
    }
  }
  return false;
}

function swapTest(x1, y1, x2, y2) {
  const temp = board[y1][x1];
  board[y1][x1] = board[y2][x2];
  board[y2][x2] = temp;
}

// ================= SHUFFLE =================

async function shuffleBoard() {
  gameState.setState('processing');
  
  do {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        board[y][x] = randomColor();
      }
    }
  } while (hasPossibleMoves());
  
  renderBoard();
  await delay(500);
  
  gameState.setState('idle');
}

// ================= HINT SYSTEM =================

function startHintTimer() {
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => {
    if (!actionLock.isLocked() && !gameState.isAnimating()) {
      showHint();
    }
  }, 4000);
}

function showHint() {
  if (actionLock.isLocked() || gameState.isAnimating()) return;
  
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (x < SIZE - 1) {
        swapTest(x, y, x + 1, y);
        let matches = checkMatches();
        swapTest(x, y, x + 1, y);
        if (matches.length > 0) {
          highlightHint(x, y);
          return;
        }
      }
      
      if (y < SIZE - 1) {
        swapTest(x, y, x, y + 1);
        let matches = checkMatches();
        swapTest(x, y, x, y + 1);
        if (matches.length > 0) {
          highlightHint(x, y);
          return;
        }
      }
    }
  }
}

function highlightHint(x, y) {
  clearHints();
  cells[y][x].classList.add("hint");
  setTimeout(() => clearHints(), 2000);
}

function clearHints() {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      cells[y][x].classList.remove("hint");
    }
  }
}

// ================= UTILITY =================

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ================= HUD =================

function updateHUD() {
  document.getElementById("movesDisplay").innerText = `Ходы: ${movesLeft}`;
  
  if (levelData.type === "score") {
    document.getElementById("targetDisplay").innerText = `Цель: ${score} / ${levelData.target}`;
  }
}

// ================= WIN CHECK =================

function checkWin() {
  if (levelFinished || actionLock.isLocked()) return;
  
  if (levelData.type === "score" && score >= levelData.target) {
    winLevel();
    return;
  }
  
  if (movesLeft <= 0) {
    loseLevel();
  }
}

// ================= WIN =================

function winLevel() {
  if (levelFinished) return;
  
  levelFinished = true;
  gameLocked = true;
  gameState.setState('locked');
  actionLock.clearAll();
  
  animateCoins();
  
  setTimeout(() => {
    addCoins(levelData.reward);
    updateCoinsUI();
  }, 700);
  
  showPopup(`
    <h2>Победа!</h2>
    <p>Награда: ${levelData.reward} монет</p>
    <button onclick="nextLevel()">Далее</button>
  `);
}

// ================= LOSE =================

function loseLevel() {
  if (levelFinished) return;
  
  levelFinished = true;
  gameLocked = true;
  gameState.setState('locked');
  actionLock.clearAll();
  
  LivesSystem.useLife();
  
  showPopup(`
    <h2>Поражение</h2>
    <button onclick="restartLevel()">Заново</button>
  `);
}

// ================= LEVEL NAVIGATION =================

function nextLevel() {
  currentLevel++;
  hidePopup();
  initLevel();
}

function restartLevel() {
  if (!LivesSystem.useLife()) return;
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

function animateCoins() {
  const coinsEl = document.getElementById("coinsDisplay");
  const rect = coinsEl.getBoundingClientRect();
  
  for (let i = 0; i < 10; i++) {
    const coin = document.createElement("div");
    coin.innerHTML = "💰";
    coin.className = "coinFly";
    coin.style.left = window.innerWidth / 2 + "px";
    coin.style.top = window.innerHeight / 2 + "px";
    document.body.appendChild(coin);
    
    setTimeout(() => {
      coin.style.transform = `translate(${rect.left - window.innerWidth/2}px, ${rect.top - window.innerHeight/2}px) scale(0.5)`;
      coin.style.opacity = "0";
    }, 20);
    
    setTimeout(() => coin.remove(), 900);
  }
}

// ================= ВИЗУАЛЬНЫЕ ЭФФЕКТЫ =================

async function showMatchEffect(match) {
  match.cells.forEach(cellPos => {
    const el = cells[cellPos.y]?.[cellPos.x];
    if (el) el.classList.add("matchFlash");
  });
  
  if (match.type === "rocket") {
    await showRocketEffect(match.cells);
  } else if (match.type === "bomb") {
    await showBombEffect(match.cells);
  } else if (match.type === "color") {
    await showRainbowEffect();
  }
  
  await delay(200);
  
  match.cells.forEach(cellPos => {
    const el = cells[cellPos.y]?.[cellPos.x];
    if (el) el.classList.remove("matchFlash");
  });
}

async function showRocketEffect(matchCells) {
  if (!matchCells || matchCells.length === 0) return;
  
  const center = matchCells[Math.floor(matchCells.length / 2)];
  
  for (let i = 0; i < SIZE; i++) {
    if (cells[center.y]?.[i]) {
      cells[center.y][i].classList.add("rocketLine");
      setTimeout(() => cells[center.y]?.[i]?.classList.remove("rocketLine"), 300);
    }
    if (cells[i]?.[center.x]) {
      cells[i][center.x].classList.add("rocketLine");
      setTimeout(() => cells[i]?.[center.x]?.classList.remove("rocketLine"), 300);
    }
  }
  
  await delay(250);
}

async function showBombEffect(matchCells) {
  if (!matchCells || matchCells.length === 0) return;
  
  const center = matchCells[0];
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = center.x + dx;
      const y = center.y + dy;
      if (x >= 0 && x < SIZE && y >= 0 && y < SIZE && cells[y]?.[x]) {
        cells[y][x].classList.add("bombBlast");
        setTimeout(() => cells[y]?.[x]?.classList.remove("bombBlast"), 300);
      }
    }
  }
  
  await delay(250);
}

async function showRainbowEffect() {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = board[y][x];
      const color = typeof cell === "string" ? cell : cell?.color;
      if (color && cells[y]?.[x]) {
        cells[y][x].classList.add("rainbowFlash");
        setTimeout(() => cells[y]?.[x]?.classList.remove("rainbowFlash"), 400);
      }
    }
  }
  await delay(300);
}
