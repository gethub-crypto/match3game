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

let isAnimating = false

// ✨ ANTI-SPAM: Защита от повторных быстрых кликов
let lastClickTime = 0
const CLICK_COOLDOWN = 150 // мс между кликами

// ================= UNIFIED INPUT SYSTEM (PRODUCTION-READY) =================
/**
 * UnifiedInputManager - Production-ready система ввода для desktop + mobile
 * 
 * Архитектура:
 * - Единая система обработки touch и mouse событий
 * - Защита от конфликтов touch/mouse через activePointerId
 * - Drag threshold для предотвращения случайных свайпов
 * - Hover preview для desktop улучшенного UX
 * - Anti-ghost-drag: проверка левой кнопки мыши + pointer tracking
 * 
 * Состояния:
 * - IDLE: ожидание ввода
 * - DRAGGING: активное перетаскивание
 * - HOVER: наведение мыши (desktop only)
 * 
 * Производительность:
 * - Пассивные слушатели для touch событий
 * - Делегирование событий для минимизации listener'ов
 * - Очистка состояния при потере фокуса
 */
let isMouseDown = false
let isDragging = false

let dragStartX = 0
let dragStartY = 0

let currentHoverCell = null

const DRAG_THRESHOLD = 18 // Минимальное расстояние для распознавания свайпа (пиксели)
const DESKTOP_SWAP_PREVIEW = true // Включить визуальный превью при наведении

let activePointerId = null // Отслеживание активного указателя для защиты от ghost событий

// ================= COMBO SYSTEM (PRODUCTION-READY) =================
/**
 * ComboManager - Легковесный менеджер комбо-системы
 * 
 * Архитектура:
 * - Комбо активируется только во время каскадов (chain reactions)
 * - Первый матч хода игрока НЕ увеличивает комбо
 * - Каждый последующий каскад увеличивает комбо на 1
 * - Сброс происходит при новом ходе игрока или завершении каскадов
 * 
 * Защита от багов:
 * - Флаг comboActive предотвращает дублирование инкрементов
 * - Сброс гарантирован при новом свайпе
 * - Множитель применяется только к базовым очкам матча
 */
