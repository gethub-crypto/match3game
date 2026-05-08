// ================= GLOBAL =================

let currentLevel = 1
let levelData = null

let movesLeft = 0
let score = 0
let collected = 0

let levelFinished = false
let gameLocked = false

let hintTimer = null
let isProcessingSpecial = false
let isAnimating = false  // Флаг анимации

const SIZE = 8
const COLORS = ["red","blue","green","yellow","purple"]

let board = []
let cells = []

let selected = null


// ================= INIT =================

async function init(){
  LivesSystem.init()
  await Levels.load()
  updateScreens()
  updateCoinsUI()
}

window.onload = init


// ================= START LEVEL =================

function startLevel(){
  if(!LivesSystem.hasLives()){
    LivesSystem.showNoLivesPopup()
    return
  }
  goTo("game")
  initLevel()
}


// ================= INIT LEVEL =================

function initLevel(){
  levelFinished = false
  gameLocked = false
  isAnimating = false
  isProcessingSpecial = false
  
  levelData = Levels.get(currentLevel)
  
  createBoard()
  startGameplay()
  startHintTimer()
}


// ================= GAMEPLAY =================

function startGameplay(){
  movesLeft = levelData.moves
  score = 0
  collected = 0
  updateHUD()
}


// ================= CREATE BOARD =================

function createBoard(){
  const boardEl = document.getElementById("board")
  boardEl.innerHTML = ""
  
  board = []
  cells = []
  
  for(let y=0; y<SIZE; y++){
    board[y] = []
    cells[y] = []
    
    for(let x=0; x<SIZE; x++){
      let color
      
      do{
        color = randomColor()
        board[y][x] = color
      }
      while(hasMatchAt(x,y))
      
      const cell = document.createElement("div")
      cell.className = "cell"
      cell.dataset.x = x
      cell.dataset.y = y
      
      setColor(cell, color)
      addSwipe(cell, x, y)
      
      boardEl.appendChild(cell)
      cells[y][x] = cell
    }
  }
}


// ================= RANDOM =================

function randomColor(){
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}


// ================= START MATCH CHECK =================

function hasMatchAt(x,y){
  const color = board[y][x]
  
  if(x>=2 && board[y][x-1]===color && board[y][x-2]===color) return true
  if(y>=2 && board[y-1][x]===color && board[y-2][x]===color) return true
  
  return false
}


// ================= COLOR =================

function setColor(cell, data){
  if(typeof data === "object" && data !== null){
    if(data.special === "rocket") cell.innerHTML = "🚀"
    if(data.special === "bomb") cell.innerHTML = "💣"
    if(data.special === "color") cell.innerHTML = "🌈"
    cell.style.background = "#444"
  }
  else if(typeof data === "string"){
    cell.innerHTML = ""
    cell.style.background = data
  }
}


// ================= SWIPE =================

function addSwipe(cell, x, y){
  let startX = 0
  let startY = 0
  
  cell.addEventListener("touchstart", e => {
    if(gameLocked || isAnimating || levelFinished) return
    e.preventDefault()
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    selected = {x, y}
    highlightCell(x, y)
  })
  
  cell.addEventListener("touchend", e => {
    if(gameLocked || isAnimating || levelFinished || !selected) return
    e.preventDefault()
    
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    
    const dx = endX - startX
    const dy = endY - startY
    
    let targetX = x
    let targetY = y
    
    if(Math.abs(dx) > Math.abs(dy)){
      if(dx > 30) targetX = x + 1
      if(dx < -30) targetX = x - 1
    }else{
      if(dy > 30) targetY = y + 1
      if(dy < -30) targetY = y - 1
    }
    
    onCellClick(targetX, targetY)
  })
  
  // Добавляем mouse события для десктопа
  cell.addEventListener("mousedown", e => {
    if(gameLocked || isAnimating || levelFinished) return
    e.preventDefault()
    selected = {x, y}
    highlightCell(x, y)
  })
  
  cell.addEventListener("mouseup", e => {
    if(gameLocked || isAnimating || levelFinished || !selected) return
    e.preventDefault()
    onCellClick(x, y)
  })
}


