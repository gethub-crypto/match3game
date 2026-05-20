// ================= GLOBAL =================

let currentLevel = 1
let levelData = null

let movesLeft = 0
let score = 0
let collected = 0

let levelFinished = false
let gameLocked = false

let hintTimer = null
let isAnimating = false

// ANTI-SPAM
let lastClickTime = 0
const CLICK_COOLDOWN = 250

// ================= COMBO SYSTEM =================

const ComboManager = {
  combo: 0,
  cascadeCount: 0,
  
  onMatchDetected() {
    this.cascadeCount++
    if (this.cascadeCount > 1) {
      this.combo = this.cascadeCount - 1
      console.log(`🔥 Combo x${this.combo + 1}! Cascade #${this.cascadeCount}`)
    }
  },
  
  getMultiplier() {
    return Math.max(1, this.combo + 1)
  },
  
  reset() {
    if (this.combo > 0) {
      console.log(`✨ Combo finished! Max combo: x${this.combo + 1}`)
    }
    this.combo = 0
    this.cascadeCount = 0
  }
}

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
  
  lastClickTime = 0
  ComboManager.reset()
  
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


// ================= MATCH CHECK =================

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


// ================= SWIPE / MOUSE =================
// FIX: Полностью переписана логика ввода

function addSwipe(cell, x, y){
  let startX = 0
  let startY = 0
  let isDragging = false
  let swipeDirection = null
  let hasMoved = false
  
  function onStart(clientX, clientY){
    const now = Date.now()
    if(now - lastClickTime < CLICK_COOLDOWN) return false
    if(gameLocked || isAnimating) return false
    
    lastClickTime = now
    isDragging = true
    hasMoved = false
    swipeDirection = null
    
    startX = clientX
    startY = clientY
    selected = {x, y}
    highlightCell(x, y)
    return true
  }
  
  function onMove(clientX, clientY){
    if(!isDragging) return
    hasMoved = true
  }
  
  function onEnd(clientX, clientY){
    if(!isDragging) return
    isDragging = false
    
    if(gameLocked || isAnimating) return
    
    const dx = clientX - startX
    const dy = clientY - startY
    
    // FIX: Если движения практически не было — это клик/выбор
    if(!hasMoved || (Math.abs(dx) < 10 && Math.abs(dy) < 10)){
      // Клик — selected уже установлен в onStart
      return
    }
    
    let targetX = x
    let targetY = y
    
    if(Math.abs(dx) > Math.abs(dy)){
      if(dx > 30){ targetX = x + 1; swipeDirection = 'horizontal' }
      else if(dx < -30){ targetX = x - 1; swipeDirection = 'horizontal' }
    } else {
      if(dy > 30){ targetY = y + 1; swipeDirection = 'vertical' }
      else if(dy < -30){ targetY = y - 1; swipeDirection = 'vertical' }
    }
    
    // FIX: Если свайп короткий — сбрасываем выделение
    if(targetX === x && targetY === y){
      clearHighlight()
      selected = null
      return
    }
    
    onCellClick(targetX, targetY, swipeDirection)
  }
  
  // TOUCH
  cell.addEventListener("touchstart", e => {
    e.preventDefault()
    onStart(e.touches[0].clientX, e.touches[0].clientY)
  }, {passive: false})
  
  cell.addEventListener("touchmove", e => {
    e.preventDefault()
    if(e.touches.length > 0){
      onMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  }, {passive: false})
  
  cell.addEventListener("touchend", e => {
    e.preventDefault()
    onEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
  }, {passive: false})
  
  // MOUSE
  cell.addEventListener("mousedown", e => {
    if(e.button !== 0) return
    onStart(e.clientX, e.clientY)
  })
  
  cell.addEventListener("mousemove", e => {
    onMove(e.clientX, e.clientY)
  })
  
  cell.addEventListener("mouseup", e => {
    if(e.button !== 0) return
    onEnd(e.clientX, e.clientY)
  })
  
  // FIX: Убран mouseleave — он мешал кликам
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
      cells[yy][xx].classList.remove("selected")
    }
  }
}


// ================= CLICK =================

