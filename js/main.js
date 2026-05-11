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

// ЕДИНАЯ БЛОКИРОВКА ДЛЯ АНИМАЦИЙ
let isAnimating = false

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
    if(gameLocked || isAnimating || isProcessingSpecial) return
    
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    selected = {x, y}
    highlightCell(x, y)
  })
  
  cell.addEventListener("touchend", e => {
    if(gameLocked || isAnimating || isProcessingSpecial) return
    
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
}


// ================= HIGHLIGHT =================

function highlightCell(x, y){
  clearHints()
  
  for(let yy=0; yy<SIZE; yy++){
    for(let xx=0; xx<SIZE; xx++){
      cells[yy][xx].classList.remove("selected")
    }
  }
  
  cells[y][x].classList.add("selected")
}

function clearHighlight(){
  for(let yy=0; yy<SIZE; yy++){
    for(let xx=0; xx<SIZE; xx++){
      cells[yy][xx].classList.remove("selected")
    }
  }
}


// ================= CLICK (ГЛАВНЫЙ ОБРАБОТЧИК) =================

async function onCellClick(x, y){
  if(gameLocked || isAnimating || isProcessingSpecial) return
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
  
  // БЛОКИРУЕМ ВВОД
  isAnimating = true
  
  const a = {x: selected.x, y: selected.y}
  const b = {x, y}
  
  clearHighlight()
  selected = null
  
  // ВЫПОЛНЯЕМ SWAP
  const A = board[a.y][a.x]
  const B = board[b.y][b.x]
  
  board[a.y][a.x] = B
  board[b.y][b.x] = A
  
  renderBoard()
  await delay(200)
  
  // ПРОВЕРЯЕМ SPECIAL TILES ПОСЛЕ SWAP
  let hasSpecial = false
  
  // Проверяем special на позиции B (то что пришло из A)
  if(board[b.y][b.x] && typeof board[b.y][b.x] === "object" && board[b.y][b.x] !== null){
    await Specials.activateWithDelay(b.x, b.y)
    board[b.y][b.x] = null
    hasSpecial = true
  }
  
  // Проверяем special на позиции A (то что пришло из B)
  if(!hasSpecial && board[a.y][a.x] && typeof board[a.y][a.x] === "object" && board[a.y][a.x] !== null){
    await Specials.activateWithDelay(a.x, a.y)
    board[a.y][a.x] = null
    hasSpecial = true
  }
  
  if(hasSpecial){
    // Если были special - делаем gravity и проверяем матчи
    await dropWithDelay(150)
    await spawnNewWithDelay(150)
    renderBoard()
    
    // Проверяем новые матчи после gravity
    await processMatchesAsync()
    
    updateHUD()
    checkWin()
    startHintTimer()
    isAnimating = false
    return
  }
  
  // ПРОВЕРЯЕМ ОБЫЧНЫЕ МАТЧИ
  let matches = MatchDetection.getMatches(board)
  
  if(matches.length === 0){
    // НЕТ МАТЧЕЙ - ОТКАТ
    board[a.y][a.x] = A
    board[b.y][b.x] = B
    renderBoard()
    
    await delay(150)
    
    isAnimating = false
    return
  }
  
  // ЕСТЬ МАТЧИ - ОБРАБАТЫВАЕМ
  movesLeft--
  updateHUD()
  
  await processMatchesAsync()
  
  updateHUD()
  checkWin()
  startHintTimer()
  
  isAnimating = false
}


// ================= RENDER =================

function renderBoard(){
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      setColor(cells[y][x], board[y][x])
    }
  }
}


// ================= MATCH CHECK =================