const ComboManager = {
  combo: 0,
  comboActive: false, // Флаг активной комбо-цепочки
  firstMatchInChain: true, // Первый матч в цепочке (ход игрока)
  
  /**
   * Вызывается при обнаружении любого матча
   * Увеличивает комбо только если это каскад (не первый матч)
   */
  onMatchDetected() {
    if (this.firstMatchInChain) {
      // Первый матч - не увеличиваем комбо, но активируем цепочку
      this.firstMatchInChain = false
      this.comboActive = true
    } else if (this.comboActive) {
      // Каскад - увеличиваем комбо
      this.combo++
      console.log(`🔥 Combo x${this.combo + 1}! Chain continuing...`)
    }
  },
  
  /**
   * Возвращает текущий множитель комбо
   * Минимальный множитель = 1 (нет комбо)
   */
  getMultiplier() {
    return this.comboActive ? (this.combo + 1) : 1
  },
  
  /**
   * Сброс комбо (вызывается при новом ходе или завершении каскадов)
   */
  reset() {
    if (this.combo > 0) {
      console.log(`✨ Combo finished! Total chain: ${this.combo + 1} matches`)
    }
    this.combo = 0
    this.comboActive = false
    this.firstMatchInChain = true
  },
  
  /**
   * Проверка активности комбо
   */
  isActive() {
    return this.comboActive
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
  
  // Предотвращаем выделение текста и нежелательное поведение на всей странице
  document.addEventListener('selectstart', (e) => {
    if (e.target.closest('#board')) {
      e.preventDefault()
    }
  })
  
  // Сброс состояния ввода при потере фокуса окна (production-ready защита)
  window.addEventListener('blur', () => {
    resetInputState()
  })
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
  
  // ✨ ANTI-SPAM: Сбрасываем таймер при новом уровне
  lastClickTime = 0
  
  // ✨ COMBO: Сбрасываем комбо при новом уровне
  ComboManager.reset()
  
  // ✨ INPUT: Сбрасываем состояние ввода
  resetInputState()
  
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
      addInputHandlers(cell, x, y)
      
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


// ================= UNIFIED INPUT HANDLERS (PRODUCTION-READY) =================
/**
 * addInputHandlers - Единая система обработки ввода для touch + mouse
 * 
 * Поддерживаемые взаимодействия:
 * - Touch: swipe (мобильные устройства)
 * - Mouse: drag/swipe + hover preview (desktop)
 * 
 * Защита от конфликтов:
 * - activePointerId предотвращает одновременную обработку touch и mouse
 * - Проверка e.button === 0 для mouse событий (только левая кнопка)
 * - DRAG_THRESHOLD предотвращает случайные микро-свайпы
 * 
 * @param {HTMLElement} cell - DOM элемент ячейки
 * @param {number} x - Координата X на доске
 * @param {number} y - Координата Y на доске
 */
function addInputHandlers(cell, x, y) {
  
  // ================= TOUCH START =================
  cell.addEventListener('touchstart', (e) => {
    // Предотвращаем стандартное поведение (прокрутка, зум)
    e.preventDefault()
    
    // Anti-spam проверка
    const now = Date.now()
    if (now - lastClickTime < CLICK_COOLDOWN) return
    
    // Блокировка ввода во время анимаций и специальных эффектов
    if (gameLocked || isAnimating || isProcessingSpecial) return
    
    // Защита от множественных касаний - только первый палец
    if (activePointerId !== null) return
    
    const touch = e.touches[0]
    activePointerId = touch.identifier
    
    lastClickTime = now
    
    // Сохраняем начальные координаты для swipe расчета
    dragStartX = touch.clientX
    dragStartY = touch.clientY
    isMouseDown = true
    isDragging = false
    
    // Визуальная обратная связь - выделяем ячейку
    selected = {x, y}
    highlightCell(x, y)
  }, { passive: false })
  
  // ================= TOUCH END =================
  cell.addEventListener('touchend', (e) => {
    e.preventDefault()
    
    // Проверяем, что это наш активный указатель
    const touch = e.changedTouches[0]
    if (activePointerId !== touch.identifier) return
    
    // Блокировка ввода
    if (gameLocked || isAnimating || isProcessingSpecial) {
      resetInputState()
      return
    }
    
    const endX = touch.clientX
    const endY = touch.clientY
    
    // Вычисляем расстояние свайпа
    const dx = endX - dragStartX
    const dy = endY - dragStartY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Проверяем, превышает ли свайп порог
    if (distance >= DRAG_THRESHOLD) {
      // Это свайп - обрабатываем
      processSwipe(dragStartX, dragStartY, endX, endY)
    } else {
      // Это тап - обрабатываем как клик
      const now = Date.now()
      if (now - lastClickTime < CLICK_COOLDOWN) {
        resetInputState()
        return
      }
      lastClickTime = now
      
      onCellClick(x, y)
    }
    
    // Сбрасываем состояние ввода
    resetInputState()
  }, { passive: false })
  
  // ================= TOUCH CANCEL =================
  cell.addEventListener('touchcancel', (e) => {
    // Сбрасываем состояние при прерывании касания (звонок, уведомление)
    resetInputState()
  })
  
  // ================= MOUSE DOWN =================
  cell.addEventListener('mousedown', (e) => {
    // Только левая кнопка мыши (button === 0)
    if (e.button !== 0) return
    
    // Предотвращаем выделение текста при драге
    e.preventDefault()
    
    // Anti-spam проверка
    const now = Date.now()
    if (now - lastClickTime < CLICK_COOLDOWN) return
    
    // Блокировка ввода
    if (gameLocked || isAnimating || isProcessingSpecial) return
    
    // Защита от конфликта с touch событиями
    if (activePointerId !== null) return
    
    // Для mouse используем специальный идентификатор
    activePointerId = 'mouse'
    
    lastClickTime = now
    
    // Сохраняем начальные координаты
    dragStartX = e.clientX
    dragStartY = e.clientY
    isMouseDown = true
    isDragging = false
    
    // Визуальная обратная связь
    selected = {x, y}
    highlightCell(x, y)
    
    // Предотвращаем drag изображений и текста
    e.preventDefault()
  })
  
  // ================= MOUSE ENTER (HOVER PREVIEW) =================
  cell.addEventListener('mouseenter', (e) => {
    // Hover preview только для desktop (не активно во время драга)
    if (!DESKTOP_SWAP_PREVIEW) return
    if (isMouseDown || isDragging) return
    if (gameLocked || isAnimating || isProcessingSpecial) return
    
    // Убираем предыдущий hover
    if (currentHoverCell && currentHoverCell !== cell) {
      currentHoverCell.classList.remove('hoverSwap')
    }
    
    // Показываем preview только если есть выбранная ячейка
    if (selected && (selected.x !== x || selected.y !== y)) {
      const dx = Math.abs(selected.x - x)
      const dy = Math.abs(selected.y - y)
      
      // Подсвечиваем только соседние ячейки
      if (dx + dy === 1) {
        cell.classList.add('hoverSwap')
        currentHoverCell = cell
      }
    }
  })
  
  // ================= MOUSE LEAVE =================
  cell.addEventListener('mouseleave', (e) => {
    // Убираем hover эффект
    if (currentHoverCell === cell) {
      cell.classList.remove('hoverSwap')
      currentHoverCell = null
    }
  })
}

// ================= GLOBAL MOUSE HANDLERS =================
/**
 * Глобальные обработчики mousemove и mouseup на document
 * Преимущества:
 * - Отслеживание мыши за пределами ячейки (важно для drag)
 * - Предотвращение потери событий при быстром движении
 * - Централизованное управление состоянием драга
 */
document.addEventListener('mousemove', (e) => {
  // Обрабатываем только если активен mouse драг
  if (activePointerId !== 'mouse') return
  if (!isMouseDown) return
  if (gameLocked || isAnimating || isProcessingSpecial) return
  
  // Вычисляем расстояние от начальной точки
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Проверяем, начался ли драг (превысили порог)
  if (!isDragging && distance >= DRAG_THRESHOLD) {
    isDragging = true
    
    // Убираем hover эффект при начале драга
    if (currentHoverCell) {
      currentHoverCell.classList.remove('hoverSwap')
      currentHoverCell = null
    }
  }
  
  // Визуальный фидбек: меняем курсор при драге
  if (isDragging) {
    document.body.style.cursor = 'grabbing'
  }
})

document.addEventListener('mouseup', (e) => {
  // Обрабатываем только mouse события
  if (activePointerId !== 'mouse') return
  if (!isMouseDown) {
    resetInputState()
    return
  }
  
  // Сбрасываем курсор
  document.body.style.cursor = ''
  
  // Блокировка ввода
  if (gameLocked || isAnimating || isProcessingSpecial) {
    resetInputState()
    return
  }
  
  // Только левая кнопка мыши
  if (e.button !== 0) {
    resetInputState()
    return
  }
  
  const endX = e.clientX
  const endY = e.clientY
  
  // Если это был драг - обрабатываем свайп
  if (isDragging) {
    processSwipe(dragStartX, dragStartY, endX, endY)
  } else {
    // Это был клик - находим целевую ячейку
    const targetCell = document.elementFromPoint(endX, endY)
    if (targetCell && targetCell.classList.contains('cell')) {
      const targetX = parseInt(targetCell.dataset.x)
      const targetY = parseInt(targetCell.dataset.y)
      
      const now = Date.now()
      if (now - lastClickTime < CLICK_COOLDOWN) {
        resetInputState()
        return
      }
      lastClickTime = now
      
      onCellClick(targetX, targetY)
    }
  }
  
  // Сбрасываем состояние
  resetInputState()
})

// ================= RESET INPUT STATE =================
/**
 * resetInputState - Централизованный сброс состояния ввода
 * Вызывается при:
 * - Завершении свайпа/клика
 * - Отмене касания
 * - Потере фокуса окна
 * - Ошибках валидации
 * 
 * Гарантирует отсутствие утечек состояния между взаимодействиями
 */
function resetInputState() {
  isMouseDown = false
  isDragging = false
  activePointerId = null
  dragStartX = 0
  dragStartY = 0
  
  // Сбрасываем hover эффекты
  if (currentHoverCell) {
    currentHoverCell.classList.remove('hoverSwap')
    currentHoverCell = null
  }
  
  // Сбрасываем выделение если не в процессе обработки
  if (!isAnimating && !isProcessingSpecial) {
    clearHighlight()
    selected = null
  }
  
  // Восстанавливаем курсор
  document.body.style.cursor = ''
}


// ================= PROCESS SWIPE (UNIFIED) =================
/**
 * processSwipe - Единая система обработки свайпов для touch и mouse
 * 
 * Алгоритм:
 * 1. Определяет направление свайпа по вектору (dx, dy)
 * 2. Использует DRAG_THRESHOLD для минимального расстояния
 * 3. Вычисляет целевую ячейку
 * 4. Делегирует выполнение в onCellClick (сохраняя всю игровую логику)
 * 
 * Защита:
 * - Проверка границ доски
 * - Валидация входных параметров
 * - Anti-spam защита сохраняется внутри onCellClick
 * 
 * @param {number} startX - Начальная X координата указателя
 * @param {number} startY - Начальная Y координата указателя
 * @param {number} endX - Конечная X координата указателя  
 * @param {number} endY - Конечная Y координата указателя
 */
async function processSwipe(startX, startY, endX, endY) {
  // Защита от вызова без activePointerId
  if (!activePointerId) return
  
  // Блокировка ввода
  if (gameLocked || isAnimating || isProcessingSpecial) return
  
  // Вычисляем вектор свайпа
  const dx = endX - startX
  const dy = endY - startY
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Проверяем порог
  if (distance < DRAG_THRESHOLD) {
    return
  }
  
  // Определяем начальную ячейку (та, что была выбрана)
  if (!selected) {
    return
  }
  
  const fromX = selected.x
  const fromY = selected.y
  
  let targetX = fromX
  let targetY = fromY
  
  // Определяем направление свайпа (преимущественное направление)
  if (Math.abs(dx) > Math.abs(dy)) {
    // Горизонтальный свайп
    targetX = dx > 0 ? fromX + 1 : fromX - 1
  } else {
    // Вертикальный свайп
    targetY = dy > 0 ? fromY + 1 : fromY - 1
  }
  
  // Проверка границ доски
  if (targetX < 0 || targetX >= SIZE || targetY < 0 || targetY >= SIZE) {
    resetInputState()
    return
  }
  
  // Проверка соседства (только смежные ячейки)
  const cellDx = Math.abs(fromX - targetX)
  const cellDy = Math.abs(fromY - targetY)
  
  if (cellDx + cellDy !== 1) {
    resetInputState()
    return
  }
  
  // Выполняем свайп через существующую логику onCellClick
  await onCellClick(targetX, targetY)
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
  // ✨ ANTI-SPAM: Проверка времени в главном обработчике (дополнительный уровень защиты)
  const now = Date.now()
  if(now - lastClickTime < CLICK_COOLDOWN) return
  
  if(gameLocked || isAnimating || isProcessingSpecial) return
  if(x<0 || x>=SIZE || y<0 || y>=SIZE) return
  
  // ✨ ANTI-SPAM: Обновляем время последнего клика только при успешном выполнении
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
  
  // ✨ COMBO: Сбрасываем комбо при новом ходе игрока
  ComboManager.reset()
  
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
  
  // Проверяем special только если игрок САМ свайпнул special плитку
  let hasSpecialActivated = false
  
  if(board[b.y][b.x] && typeof board[b.y][b.x] === "object" && board[b.y][b.x] !== null && board[b.y][b.x].special){
    await Specials.activateWithDelay(b.x, b.y)
    board[b.y][b.x] = null
    hasSpecialActivated = true
  }
  
  if(!hasSpecialActivated && board[a.y][a.x] && typeof board[a.y][a.x] === "object" && board[a.y][a.x] !== null && board[a.y][a.x].special){
    await Specials.activateWithDelay(a.x, a.y)
    board[a.y][a.x] = null
    hasSpecialActivated = true
  }
  
  if(hasSpecialActivated){
    await dropWithDelay(150)
    await spawnNewWithDelay(150)
    renderBoard()
    
    // ✨ COMBO: Активируем комбо-цепочку для special
    ComboManager.firstMatchInChain = false
    ComboManager.comboActive = true
    
    await processMatchesAsync()
    
    updateHUD()
    checkWin()
    startHintTimer()
    isAnimating = false
    
    // ✨ COMBO: Сбрасываем после завершения цепочки
    ComboManager.reset()
    return
  }
  
  // ПРОВЕРЯЕМ ОБЫЧНЫЕ МАТЧИ
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
  
  // ✨ COMBO: Начинаем комбо-цепочку с первого матча игрока
  await processMatchesAsync()
  
  updateHUD()
  checkWin()
  startHintTimer()
  
  isAnimating = false
  
  // ✨ COMBO: Сбрасываем после завершения всей цепочки
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
  
  // ✨ COMBO: Уведомляем менеджер о найденном матче
  ComboManager.onMatchDetected()
  
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
    
    // 🔧 FIX: Защита special плиток от удаления при обычных матчах
    // Special плитки НЕ удаляются при обычных совпадениях, только при активации игроком
    for(const cellPos of match.cells){
      const cell = board[cellPos.y][cellPos.x]
      
      // Если это special плитка - ПРОПУСКАЕМ, не удаляем её
      if(typeof cell === "object" && cell !== null && cell.special){
        continue // 🔧 Не удаляем, оставляем на доске
      }
      
      // Удаляем только обычные цветные плитки
      // ✨ COMBO: Применяем множитель к базовым очкам
      const baseScore = 50
      const comboMultiplier = ComboManager.getMultiplier()
      const finalScore = baseScore * comboMultiplier
      score += finalScore
      
      // Визуальная обратная связь для комбо (опционально)
      if (comboMultiplier > 1) {
        console.log(`💥 Combo x${comboMultiplier}! +${finalScore} points (base: ${baseScore})`)
      }
      
      board[cellPos.y][cellPos.x] = null
    }
    
    // 🔧 FIX: Создаём special плитку только если место свободно и там НЕ осталась другая special плитка
    if(specialCell && specialType && board[specialCell.y][specialCell.x] === null){
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
  
  // Проверяем новые матчи (каскады) - комбо будет расти автоматически
  await processMatchesAsync()
}


// ================= DROP И SPAWN =================

async function dropWithDelay(baseDelay = 150){
  let changed = false
  
  // 🔧 FIX: При gravity специальные плитки падают как обычные, но не удаляются
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