// ================= HIGHLIGHT =================

function highlightCell(x, y){
  clearHints()
  
  for(let yy=0; yy<SIZE; yy++){
    for(let xx=0; xx<SIZE; xx++){
      cells[yy][xx].classList.remove("selected")
    }
  }
  
  if(cells[y] && cells[y][x]){
    cells[y][x].classList.add("selected")
  }
}

function clearHighlight(){
  for(let yy=0; yy<SIZE; yy++){
    for(let xx=0; xx<SIZE; xx++){
      if(cells[yy] && cells[yy][xx]){
        cells[yy][xx].classList.remove("selected")
      }
    }
  }
}


// ================= CLICK =================

function onCellClick(x, y){
  if(gameLocked || isAnimating || levelFinished) return
  if(x<0 || x>=SIZE || y<0 || y>=SIZE) return
  
  if(!selected){
    selected = {x, y}
    highlightCell(x, y)
    return
  }
  
  const dx = Math.abs(selected.x - x)
  const dy = Math.abs(selected.y - y)
  
  if(dx + dy !== 1){
    clearHighlight()
    selected = null
    return
  }
  
  // Сохраняем выбранные ячейки перед свапом
  const from = {x: selected.x, y: selected.y}
  const to = {x, y}
  
  clearHighlight()
  selected = null
  
  // Выполняем свап
  performSwap(from, to)
}


// ================= PERFORM SWAP (НОВАЯ ФУНКЦИЯ) =================

async function performSwap(from, to){
  if(gameLocked || isAnimating || levelFinished) return
  
  isAnimating = true
  gameLocked = true
  
  try {
    const fromCell = board[from.y][from.x]
    const toCell = board[to.y][to.x]
    
    // Визуально меняем местами
    board[from.y][from.x] = toCell
    board[to.y][to.x] = fromCell
    renderBoard()
    
    await delay(100)
    
    // Проверяем, есть ли совпадения
    const matches = checkMatches()
    
    if(matches.length === 0){
      // Возвращаем обратно
      board[from.y][from.x] = fromCell
      board[to.y][to.x] = toCell
      renderBoard()
      await delay(100)
    } else {
      // Уменьшаем ходы
      movesLeft--
      updateHUD()
      
      // Обрабатываем спец-ячейки
      if(typeof fromCell === "object" && fromCell !== null && fromCell.special){
        await Specials.activateWithDelay(to.x, to.y)
        board[to.y][to.x] = null
      }
      
      if(typeof toCell === "object" && toCell !== null && toCell.special){
        await Specials.activateWithDelay(from.x, from.y)
        board[from.y][from.x] = null
      }
      
      // Запускаем цепочку обработки совпадений
      await processMatchesChain()
    }
    
    updateHUD()
    checkWin()
    startHintTimer()
    
  } finally {
    isAnimating = false
    gameLocked = false
  }
}


// ================= PROCESS MATCHES CHAIN (НОВАЯ ЦЕПОЧКА) =================

async function processMatchesChain(){
  let hasMatches = true
  let maxIterations = 50 // Защита от бесконечного цикла
  let iterations = 0
  
  while(hasMatches && iterations < maxIterations){
    iterations++
    
    const matches = MatchDetection.getMatches(board)
    
    if(matches.length === 0){
      hasMatches = false
      break
    }
    
    // Обрабатываем все найденные матчи
    for(const match of matches){
      await showMatchEffect(match)
      await delay(200)
      
      let specialCell = null
      
      if(match.type === "rocket") specialCell = match.cells[1]
      if(match.type === "color") specialCell = match.cells[2]
      if(match.type === "bomb") specialCell = match.cells[0]
      
      // Удаляем ячейки матча
      for(const cellPos of match.cells){
        if(specialCell && cellPos.x === specialCell.x && cellPos.y === specialCell.y) continue
        
        const cell = board[cellPos.y][cellPos.x]
        
        if(typeof cell === "object" && cell !== null){
          Specials.activate(cellPos.x, cellPos.y)
        }
        
        score += 50
        board[cellPos.y][cellPos.x] = null
      }
      
      // Сохраняем спец-ячейку
      if(specialCell){
        board[specialCell.y][specialCell.x] = {
          color: randomColor(),
          special: match.type,
          type: "special"
        }
      }
    }
    
    renderBoard()
    await delay(100)
    
    // Падаем
    await dropAndSpawn()
    renderBoard()
    await delay(100)
    
    updateHUD()
  }
}