async function onCellClick(x, y, direction = null){
  const now = Date.now()
  if(now - lastClickTime < CLICK_COOLDOWN) return
  if(gameLocked || isAnimating) return
  if(x<0 || x>=SIZE || y<0 || y>=SIZE) return
  
  lastClickTime = now
  
  // FIX: Если нет выделенной ячейки — выбираем текущую
  if(!selected){
    selected = {x, y}
    highlightCell(x, y)
    return
  }
  
  const dx = Math.abs(selected.x - x)
  const dy = Math.abs(selected.y - y)
  
  // FIX: Клик на ту же ячейку — сброс
  if(dx === 0 && dy === 0){
    clearHighlight()
    selected = null
    return
  }
  
  // FIX: Клик на соседнюю ячейку — свайп
  if(dx + dy === 1){
    ComboManager.reset()
    isAnimating = true
    
    const a = {x: selected.x, y: selected.y}
    const b = {x, y}
    
    clearHighlight()
    selected = null
    
    const A = board[a.y][a.x]
    const B = board[b.y][b.x]
    
    board[a.y][a.x] = B
    board[b.y][b.x] = A
    
    renderBoard()
    await delay(200)
    
    let hasSpecialActivated = false
    
    const specialA = typeof A === "object" && A !== null && A.special
    const specialB = typeof B === "object" && B !== null && B.special
    
    if(specialB){
      await Specials.activateWithDelay(b.x, b.y, null, direction)
      hasSpecialActivated = true
    } else if(specialA){
      await Specials.activateWithDelay(a.x, a.y, null, direction)
      hasSpecialActivated = true
    }
    
    if(hasSpecialActivated){
      await dropAndSpawn(150)
      renderBoard()
      await processMatchesLoop()
      updateHUD()
      checkWin()
      startHintTimer()
      isAnimating = false
      return
    }
    
    let matches = MatchDetection.getMatches(board)
    
    if(matches.length === 0){
      board[a.y][a.x] = A
      board[b.y][b.x] = B
      renderBoard()
      await delay(150)
      isAnimating = false
      return
    }
    
    movesLeft--
    updateHUD()
    
    await processMatchesLoop()
    
    updateHUD()
    checkWin()
    startHintTimer()
    isAnimating = false
    return
  }
  
  // FIX: Клик на дальнюю ячейку — переключаем выбор
  clearHighlight()
  selected = {x, y}
  highlightCell(x, y)
}


// ================= RENDER =================

function renderBoard(){
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      setColor(cells[y][x], board[y][x])
    }
  }
}


// ================= PROCESS MATCHES =================

async function processMatchesLoop(){
  while(true){
    const matches = MatchDetection.getMatches(board)
    
    if(matches.length === 0){
      if(!hasPossibleMoves()){
        await shuffleBoardAsync()
      }
      break
    }
    
    ComboManager.onMatchDetected()
    
    for(const match of matches){
      match.cells.forEach(cellPos => {
        const el = cells[cellPos.y]?.[cellPos.x]
        if(el) el.classList.add("matchFlash")
      })
      
      await delay(200)
      
      let specialCell = null
      let specialType = null
      
      if(match.type === "rocket"){
        specialType = "rocket"
        specialCell = match.cells[1]
      } else if(match.type === "bomb"){
        specialType = "bomb"
        specialCell = match.cells[0]
      } else if(match.type === "color"){
        specialType = "color"
        specialCell = match.cells[2]
      }
      
      for(const cellPos of match.cells){
        const cell = board[cellPos.y][cellPos.x]
        
        if(typeof cell === "object" && cell !== null && cell.special){
          continue
        }
        
        const baseScore = 50
        const comboMultiplier = ComboManager.getMultiplier()
        const finalScore = baseScore * comboMultiplier
        score += finalScore
        
        if(comboMultiplier > 1){
          console.log(`💥 Combo x${comboMultiplier}! +${finalScore} points`)
        }
        
        board[cellPos.y][cellPos.x] = null
      }
      
      if(specialCell && specialType && board[specialCell.y][specialCell.x] === null){
        board[specialCell.y][specialCell.x] = {
          color: randomColor(),
          special: specialType,
          type: "special"
        }
      }
      
      match.cells.forEach(cellPos => {
        const el = cells[cellPos.y]?.[cellPos.x]
        if(el) el.classList.remove("matchFlash")
      })
      
      renderBoard()
      await delay(300)
    }
    
    await dropAndSpawn(150)
    renderBoard()
    await delay(200)
    
    updateHUD()
  }
}


