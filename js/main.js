// ================= GLOBAL =================

let currentLevel = 1
let levelData = null

let movesLeft = 0
let collectProgress = {}

let levelFinished = false
let gameLocked = false

let hintTimer = null
let isProcessingSpecial = false

let isAnimating = false

// ✨ ANTI-SPAM: Защита от повторных быстрых кликов
let lastClickTime = 0
const CLICK_COOLDOWN = 150 // мс между кликами

// ================= COMBO SYSTEM =================
const ComboManager = {
  combo: 0,
  comboActive: false,
  firstMatchInChain: true,
  
  onMatchDetected() {
    if (this.firstMatchInChain) {
      this.firstMatchInChain = false
      this.comboActive = true
    } else if (this.comboActive) {
      this.combo++
      console.log(`🔥 Combo x${this.combo + 1}! Chain continuing...`)
    }
  },
  
  getMultiplier() {
    return this.comboActive ? (this.combo + 1) : 1
  },
  
  reset() {
    if (this.combo > 0) {
      console.log(`✨ Combo finished! Total chain: ${this.combo + 1} matches`)
    }
    this.combo = 0
    this.comboActive = false
    this.firstMatchInChain = true
  },
  
  isActive() {
    return this.comboActive
  }
}

const SIZE = 8
const COLORS = ["red","blue","green","yellow","purple"]

let board = []
let cells = []

let selected = null

// ================= CROSS-PLATFORM INPUT MANAGER =================
const InputManager = {
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragStartCell: null,
  currentCell: null,
  isTouchDevice: false,
  
  init() {
    this.isTouchDevice = ('ontouchstart' in window) || 
                        (navigator.maxTouchPoints > 0) || 
                        (navigator.msMaxTouchPoints > 0);
    
    console.log(`📱 Device type: ${this.isTouchDevice ? 'Touch' : 'Mouse'}`);
  },
  
  getPosition(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  },
  
  getCellFromEvent(e) {
    const element = document.elementFromPoint(
      this.getPosition(e).x, 
      this.getPosition(e).y
    );
    return element?.closest('.cell');
  },
  
  reset() {
    this.isDragging = false;
    this.dragStartCell = null;
    this.currentCell = null;
  }
};