// ================= DROP AND SPAWN =================

async function dropAndSpawn(){
  // Падение
  for(let x=0; x<SIZE; x++){
    for(let y=SIZE-1; y>=0; y--){
      if(board[y][x] === null){
        for(let k=y-1; k>=0; k--){
          if(board[k][x] !== null){
            board[y][x] = board[k][x]
            board[k][x] = null
            break
          }
        }
      }
    }
  }
  
  // Спавн новых
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      if(board[y][x] === null){
        board[y][x] = randomColor()
      }
    }
  }
}


// ================= RENDER =================

function renderBoard(){
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      if(cells[y] && cells[y][x]){
        setColor(cells[y][x], board[y][x])
      }
    }
  }
}


// ================= MATCH CHECK =================

function checkMatches(){
  let matches = []
  
  // Горизонтальные
  for(let y=0; y<SIZE; y++){
    let count = 1
    for(let x=1; x<SIZE; x++){
      const current = board[y][x]
      const prev = board[y][x-1]
      
      if(current === prev || (typeof current === "object" && typeof prev === "object" && current.color === prev.color)){
        count++
      }else{
        if(count >= 3){
          for(let i=0; i<count; i++){
            matches.push({x: x-1-i, y})
          }
        }
        count = 1
      }
    }
    if(count >= 3){
      for(let i=0; i<count; i++){
        matches.push({x: SIZE-1-i, y})
      }
    }
  }
  
  // Вертикальные
  for(let x=0; x<SIZE; x++){
    let count = 1
    for(let y=1; y<SIZE; y++){
      const current = board[y][x]
      const prev = board[y-1][x]
      
      if(current === prev || (typeof current === "object" && typeof prev === "object" && current.color === prev.color)){
        count++
      }else{
        if(count >= 3){
          for(let i=0; i<count; i++){
            matches.push({x, y: y-1-i})
          }
        }
        count = 1
      }
    }
    if(count >= 3){
      for(let i=0; i<count; i++){
        matches.push({x, y: SIZE-1-i})
      }
    }
  }
  
  return matches
}


// ================= ФУНКЦИИ ЗАДЕРЖЕК =================

function delay(ms){
  return new Promise(resolve => setTimeout(resolve, ms))
}


// ================= ВИЗУАЛЬНЫЙ ЭФФЕКТ ДЛЯ МАТЧА =================

async function showMatchEffect(match){
  if(!match || !match.cells) return
  
  // Подсветка ячеек матча
  match.cells.forEach(cellPos => {
    const el = cells[cellPos.y]?.[cellPos.x]
    if(el) el.classList.add("matchFlash")
  })
  
  await delay(150)
  
  // Убираем подсветку
  match.cells.forEach(cellPos => {
    const el = cells[cellPos.y]?.[cellPos.x]
    if(el) el.classList.remove("matchFlash")
  })
}


// ================= POSSIBLE MOVES =================

function hasPossibleMoves(){
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      if(x < SIZE-1){
        swapTest(x, y, x+1, y)
        if(checkMatches().length > 0){
          swapTest(x, y, x+1, y)
          return true
        }
        swapTest(x, y, x+1, y)
      }
      
      if(y < SIZE-1){
        swapTest(x, y, x, y+1)
        if(checkMatches().length > 0){
          swapTest(x, y, x, y+1)
          return true
        }
        swapTest(x, y, x, y+1)
      }
    }
  }
  return false
}

