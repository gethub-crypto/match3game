// ================= GLOBAL =================

let currentLevel = 1
let levelData = null

let movesLeft = 0
let score = 0
let collected = 0

let levelFinished = false
let gameLocked = false
let isProcessingSpecial = false
let isProcessingMove = false  // НОВО: защита от множественных кликов
let lastClickTime = 0
const CLICK_DEBOUNCE_MS = 200  // НОВО: debounce для кликов

let hintTimer = null

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
  isProcessingMove = false  // НОВО: сброс флага
  lastClickTime = 0
  
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


// ================= SWIPE (С ЗАЩИТОЙ ОТ ДАБЛ-КЛИКОВ) =================

function addSwipe(cell, x, y){
  let startX = 0
  let startY = 0
  let touchMoved = false  // НОВО: предотвращает тройной триггер
  let touchStartTime = 0  // НОВО: для long-press detection
  
  cell.addEventListener("touchstart", e => {
    e.preventDefault()
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    touchMoved = false
    touchStartTime = Date.now()
    selected = {x, y}
    highlightCell(x, y)
  })
  
  cell.addEventListener("touchmove", e => {
    touchMoved = true
    e.preventDefault()
  })
  
  cell.addEventListener("touchend", e => {
    e.preventDefault()
    
    // НОВО: debounce и защита от одновременных кликов
    const now = Date.now()
    if(now - lastClickTime < CLICK_DEBOUNCE_MS) return
    if(gameLocked || isProcessingMove) return
    if(touchMoved) return  // Если был свайп - игнорируем как клик
    
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
    
    lastClickTime = now
    onCellClick(targetX, targetY)
  })
}


// ================= HIGHLIGHT =================