// ================= SPECIAL COMBO MANAGER =================
const SpecialComboManager = {
  processedSpecials: new Set(),
  
  getCellKey(x, y) {
    return `${x},${y}`
  },
  
  isSpecial(cell) {
    if (!cell) return false
    if (cell === null) return false
    if (typeof cell !== "object") return false
    return cell.special !== undefined || cell.type === "special"
  },
  
  getSpecialType(cell) {
    if (!cell) return null
    if (typeof cell !== "object") return null
    if (cell.special) return cell.special
    if (cell.type === "special" && cell.special) return cell.special
    return null
  },
  
  async handleSpecialSwap(cellA, cellB, posA, posB, swipeDir) {
    const typeA = this.getSpecialType(cellA)
    const typeB = this.getSpecialType(cellB)
    
    console.log(`⚡ Special Combo: ${typeA} + ${typeB} at [${posA.x},${posA.y}] & [${posB.x},${posB.y}]`)
    
    const comboKey = [typeA, typeB].sort().join('_')
    
    // Показать визуальную подсказку комбо
    TutorialSystem.showComboHint(comboKey, posA, posB)
    
    this.processedSpecials.clear()
    
    switch(comboKey) {
      case 'rocket_rocket':
        await this.rocketRocket(posA, posB, swipeDir)
        break
      case 'bomb_rocket':
        await this.rocketBomb(posA, posB, swipeDir)
        break
      case 'color_rocket':
        await this.rocketColor(posA, posB, swipeDir)
        break
      case 'bomb_bomb':
        await this.bombBomb(posA, posB, swipeDir)
        break
      case 'bomb_color':
        await this.bombColor(posA, posB, swipeDir)
        break
      case 'color_color':
        await this.colorColor(posA, posB, swipeDir)
        break
    }
    
    this.processedSpecials.clear()
    ComboManager.reset()
  },
  
  async safeActivateSpecial(x, y, color, direction) {
    const key = this.getCellKey(x, y)
    if (this.processedSpecials.has(key)) return
    
    const cell = board[y]?.[x]
    if (!cell) return
    
    if (this.isSpecial(cell)) {
      this.processedSpecials.add(key)
      await Specials.activateWithDelay(x, y, color, direction)
    }
  },
  
  // 🚀 + 🚀 = Крест
  async rocketRocket(posA, posB, swipeDir) {
    const centerX = posB.x
    const centerY = posB.y
    
    // Визуальные эффекты
    for (let i = 0; i < SIZE; i++) {
      if (cells[centerY] && cells[centerY][i]) {
        cells[centerY][i].classList.add("rocketLine")
        setTimeout(() => {
          if (cells[centerY] && cells[centerY][i]) 
            cells[centerY][i].classList.remove("rocketLine")
        }, 400)
      }
      if (cells[i] && cells[i][centerX]) {
        cells[i][centerX].classList.add("rocketLine")
        setTimeout(() => {
          if (cells[i] && cells[i][centerX]) 
            cells[i][centerX].classList.remove("rocketLine")
        }, 400)
      }
    }
    
    await delay(350)
    
    // Активируем спец-фишки и собираем обычные
    const cellsToProcess = []
    
    for (let i = 0; i < SIZE; i++) {
      const cellH = board[centerY]?.[i]
      if (cellH && !(i === centerX)) {
        cellsToProcess.push({ x: i, y: centerY, cell: cellH })
      }
      
      const cellV = board[i]?.[centerX]
      if (cellV && !(i === centerY)) {
        cellsToProcess.push({ x: centerX, y: i, cell: cellV })
      }
    }
    
    // Центральная клетка
    const centerCell = board[centerY]?.[centerX]
    if (centerCell) {
      cellsToProcess.push({ x: centerX, y: centerY, cell: centerCell })
    }
    
    // Сначала активируем все спец-фишки
    for (const item of cellsToProcess) {
      if (this.isSpecial(item.cell)) {
        const color = item.cell.color || null
        await this.safeActivateSpecial(item.x, item.y, color, 'both')
      }
    }
    
    // Удаляем обычные фишки
    for (const item of cellsToProcess) {
      if (!this.isSpecial(item.cell) || board[item.y]?.[item.x] === null) {
        const currentCell = board[item.y]?.[item.x]
        if (currentCell && !this.isSpecial(currentCell)) {
          Specials.collectCell(item.x, item.y)
          board[item.y][item.x] = null
        }
      }
    }
    
    renderBoard()
    await delay(200)
  },
  
  // 🚀 + 💣
  async rocketBomb(posA, posB, swipeDir) {
    const rocketPos = this.getSpecialType(board[posA.y]?.[posA.x]) === 'rocket' ? posA : posB
    const bombPos = this.getSpecialType(board[posA.y]?.[posA.x]) === 'bomb' ? posA : posB
    
    // 1. Сначала активируем ракету
    await Specials.activateWithDelay(rocketPos.x, rocketPos.y, null, swipeDir)
    
    await delay(300)
    
    // 2. Затем активируем бомбу
    if (board[bombPos.y]?.[bombPos.x]) {
      await Specials.activateWithDelay(bombPos.x, bombPos.y, null, null)
    }
  },
  
  // 🚀 + 🌈
  async rocketColor(posA, posB, swipeDir) {
    const colorPos = this.getSpecialType(board[posA.y]?.[posA.x]) === 'color' ? posA : posB
    const otherPos = this.getSpecialType(board[posA.y]?.[posA.x]) === 'color' ? posB : posA
    
    // Определяем цвет фишки, с которой свапнули радугу
    const otherCell = board[otherPos.y]?.[otherPos.x]
    let targetColor = null
    
    if (typeof otherCell === 'string') {
      targetColor = otherCell
    } else if (otherCell && otherCell.color) {
      targetColor = otherCell.color
    }
    
    if (!targetColor) return
    
    // Удаляем обе спец-фишки
    Specials.collectCell(posA.x, posA.y)
    Specials.collectCell(posB.x, posB.y)
    board[posA.y][posA.x] = null
    board[posB.y][posB.x] = null
    
    // Превращаем все фишки выбранного цвета в ракеты
    const rocketPositions = []
    
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = board[y]?.[x]
        if (!cell) continue
        
        let cellColor = null
        if (typeof cell === 'string') cellColor = cell
        else if (cell && cell.color) cellColor = cell.color
        
        if (cellColor === targetColor) {
          board[y][x] = {
            color: cellColor,
            special: 'rocket',
            type: 'special'
          }
          rocketPositions.push({ x, y })
        }
      }
    }
    
    renderBoard()
    await delay(300)
    
    // Активируем ракеты волной с задержкой
    for (let i = 0; i < rocketPositions.length; i++) {
      const pos = rocketPositions[i]
      const cell = board[pos.y]?.[pos.x]
      
      if (cell && this.isSpecial(cell) && this.getSpecialType(cell) === 'rocket') {
        await this.safeActivateSpecial(
          pos.x, 
          pos.y, 
          cell.color, 
          i % 2 === 0 ? 'horizontal' : 'vertical'
        )
        await delay(100)
      }
    }
  },
  
  // 💣 + 💣 = Mega Bomb
  async bombBomb(posA, posB, swipeDir) {
    const centerX = posB.x
    const centerY = posB.y
    
    await this.megaBombWithDelay(centerX, centerY)
  },
  
  async megaBombWithDelay(x, y) {
    const radius = 2
    
    // Визуальные эффекты
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx
        const ny = y + dy
        
        if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && cells[ny] && cells[ny][nx]) {
          if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
            cells[ny][nx].classList.add("bombBlast")
          } else {
            cells[ny][nx].classList.add("bombShockwave")
          }
          
          setTimeout(() => {
            if (cells[ny] && cells[ny][nx]) {
              cells[ny][nx].classList.remove("bombBlast", "bombShockwave")
            }
          }, 500)
        }
      }
    }
    
    await delay(400)
    
    // Собираем все клетки в радиусе 5x5
    const cellsToProcess = []
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx
        const ny = y + dy
        
        if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) {
          cellsToProcess.push({ x: nx, y: ny })
        }
      }
    }
    
    // Активируем спец-фишки
    for (const pos of cellsToProcess) {
      const cell = board[pos.y]?.[pos.x]
      if (cell && this.isSpecial(cell)) {
        const color = typeof cell === 'object' ? cell.color : null
        await this.safeActivateSpecial(pos.x, pos.y, color, null)
      }
    }
    
    // Удаляем обычные фишки
    for (const pos of cellsToProcess) {
      const cell = board[pos.y]?.[pos.x]
      if (cell && !this.isSpecial(cell)) {
        Specials.collectCell(pos.x, pos.y)
        board[pos.y][pos.x] = null
      }
    }
    
    renderBoard()
    await delay(200)
    
    // Запускаем 3 дополнительные ракеты в случайных направлениях
    const directions = ['horizontal', 'vertical']
    const rocketCount = 3
    
    for (let i = 0; i < rocketCount; i++) {
      const randomDir = directions[Math.floor(Math.random() * directions.length)]
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)]
      
      let rx, ry
      
      do {
        rx = Math.floor(Math.random() * SIZE)
        ry = Math.floor(Math.random() * SIZE)
      } while (board[ry]?.[rx] !== null && board[ry]?.[rx] !== undefined)
      
      board[ry][rx] = {
        color: randomColor,
        special: 'rocket',
        type: 'special'
      }
      await this.safeActivateSpecial(rx, ry, randomColor, randomDir)
      await delay(150)
    }
  },
  
  // 💣 + 🌈
  async bombColor(posA, posB, swipeDir) {
    const colorPos = this.getSpecialType(board[posA.y]?.[posA.x]) === 'color' ? posA : posB
    const otherPos = this.getSpecialType(board[posA.y]?.[posA.x]) === 'color' ? posB : posA
    
    // Определяем цвет
    const otherCell = board[otherPos.y]?.[otherPos.x]
    let targetColor = null
    
    if (typeof otherCell === 'string') {
      targetColor = otherCell
    } else if (otherCell && otherCell.color) {
      targetColor = otherCell.color
    }
    
    if (!targetColor) return
    
    // Удаляем обе спец-фишки
    Specials.collectCell(posA.x, posA.y)
    Specials.collectCell(posB.x, posB.y)
    board[posA.y][posA.x] = null
    board[posB.y][posB.x] = null
    
    // Превращаем все фишки выбранного цвета в бомбы
    const bombPositions = []
    
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = board[y]?.[x]
        if (!cell) continue
        
        let cellColor = null
        if (typeof cell === 'string') cellColor = cell
        else if (cell && cell.color) cellColor = cell.color
        
        if (cellColor === targetColor) {
          board[y][x] = {
            color: cellColor,
            special: 'bomb',
            type: 'special'
          }
          bombPositions.push({ x, y })
        }
      }
    }
    
    renderBoard()
    await delay(300)
    
    // Взрываем все бомбы одновременно (волнами для эффекта)
    for (const pos of bombPositions) {
      const cell = board[pos.y]?.[pos.x]
      if (cell && this.isSpecial(cell) && this.getSpecialType(cell) === 'bomb') {
        await this.safeActivateSpecial(pos.x, pos.y, cell.color, null)
      }
    }
  },
  
  // 🌈 + 🌈 = Полная очистка поля
  async colorColor(posA, posB, swipeDir) {
    const allPositions = []
    
    // Собираем все позиции на поле
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (board[y]?.[x]) {
          allPositions.push({ x, y })
        }
      }
    }
    
    // Мощная анимация очистки
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (cells[y] && cells[y][x]) {
          cells[y][x].classList.add("rainbowFlash")
          setTimeout(() => {
            if (cells[y] && cells[y][x]) 
              cells[y][x].classList.remove("rainbowFlash")
          }, 600)
        }
      }
    }
    
    await delay(400)
    
    // Сначала активируем все спец-фишки
    for (const pos of allPositions) {
      const cell = board[pos.y]?.[pos.x]
      if (cell && this.isSpecial(cell)) {
        const color = typeof cell === 'object' ? cell.color : null
        await this.safeActivateSpecial(pos.x, pos.y, color, null)
      }
    }
    
    // Затем удаляем все оставшиеся фишки
    for (const pos of allPositions) {
      const cell = board[pos.y]?.[pos.x]
      if (cell) {
        Specials.collectCell(pos.x, pos.y)
        board[pos.y][pos.x] = null
      }
    }
    
    renderBoard()
    await delay(300)
  }
}