function swapTest(x1, y1, x2, y2){
  const temp = board[y1][x1]
  board[y1][x1] = board[y2][x2]
  board[y2][x2] = temp
}


// ================= SHUFFLE =================

function shuffleBoard(){
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      board[y][x] = randomColor()
    }
  }
  renderBoard()
}


// ================= HINT SYSTEM =================

function startHintTimer(){
  clearTimeout(hintTimer)
  hintTimer = setTimeout(showHint, 4000)
}

function showHint(){
  if(gameLocked || isAnimating || levelFinished) return
  
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      if(x < SIZE-1){
        swapTest(x, y, x+1, y)
        let matches = checkMatches()
        swapTest(x, y, x+1, y)
        if(matches.length > 0){
          highlightHint(x, y)
          return
        }
      }
      
      if(y < SIZE-1){
        swapTest(x, y, x, y+1)
        let matches = checkMatches()
        swapTest(x, y, x, y+1)
        if(matches.length > 0){
          highlightHint(x, y)
          return
        }
      }
    }
  }
}

function highlightHint(x, y){
  clearHints()
  if(cells[y] && cells[y][x]){
    cells[y][x].classList.add("hint")
    setTimeout(() => clearHints(), 2000)
  }
}

function clearHints(){
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      if(cells[y] && cells[y][x]){
        cells[y][x].classList.remove("hint")
      }
    }
  }
}


// ================= HUD =================

function updateHUD(){
  const movesDisplay = document.getElementById("movesDisplay")
  if(movesDisplay) movesDisplay.innerText = `Ходы: ${movesLeft}`
  
  if(levelData && levelData.type === "score"){
    const targetDisplay = document.getElementById("targetDisplay")
    if(targetDisplay) targetDisplay.innerText = `Цель: ${score} / ${levelData.target}`
  }
}


// ================= WIN CHECK =================

function checkWin(){
  if(levelFinished || isAnimating) return
  
  if(levelData.type === "score" && score >= levelData.target){
    winLevel()
    return
  }
  
  if(movesLeft <= 0){
    loseLevel()
  }
}


// ================= WIN =================

function winLevel(){
  if(levelFinished) return
  
  levelFinished = true
  gameLocked = true
  isAnimating = true
  
  animateCoins()
  
  setTimeout(() => {
    addCoins(levelData.reward)
    updateCoinsUI()
    isAnimating = false
  }, 700)
  
  showPopup(`
    <h2>Победа!</h2>
    <p>Награда: ${levelData.reward} монет</p>
    <button onclick="nextLevel()">Далее</button>
  `)
}


// ================= LOSE =================

function loseLevel(){
  if(levelFinished) return
  
  levelFinished = true
  gameLocked = true
  
  LivesSystem.useLife()
  
  showPopup(`
    <h2>Поражение</h2>
    <button onclick="restartLevel()">Заново</button>
  `)
}


// ================= LEVEL =================

function nextLevel(){
  currentLevel++
  hidePopup()
  initLevel()
}

function restartLevel(){
  if(!LivesSystem.useLife()) return
  hidePopup()
  initLevel()
}


// ================= COINS =================

function updateCoinsUI(){
  const el = document.getElementById("coinsDisplay")
  if(el){
    el.innerText = "💰 " + getCoins()
  }
}

function animateCoins(){
  const coinsEl = document.getElementById("coinsDisplay")
  if(!coinsEl) return
  
  const rect = coinsEl.getBoundingClientRect()
  
  for(let i=0; i<10; i++){
    const coin = document.createElement("div")
    coin.innerHTML = "💰"
    coin.className = "coinFly"
    coin.style.left = window.innerWidth/2 + "px"
    coin.style.top = window.innerHeight/2 + "px"
    document.body.appendChild(coin)
    
    setTimeout(() => {
      coin.style.transform = `translate(${rect.left - window.innerWidth/2}px, ${rect.top - window.innerHeight/2}px) scale(0.5)`
      coin.style.opacity = "0"
    }, 20)
    
    setTimeout(() => coin.remove(), 900)
  }
        }
