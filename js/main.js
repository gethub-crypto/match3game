// ================= INIT =================
function init() {
  console.log("Game started");

  // инициализация жизней
  LivesSystem.init();

  // обновление экранов
  updateScreens();

  // создаём поле (пока просто визуал)
  createBoard();
}

window.onload = init;


// ================= START LEVEL =================
function startLevel() {
  // проверка жизней
  if (!LivesSystem.useLife()) return;

  // если есть жизнь → запускаем игру
  goTo('game');
}


// ================= BOARD (8x8) =================
function createBoard() {
  const board = document.getElementById('board');
  if (!board) return;

  board.innerHTML = '';

  for (let i = 0; i < 64; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    board.appendChild(cell);
  }
}


// ================= RESTART LEVEL =================
function restartLevel() {
  // тоже проверяем жизни
  if (!LivesSystem.useLife()) return;

  createBoard();
  goTo('game');
}


// ================= TEST (можешь удалить потом) =================
function addCoins(amount) {
  let coins = Storage.get('coins', 0);
  coins += amount;
  Storage.set('coins', coins);
  console.log("Coins:", coins);
    }