// ================= TUTORIAL SYSTEM =================
const TutorialSystem = {
  hasSeenSpecialTutorial: false,
  hasSeenComboTutorial: false,
  activeHintArrows: [],
  
  init() {
    this.hasSeenSpecialTutorial = localStorage.getItem('seenSpecialTutorial') === 'true'
    this.hasSeenComboTutorial = localStorage.getItem('seenComboTutorial') === 'true'
  },
  
  showSpecialHint(specialType, x, y) {
    if (this.hasSeenSpecialTutorial) return
    
    const cell = cells[y]?.[x]
    if (!cell) return
    
    // Подсвечиваем спец-фишку
    cell.classList.add('special-glow')
    
    // Показываем стрелки к соседним клеткам
    const neighbors = this.getNeighbors(x, y)
    neighbors.forEach(({nx, ny, direction}) => {
      const neighborCell = cells[ny]?.[nx]
      if (neighborCell) {
        // Добавляем стрелку-подсказку
        const arrow = document.createElement('div')
        arrow.className = `hint-arrow hint-${direction}`
        arrow.innerHTML = direction === 'up' ? '↑' : 
                         direction === 'down' ? '↓' : 
                         direction === 'left' ? '←' : '→'
        neighborCell.appendChild(arrow)
        this.activeHintArrows.push({ element: arrow, cell: neighborCell })
        
        // Подсвечиваем соседнюю клетку
        neighborCell.classList.add('hint-neighbor')
      }
    })
    
    // Автоматически убираем подсказку через 5 секунд
    setTimeout(() => this.clearSpecialHint(), 5000)
    
    // Отмечаем что видели туториал спец-фишек
    this.hasSeenSpecialTutorial = true
    localStorage.setItem('seenSpecialTutorial', 'true')
  },
  
  showComboHint(comboType, posA, posB) {
    if (this.hasSeenComboTutorial) return
    
    const cellA = cells[posA.y]?.[posA.x]
    const cellB = cells[posB.y]?.[posB.x]
    
    if (!cellA || !cellB) return
    
    // Создаем эффект "молнии" между двумя спец-фишками
    const comboEffect = document.createElement('div')
    comboEffect.className = 'combo-spark'
    
    // Позиционируем между двумя клетками
    const rectA = cellA.getBoundingClientRect()
    const rectB = cellB.getBoundingClientRect()
    const boardRect = document.getElementById('board').getBoundingClientRect()
    
    const centerX = (rectA.left + rectA.right + rectB.left + rectB.right) / 4 - boardRect.left
    const centerY = (rectA.top + rectA.bottom + rectB.top + rectB.bottom) / 4 - boardRect.top
    
    comboEffect.style.left = centerX + 'px'
    comboEffect.style.top = centerY + 'px'
    
    // Иконка комбо
    const icons = {
      'rocket_rocket': '✚',
      'bomb_rocket': '⚡',
      'color_rocket': '✨',
      'bomb_bomb': '💥',
      'bomb_color': '🎆',
      'color_color': '🌟'
    }
    
    comboEffect.innerHTML = icons[comboType] || '⚡'
    document.getElementById('board').appendChild(comboEffect)
    
    // Эффект соединения
    cellA.classList.add('combo-link')
    cellB.classList.add('combo-link')
    
    // Автоматически убираем через 3 секунды
    setTimeout(() => {
      comboEffect.remove()
      cellA.classList.remove('combo-link')
      cellB.classList.remove('combo-link')
    }, 3000)
    
    // Отмечаем что видели туториал комбо
    this.hasSeenComboTutorial = true
    localStorage.setItem('seenComboTutorial', 'true')
  },
  
  getNeighbors(x, y) {
    const neighbors = []
    if (y > 0) neighbors.push({nx: x, ny: y - 1, direction: 'up'})
    if (y < SIZE - 1) neighbors.push({nx: x, ny: y + 1, direction: 'down'})
    if (x > 0) neighbors.push({nx: x - 1, ny: y, direction: 'left'})
    if (x < SIZE - 1) neighbors.push({nx: x + 1, ny: y, direction: 'right'})
    return neighbors
  },
  
  clearSpecialHint() {
    // Убираем свечение
    const glowing = document.querySelector('.special-glow')
    if (glowing) glowing.classList.remove('special-glow')
    
    // Убираем стрелки
    this.activeHintArrows.forEach(({element, cell}) => {
      element.remove()
      cell.classList.remove('hint-neighbor')
    })
    this.activeHintArrows = []
    
    // Убираем подсветку соседей
    document.querySelectorAll('.hint-neighbor').forEach(el => {
      el.classList.remove('hint-neighbor')
    })
  }
}