function checkMatches(){
  let matches = []
  
  for(let y=0; y<SIZE; y++){
    let count = 1
    for(let x=1; x<SIZE; x++){
      if(board[y][x] === board[y][x-1]){
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
  
  for(let x=0; x<SIZE; x++){
    let count = 1
    for(let y=1; y<SIZE; y++){
      if(board[y][x] === board[y-1][x]){
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


// ================= ЕДИНАЯ АСИНХРОННАЯ ОБРАБОТКА МАТЧЕЙ =================

async function processMatchesAsync(){
  const matches = MatchDetection.getMatches(board)
  
  if(matches.length === 0){
    if(!hasPossibleMoves()){
      await shuffleBoardAsync()
    }
    return
  }
  
  // Обрабатываем все матчи
  for(const match of matches){
    
    // Подсвечиваем ячейки матча
    match.cells.forEach(cellPos => {
      const el = cells[cellPos.y]?.[cellPos.x]
      if(el) el.classList.add("matchFlash")
    })
    
    await delay(200)
    
    let specialCell = null
    let specialType = null
    
    // Определяем где будет создан special
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
    
    // Удаляем ячейки матча
    for(const cellPos of match.cells){
      // Пропускаем ячейку для special
      if(specialCell && cellPos.x === specialCell.x && cellPos.y === specialCell.y) continue
      
      const cell = board[cellPos.y][cellPos.x]
      
      // Если в матче была special плитка - активируем её
      if(typeof cell === "object" && cell !== null && cell.special){
        await Specials.activate(cellPos.x, cellPos.y)
      }
      
      score += 50
      board[cellPos.y][cellPos.x] = null
    }
    
    // Создаём новую special плитку
    if(specialCell && specialType){
      board[specialCell.y][specialCell.x] = {
        color: randomColor(),
        special: specialType,
        type: "special"
      }
    }
    
    // Убираем подсветку
    match.cells.forEach(cellPos => {
      const el = cells[cellPos.y]?.[cellPos.x]
      if(el) el.classList.remove("matchFlash")
    })
    
    renderBoard()
    await delay(300)
  }
  
  // Gravity и spawn
  await dropWithDelay(150)
  await spawnNewWithDelay(150)
  renderBoard()
  await delay(200)
  
  updateHUD()
  
  // Проверяем новые матчи (каскады)
  await processMatchesAsync()
}


// ================= DROP И SPAWN =================

async function dropWithDelay(baseDelay = 150){
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
    
    // Заполняем пустоты сверху новыми плитками
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

async function spawnNewWithDelay(baseDelay = 150){
  let changed = false
  
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      if(board[y][x] === null){
        board[y][x] = randomColor()
        changed = true
      }
    }
  }
  
  if(changed){
    renderBoard()
    await delay(baseDelay)
  }
}


// ================= ВИЗУАЛЬНЫЕ ЭФФЕКТЫ =================

async function showMatchEffect(match){
  match.cells.forEach(cellPos => {
    const el = cells[cellPos.y]?.[cellPos.x]
    if(el) el.classList.add("matchFlash")
  })
  
  if(match.type === "rocket"){
    await showRocketEffect(match.cells)
  } else if(match.type === "bomb"){
    await showBombEffect(match.cells)
  } else if(match.type === "color"){
    await showRainbowEffect()
  }
  
  await delay(200)
  
  match.cells.forEach(cellPos => {
    const el = cells[cellPos.y]?.[cellPos.x]
    if(el) el.classList.remove("matchFlash")
  })
}

async function showRocketEffect(matchCells){
  if(!matchCells || matchCells.length === 0) return
  
  const center = matchCells[Math.floor(matchCells.length / 2)]
  
  for(let i=0; i<SIZE; i++){
    if(cells[center.y] && cells[center.y][i]){
      cells[center.y][i].classList.add("rocketLine")
      setTimeout(() => {
        if(cells[center.y] && cells[center.y][i]) 
          cells[center.y][i].classList.remove("rocketLine")
      }, 300)
    }
    if(cells[i] && cells[i][center.x]){
      cells[i][center.x].classList.add("rocketLine")
      setTimeout(() => {
        if(cells[i] && cells[i][center.x])
          cells[i][center.x].classList.remove("rocketLine")
      }, 300)
    }
  }
  
  await delay(250)
}

async function showBombEffect(matchCells){
  if(!matchCells || matchCells.length === 0) return
  
  const center = matchCells[0]
  
  for(let dy=-1; dy<=1; dy++){
    for(let dx=-1; dx<=1; dx++){
      const x = center.x + dx
      const y = center.y + dy
      if(x>=0 && x<SIZE && y>=0 && y<SIZE && cells[y] && cells[y][x]){
        cells[y][x].classList.add("bombBlast")
        setTimeout(() => {
          if(cells[y] && cells[y][x])
            cells[y][x].classList.remove("bombBlast")
        }, 300)
      }
    }
  }
  
  await delay(250)
}

async function showRainbowEffect(){
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      const cell = board[y][x]
      const color = typeof cell === "string" ? cell : cell?.color
      if(color && cells[y] && cells[y][x]){
        cells[y][x].classList.add("rainbowFlash")
        setTimeout(() => {
          if(cells[y] && cells[y][x])
            cells[y][x].classList.remove("rainbowFlash")
        }, 400)
      }
    }
  }
  await delay(300)
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

async function shuffleBoardAsync(){
  do {
    for(let y=0; y<SIZE; y++){
      for(let x=0; x<SIZE; x++){
        board[y][x] = randomColor()
      }
    }
  } while(hasPossibleMoves() || checkMatches().length > 0)
  
  renderBoard()
  await delay(500)
}

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
  if(gameLocked || isAnimating || isProcessingSpecial) return
  
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
  cells[y][x].classList.add("hint")
  setTimeout(() => clearHints(), 2000)
}

function clearHints(){
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      cells[y][x].classList.remove("hint")
    }
  }
}


// ================= UTILITY =================

function delay(ms){
  return new Promise(resolve => setTimeout(resolve, ms))
}


// ================= HUD =================

function updateHUD(){
  document.getElementById("movesDisplay").innerText = `Ходы: ${movesLeft}`
  
  if(levelData.type === "score"){
    document.getElementById("targetDisplay").innerText = `Цель: ${score} / ${levelData.target}`
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