function highlightCell(x, y){
  clearHints()
  clearHighlight()
  
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


// ================= CLICK (С ЗАЩИТОЙ) =================

function onCellClick(x, y){
  // НОВО: усиленная защита
  if(gameLocked) return
  if(isProcessingMove) return
  if(levelFinished) return
  
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
  
  isProcessingMove = true  // НОВО: блокируем новые клики
  
  swap(selected, {x, y})
  
  clearHighlight()
  selected = null
  updateHUD()
  startHintTimer()
  
  // НОВО: снимаем блокировку после завершения анимации
  setTimeout(() => {
    if(!gameLocked && !isProcessingSpecial){
      isProcessingMove = false
    }
  }, 300)
}


// ================= SWAP (ИСПРАВЛЕН) =================

async function swap(a, b){
  if(gameLocked || isProcessingSpecial) {
    isProcessingMove = false
    return
  }
  
  let A = board[a.y][a.x]
  let B = board[b.y][b.x]
  
  board[a.y][a.x] = B
  board[b.y][b.x] = A
  
  renderBoard()
  
  // НОВО: единый подход к обработке спец-способностей
  const hasSpecialA = (typeof A === "object" && A !== null && A.special)
  const hasSpecialB = (typeof B === "object" && B !== null && B.special)
  
  if(hasSpecialA || hasSpecialB){
    gameLocked = true
    isProcessingSpecial = true
    
    if(hasSpecialA){
      await Specials.activateWithDelay(a.x, a.y)
      board[a.y][a.x] = null
    }
    if(hasSpecialB){
      await Specials.activateWithDelay(b.x, b.y)
      board[b.y][b.x] = null
    }
    
    await processFullBoardUpdate()
    
    isProcessingSpecial = false
    gameLocked = false
    isProcessingMove = false
    return
  }
  
  // Обычный свап
  await delay(80)
  
  let matches = MatchDetection.getMatches(board)
  
  if(matches.length === 0){
    board[a.y][a.x] = A
    board[b.y][b.x] = B
    renderBoard()
    isProcessingMove = false
  } else {
    movesLeft--
    updateHUD()
    await processMatchesAsync()
    isProcessingMove = false
  }
}


// ================= НОВО: ПОЛНОЕ ОБНОВЛЕНИЕ ПОСЛЕ СПЕЦ-ЭФФЕКТА =================

async function processFullBoardUpdate(){
  await dropWithDelay(100)
  await spawnNewWithDelay(100)
  renderBoard()
  await processMatchesWithDelay()
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


// ================= MATCH CHECK (УЛУЧШЕН) =================

function checkMatches(){
  let matches = []
  
  // Горизонтальные матчи
  for(let y=0; y<SIZE; y++){
    let count = 1
    for(let x=1; x<SIZE; x++){
      const current = getCellValue(board[y][x])
      const prev = getCellValue(board[y][x-1])
      
      if(current === prev && current !== null){
        count++
      }else{
        if(count >= 3){
          addMatch(matches, y, x-1, count, true)
        }
        count = 1
      }
    }
    if(count >= 3){
      addMatch(matches, y, SIZE-1, count, true)
    }
  }
  
  // Вертикальные матчи
  for(let x=0; x<SIZE; x++){
    let count = 1
    for(let y=1; y<SIZE; y++){
      const current = getCellValue(board[y][x])
      const prev = getCellValue(board[y-1][x])
      
      if(current === prev && current !== null){
        count++
      }else{
        if(count >= 3){
          addMatch(matches, y-1, x, count, false)
        }
        count = 1
      }
    }
    if(count >= 3){
      addMatch(matches, SIZE-1, x, count, false)
    }
  }
  
  return matches
}

// НОВО: вспомогательная функция для getCellValue
function getCellValue(cell){
  if(cell === null) return null
  if(typeof cell === "string") return cell
  if(typeof cell === "object") return cell.color
  return null
}

// НОВО: добавление матча с определением типа спец-ячейки
function addMatch(matches, startY, startX, length, isHorizontal){
  const cells = []
  for(let i=0; i<length; i++){
    const x = isHorizontal ? startX - i : startX
    const y = isHorizontal ? startY : startY - i
    cells.push({x, y})
  }
  
  let type = null
  if(length === 4){
    type = "rocket"
  } else if(length === 5){
    type = "bomb"
  } else if(length >= 6){
    type = "color"
  }
  
  matches.push({
    cells: cells,
    type: type,
    length: length
  })
  
  return matches
}


// ================= PROCESS MATCHES АСИНХРОННО =================

async function processMatchesAsync(){
  let matches = MatchDetection.getMatches(board)
  
  if(matches.length === 0){
    checkWin()
    if(!hasPossibleMoves()){
      shuffleBoard()
    }
    return
  }
  
  for(const match of matches){
    await showMatchEffect(match)
    await delay(250)
    
    let specialCell = null
    
    if(match.type === "rocket") specialCell = match.cells[1]
    if(match.type === "color") specialCell = match.cells[2]
    if(match.type === "bomb") specialCell = match.cells[0]
    
    match.cells.forEach(cellPos => {
      if(specialCell && cellPos.x === specialCell.x && cellPos.y === specialCell.y) return
      
      let cell = board[cellPos.y][cellPos.x]
      
      if(typeof cell === "object" && cell !== null){
        Specials.activate(cellPos.x, cellPos.y)
      }
      
      score += 50
      board[cellPos.y][cellPos.x] = null
    })
    
    if(specialCell){
      board[specialCell.y][specialCell.x] = {
        color: randomColor(),
        special: match.type,
        type: "special"
      }
    }
  }
  
  renderBoard()
  
  await dropWithDelay(100)
  renderBoard()
  
  await spawnNewWithDelay(100)
  renderBoard()
  
  updateHUD()
  await processMatchesAsync()
}


// ================= НОВО: ПРОЦЕССИНГ С ЗАДЕРЖКОЙ (ДЛЯ SPECIALS) =================

async function processMatchesWithDelay(){
  const matches = MatchDetection.getMatches(board)
  
  if(matches.length === 0){
    checkWin()
    if(!hasPossibleMoves()){
      shuffleBoard()
    }
    return
  }
  
  for(const match of matches){
    await showMatchEffect(match)
    await delay(200)
    
    let specialCell = null
    
    if(match.type === "rocket") specialCell = match.cells[1]
    if(match.type === "color") specialCell = match.cells[2]
    if(match.type === "bomb") specialCell = match.cells[0]
    
    match.cells.forEach(cellPos => {
      if(specialCell && cellPos.x === specialCell.x && cellPos.y === specialCell.y) return
      
      let cell = board[cellPos.y][cellPos.x]
      
      if(typeof cell === "object" && cell !== null){
        Specials.activate(cellPos.x, cellPos.y)
      }
      
      score += 50
      board[cellPos.y][cellPos.x] = null
    })
    
    if(specialCell){
      board[specialCell.y][specialCell.x] = {
        color: randomColor(),
        special: match.type,
        type: "special"
      }
    }
  }
  
  renderBoard()
  
  await dropWithDelay(100)
  renderBoard()
  
  await spawnNewWithDelay(100)
  renderBoard()
  
  updateHUD()
  await processMatchesWithDelay()
}


// ================= ФУНКЦИИ ЗАДЕРЖЕК =================

function delay(ms){
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function dropWithDelay(baseDelay = 120){
  let changed = false
  
  for(let x=0; x<SIZE; x++){
    for(let y=SIZE-1; y>=0; y--){
      if(board[y][x] === null || (typeof board[y][x] === "object" && board[y][x] === null)){
        changed = true
        for(let k=y-1; k>=0; k--){
          if(board[k][x] !== null && !(typeof board[k][x] === "object" && board[k][x] === null)){
            board[y][x] = board[k][x]
            board[k][x] = null
            break
          }
        }
      }
      
      if(board[y][x] === null || (typeof board[y][x] === "object" && board[y][x] === null)){
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

async function spawnNewWithDelay(baseDelay = 120){
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


// ================= ВИЗУАЛЬНЫЙ ЭФФЕКТ ДЛЯ МАТЧА =================

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


// ================= DROP (ОБЫЧНЫЙ) =================

function drop(){
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
      
      if(board[y][x] === null){
        board[y][x] = randomColor()
      }
    }
  }
}


// ================= SPAWN (ОБЫЧНЫЙ) =================

function spawnNew(){
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      if(board[y][x] === null){
        board[y][x] = randomColor()
      }
    }
  }
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
  gameLocked = true
  
  for(let y=0; y<SIZE; y++){
    for(let x=0; x<SIZE; x++){
      board[y][x] = randomColor()
    }
  }
  renderBoard()
  
  // НОВО: проверяем что после shuffle есть ходы
  setTimeout(() => {
    if(!hasPossibleMoves()){
      shuffleBoard()
    } else {
      gameLocked = false
    }
  }, 100)
}


// ================= HINT SYSTEM =================

function startHintTimer(){
  clearTimeout(hintTimer)
  hintTimer = setTimeout(showHint, 4000)
}

function showHint(){
  if(gameLocked || levelFinished) return
  
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
  isProcessingMove = true  // НОВО: блокируем клики
  
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
  isProcessingMove = true  // НОВО: блокируем клики
  
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
  