// ================= INIT =================

async function init(){
  InputManager.init();
  TutorialSystem.init();
  LivesSystem.init()
  await Levels.load()
  updateScreens()
  updateCoinsUI()
  
  setupGlobalMouseHandlers();
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
  
  lastClickTime = 0
  
  ComboManager.reset()
  InputManager.reset()
  
  levelData = Levels.get(currentLevel)
  
  collectProgress = {}
  
  createBoard()
  startGameplay()
  initCollectTracker()
  startHintTimer()
}


// ================= GAMEPLAY =================

function startGameplay(){
  movesLeft = levelData.moves
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
      setupCrossPlatformInput(cell, x, y)
      
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


// ================= CROSS-PLATFORM INPUT SETUP =================

function setupCrossPlatformInput(cell, x, y) {
  cell.addEventListener('dragstart', (e) => e.preventDefault());
  
  cell.addEventListener('mousedown', (e) => {
    e.preventDefault();
    handleDragStart(x, y, e);
  });
  
  cell.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleDragStart(x, y, e);
  }, { passive: false });
}

function setupGlobalMouseHandlers() {
  document.addEventListener('mousemove', (e) => {
    if (InputManager.isDragging) {
      e.preventDefault();
      handleDragMove(e);
    }
  });
  
  document.addEventListener('mouseup', (e) => {
    if (InputManager.isDragging) {
      e.preventDefault();
      handleDragEnd(e);
    }
  });
  
  document.addEventListener('touchmove', (e) => {
    if (InputManager.isDragging) {
      e.preventDefault();
      handleDragMove(e);
    }
  }, { passive: false });
  
  document.addEventListener('touchend', (e) => {
    if (InputManager.isDragging) {
      e.preventDefault();
      handleDragEnd(e);
    }
  });
  
  document.addEventListener('touchcancel', () => {
    InputManager.reset();
    clearHighlight();
  });
  
  window.addEventListener('blur', () => {
    InputManager.reset();
    clearHighlight();
  });
}