// ================= DROP AND SPAWN =================

async function dropAndSpawn(baseDelay = 150){
  let changed = false
  
  for(let x=0; x<SIZE; x++){
    let emptySpaces = 0
    
    for(let y=SIZE-1; y>=0; y--){
      if(board[y][x] === null){
        emptySpaces++
      } else if(emptySpaces > 0){
        board[y + emptySpaces][x] = board[y][x]
        board[y][x] = null
        changed = true
      }
    }
    
    for(let y=0; y<emptySpaces; y++){
      board[y][x] = randomColor()
      changed = true
    }
  }
  
  if(changed){
    renderBoard()
    await delay(baseDelay)
  }
}


// ================= POSSIBLE MOVES =================

function hasPossibleMoves(){
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      if(x < SIZE-1){
        swapTest(x, y, x+1, y)
        const hasMatch = MatchDetection.getMatches(board).length > 0
        swapTest(x, y, x+1, y)
        if(hasMatch) return true
      }
      
      if(y < SIZE-1){
        swapTest(x, y, x, y+1)
        const hasMatch = MatchDetection.getMatches(board).length > 0
        swapTest(x, y, x, y+1)
        if(hasMatch) return true
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

async function shuffleBoardAsync(){
  let attempts = 0
  const MAX_ATTEMPTS = 100
  
  do {
    for(let y=0; y<SIZE; y++){
      for(let x=0; x<SIZE; x++){
        let color
        do {
          color = randomColor()
          board[y][x] = color
        } while(hasMatchAt(x, y))
      }
    }
    attempts++
  } while((MatchDetection.getMatches(board).length > 0 || !hasPossibleMoves()) && attempts < MAX_ATTEMPTS)
  
  if(attempts >= MAX_ATTEMPTS){
    console.warn("Shuffle: max attempts reached")
  }
  
  renderBoard()
  await delay(500)
}


// ================= HINT SYSTEM =================

function startHintTimer(){
  clearTimeout(hintTimer)
  hintTimer = setTimeout(showHint, 4000)
}

function showHint(){
  if(gameLocked || isAnimating) return
  
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      if(x < SIZE-1){
        swapTest(x, y, x+1, y)
        let matches = MatchDetection.getMatches(board)
        swapTest(x, y, x+1, y)
        if(matches.length > 0){
          highlightHint(x, y)
          return
        }
      }
      
      if(y < SIZE-1){
        swapTest(x, y, x, y+1)
        let matches = MatchDetection.getMatches(board)
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
  }
  setTimeout(() => clearHints(), 2000)
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


// ================= UTILITY =================

function delay(ms){
  return new Promise(resolve => setTimeout(resolve, ms))
}


// ================= HUD =================

function updateHUD(){
  const movesEl = document.getElementById("movesDisplay")
  const targetEl = document.getElementById("targetDisplay")
  
  if(movesEl) movesEl.innerText = `Ходы: ${movesLeft}`
  
  if(targetEl && levelData.type === "score"){
    targetEl.innerText = `Цель: ${score} / ${levelData.target}`
  }
}


// ================= WIN CHECK =================

function checkWin(){
  if(levelFinished) return
  
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
  isAnimating = false
  
  animateCoins()
  
  setTimeout(() => {
    addCoins(levelData.reward)
    updateCoinsUI()
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
  isAnimating = false
  
  LivesSystem.useLife()
  
  showPopup(`
    <h2>Поражение</h2>
    <button onclick="restartLevel()">Заново</button>
  `)
}


// ================= LEVEL NAVIGATION =================

function nextLevel(){
  currentLevel++
  hidePopup()
  initLevel()
}

function restartLevel(){
  hidePopup()
  initLevel()
}