function handleDragStart(x, y, e) {
  const now = Date.now()
  if(now - lastClickTime < CLICK_COOLDOWN) return
  
  if(gameLocked || isAnimating || isProcessingSpecial) return
  
  lastClickTime = now
  
  const pos = InputManager.getPosition(e);
  InputManager.isDragging = true;
  InputManager.dragStartX = pos.x;
  InputManager.dragStartY = pos.y;
  InputManager.dragStartCell = { x, y };
  
  if (!InputManager.isTouchDevice && !selected) {
    selected = { x, y };
    highlightCell(x, y);
  } else if (InputManager.isTouchDevice) {
    selected = { x, y };
    highlightCell(x, y);
  }
}

function handleDragMove(e) {
  if (!InputManager.isDragging) return;
  
  const pos = InputManager.getPosition(e);
  const currentCell = InputManager.getCellFromEvent(e);
  
  if (currentCell) {
    const x = parseInt(currentCell.dataset.x);
    const y = parseInt(currentCell.dataset.y);
    
    if (!InputManager.isTouchDevice && InputManager.dragStartCell) {
      highlightCell(InputManager.dragStartCell.x, InputManager.dragStartCell.y);
    }
    
    updateDragHighlight(x, y);
  }
}

function handleDragEnd(e) {
  if (!InputManager.isDragging || !InputManager.dragStartCell) {
    InputManager.reset();
    return;
  }
  
  const pos = InputManager.getPosition(e);
  const dx = pos.x - InputManager.dragStartX;
  const dy = pos.y - InputManager.dragStartY;
  
  const startX = InputManager.dragStartCell.x;
  const startY = InputManager.dragStartCell.y;
  
  let targetX = startX;
  let targetY = startY;
  
  const threshold = 20;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    if (Math.abs(dx) > threshold) {
      targetX = dx > 0 ? startX + 1 : startX - 1;
    }
  } else {
    if (Math.abs(dy) > threshold) {
      targetY = dy > 0 ? startY + 1 : startY - 1;
    }
  }
  
  InputManager.reset();
  
  onCellClick(targetX, targetY);
}

function updateDragHighlight(currentX, currentY) {
  if (!InputManager.dragStartCell) return;
  
  clearHighlight();
  
  if (InputManager.dragStartCell) {
    cells[InputManager.dragStartCell.y][InputManager.dragStartCell.x]?.classList.add('selected');
  }
  
  if (Math.abs(currentX - InputManager.dragStartCell.x) === 1 && currentY === InputManager.dragStartCell.y) {
    cells[InputManager.dragStartCell.y][currentX]?.classList.add('drag-target');
  } else if (Math.abs(currentY - InputManager.dragStartCell.y) === 1 && currentX === InputManager.dragStartCell.x) {
    cells[currentY][InputManager.dragStartCell.x]?.classList.add('drag-target');
  }
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
      cells[yy][xx].classList.remove("selected", "drag-target")
    }
  }
}


// ================= CLICK (ГЛАВНЫЙ ОБРАБОТЧИК) =================

async function onCellClick(x, y){
  const now = Date.now()
  if(now - lastClickTime < CLICK_COOLDOWN) return
  
  if(gameLocked || isAnimating || isProcessingSpecial) return
  if(x<0 || x>=SIZE || y<0 || y>=SIZE) return
  
  lastClickTime = now
  
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
  
  // Определяем направление свайпа
  const swipeDir = (a.x !== b.x) ? 'horizontal' : 'vertical'
  
  const cellA = board[a.y]?.[a.x]
  const cellB = board[b.y]?.[b.x]
  
  // Проверка на комбинацию двух спец-фишек
  if (SpecialComboManager.isSpecial(cellA) && SpecialComboManager.isSpecial(cellB)) {
    await SpecialComboManager.handleSpecialSwap(cellA, cellB, a, b, swipeDir)
    
    await dropWithDelay(150)
    await spawnNewWithDelay(150)
    renderBoard()
    
    ComboManager.firstMatchInChain = false
    ComboManager.comboActive = true
    
    await processMatchesAsync()
    
    updateHUD()
    checkWin()
    startHintTimer()
    isAnimating = false
    return
  }
  
  let hasSpecialActivated = false
  
  if(cellB && SpecialComboManager.isSpecial(cellB)){
    await Specials.activateWithDelay(b.x, b.y, null, swipeDir)
    board[b.y][b.x] = null
    hasSpecialActivated = true
  }
  
  if(!hasSpecialActivated && cellA && SpecialComboManager.isSpecial(cellA)){
    await Specials.activateWithDelay(a.x, a.y, null, swipeDir)
    board[a.y][a.x] = null
    hasSpecialActivated = true
  }
  
  if(hasSpecialActivated){
    await dropWithDelay(150)
    await spawnNewWithDelay(150)
    renderBoard()
    
    ComboManager.firstMatchInChain = false
    ComboManager.comboActive = true
    
    await processMatchesAsync()
    
    updateHUD()
    checkWin()
    startHintTimer()
    isAnimating = false
    
    ComboManager.reset()
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
  
  await processMatchesAsync()
  
  updateHUD()
  checkWin()
  startHintTimer()
  
  isAnimating = false
  
  ComboManager.reset()
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
      
      // 🎯 COLLECT: Сбор фишек нужного цвета с комбо-бонусом
      const cellColor = board[cellPos.y][cellPos.x]
      if (levelData.colors) {
        if (typeof cellColor === "string" && levelData.colors.includes(cellColor)) {
          const comboBonus = ComboManager.isActive() ? ComboManager.combo : 0
          const totalCollected = 1 + comboBonus
          
          collectProgress[cellColor] = (collectProgress[cellColor] || 0) + totalCollected
          updateCollectTracker(cellColor)
          
          if (comboBonus > 0) {
            console.log(`🔥 Combo x${comboBonus + 1}! +${totalCollected} ${cellColor} chips`)
          }
        }
      }
      
      board[cellPos.y][cellPos.x] = null
    }
    
    if(specialCell && specialType && board[specialCell.y][specialCell.x] === null){
      board[specialCell.y][specialCell.x] = {
        color: randomColor(),
        special: specialType,
        type: "special"
      }
      
      // Показать визуальную подсказку при первом создании спец-фишки
      TutorialSystem.showSpecialHint(specialType, specialCell.x, specialCell.y)
    }
    
    match.cells.forEach(cellPos => {
      const el = cells[cellPos.y]?.[cellPos.x]
      if(el) el.classList.remove("matchFlash")
    })
    
    renderBoard()
    await delay(300)
  }
  
  await dropWithDelay(150)
  await spawnNewWithDelay(150)
  renderBoard()
  await delay(200)
  
  updateHUD()
  
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
  
  const targetDisplay = document.getElementById("targetDisplay")
  if (!targetDisplay) return
  
  targetDisplay.innerHTML = ""
  
  if (levelData.colors) {
    levelData.colors.forEach(color => {
      const progress = collectProgress[color] || 0
      
      const chip = document.createElement("span")
      chip.className = "target-chip"
      
      chip.innerHTML = `
        <span class="color-dot" style="background:${color}"></span>
        <span class="target-counter">${progress}/${levelData.target}</span>
      `
      targetDisplay.appendChild(chip)
    })
  }
}


// ================= COLLECT TRACKER =================

function initCollectTracker() {
  const tracker = document.getElementById("collectTracker")
  if (!tracker) return

  tracker.innerHTML = ""

  if (!levelData.colors) return

  collectProgress = {}

  levelData.colors.forEach(color => {
    collectProgress[color] = 0

    const item = document.createElement("div")
    item.className = "collect-item"
    item.id = `collect-${color}`

    item.innerHTML = `
      <span class="color-dot large" style="background:${color}"></span>
      <span class="collect-counter">
        <span class="done">0</span>/<span class="total">${levelData.target}</span>
      </span>
    `

    tracker.appendChild(item)
  })
}

function updateCollectTracker(color) {
  const item = document.getElementById(`collect-${color}`)
  if (!item) return

  const current = collectProgress[color] || 0

  const done = item.querySelector(".done")
  if (done) done.textContent = current

  if (current > 0) {
    item.classList.add("collected")
  }

  if (current >= levelData.target) {
    item.classList.add("complete")
  }

  item.classList.remove("pulse")
  void item.offsetWidth
  item.classList.add("pulse")
}


// ================= WIN CHECK =================

function checkWin(){
  if(levelFinished) return
  
  const allColorsComplete = levelData.colors.every(color => {
    return (collectProgress[color] || 0) >= levelData.target
  })
  
  if (allColorsComplete) {
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
  
  completeLevel(currentLevel)
  
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


// ================= LEVEL MAP =================

async function renderLevelMap() {
  await Levels.load()
  const grid = document.getElementById("levelGrid")
  if (!grid) return

  const completed = getCompletedLevels()
  const levels = Levels.getAll()

  grid.innerHTML = levels.map(l => {
    let cls = "locked"
    if (completed.includes(l.id)) cls = "completed"
    else if (isLevelUnlocked(l.id)) cls = "unlocked"

    const disabled = cls === "locked" ? "disabled" : ""
    return `<button class="level-btn ${cls}" ${disabled}
      onclick="selectLevel(${l.id})">${l.id}</button>`
  }).join("")
}

function selectLevel(id) {
  if (!isLevelUnlocked(id)) return
  currentLevel = id
  startLevel()
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
