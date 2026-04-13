// ================= GLOBAL =================

let currentLevel = 1
let levelData = null

let movesLeft = 0
let score = 0
let collected = 0

let levelFinished = false
let gameLocked = false

let hintTimer = null
let processTimeout = null  // для предотвращения множественных вызовов

const SIZE = 8
const COLORS = ["red","blue","green","yellow","purple"]

let board = []
let cells = []

let selected = null


// ================= INIT =================

async function init(){
    try {
        LivesSystem.init()
        await Levels.load()
        updateScreens()
        updateCoinsUI()
    } catch(e) {
        console.error("Init error:", e)
    }
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
    if(processTimeout) clearTimeout(processTimeout)
    
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
            do {
                color = randomColor()
            } while(hasMatchAt(x, y, color))  // проверяем ДО присваивания
            
            board[y][x] = color
            
            const cell = document.createElement("div")
            cell.className = "cell"
            cell.dataset.x = x
            cell.dataset.y = y
            setColor(cell, color)
            addSwipe(cell, x, y)
            addClick(cell, x, y)  // для мыши
            boardEl.appendChild(cell)
            cells[y][x] = cell
        }
    }
}

// Исправленная функция проверки
function hasMatchAt(x, y, color){
    if(x >= 2 && board[y][x-1] === color && board[y][x-2] === color) return true
    if(y >= 2 && board[y-1][x] === color && board[y-2][x] === color) return true
    return false
}


// ================= RANDOM =================

function randomColor(){
    return COLORS[Math.floor(Math.random() * COLORS.length)]
}


// ================= COLOR (исправлен для унификации) =================

function setColor(cell, cellData){
    if(typeof cellData === "object" && cellData.special){
        // Спецэлемент
        if(cellData.special === "rocket") cell.innerHTML = "🚀"
        else if(cellData.special === "bomb") cell.innerHTML = "💣"
        else if(cellData.special === "color") cell.innerHTML = "🌈"
        cell.style.background = "#444"
    } else {
        // Обычная цветная клетка
        const color = typeof cellData === "string" ? cellData : cellData?.color
        cell.innerHTML = ""
        cell.style.background = color || "#999"
    }
}


// ================= SWIPE (touch) =================

function addSwipe(cell, x, y){
    let startX = 0, startY = 0
    
    cell.addEventListener("touchstart", e => {
        if(gameLocked) return
        startX = e.touches[0].clientX
        startY = e.touches[0].clientY
        selected = {x, y}
        highlightCell(x, y)
    })
    
    cell.addEventListener("touchend", e => {
        if(gameLocked) return
        const endX = e.changedTouches[0].clientX
        const endY = e.changedTouches[0].clientY
        const dx = endX - startX
        const dy = endY - startY
        
        let targetX = x, targetY = y
        
        if(Math.abs(dx) > Math.abs(dy)){
            if(dx > 30) targetX = x + 1
            if(dx < -30) targetX = x - 1
        } else {
            if(dy > 30) targetY = y + 1
            if(dy < -30) targetY = y - 1
        }
        
        onCellClick(targetX, targetY)
    })
}

// ================= CLICK (мышь) =================

function addClick(cell, x, y){
    cell.addEventListener("mousedown", e => {
        if(gameLocked) return
        e.preventDefault()
        selected = {x, y}
        highlightCell(x, y)
    })
    
    cell.addEventListener("mouseup", e => {
        if(gameLocked) return
        e.preventDefault()
        // В десктопной версии нужна логика drag или просто клик
        // Упрощённо: если есть selected и он отличается, пытаемся свапнуть
        if(selected && (selected.x !== x || selected.y !== y)){
            onCellClick(x, y)
        }
    })
}


// ================= HIGHLIGHT =================

function highlightCell(x, y){
    clearHints()
    clearHighlight()
    cells[y][x].classList.add("selected")
}

function clearHighlight(){
    for(let yy=0; yy<SIZE; yy++){
        for(let xx=0; xx<SIZE; xx++){
            cells[yy][xx].classList.remove("selected")
        }
    }
}


// ================= CLICK HANDLER =================

function onCellClick(x, y){
    if(gameLocked) return
    if(x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
    
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
    
    swap(selected, {x, y})
    
    clearHighlight()
    selected = null
    updateHUD()
    startHintTimer()
}


// ================= SWAP (исправлен) =================

function swap(a, b){
    if(gameLocked) return
    
    const A = board[a.y][a.x]
    const B = board[b.y][b.x]
    
    // Временная блокировка
    gameLocked = true
    
    // Меняем местами
    board[a.y][a.x] = B
    board[b.y][b.x] = A
    renderBoard()
    
    // Проверяем матчи через единый детектор
    let matches = MatchDetection.getMatches(board)
    
    if(matches.length === 0){
        // Отменяем обмен
        board[a.y][a.x] = A
        board[b.y][b.x] = B
        renderBoard()
        gameLocked = false
        return
    }
    
    // Ход корректен, уменьшаем ходы
    movesLeft--
    
    // Обрабатываем матчи
    processMatches()
}


// ================= RENDER =================

function renderBoard(){
    for(let y=0; y<SIZE; y++){
        for(let x=0; x<SIZE; x++){
            setColor(cells[y][x], board[y][x])
        }
    }
}


// ================= PROCESS MATCH (исправлен) =================

function processMatches(){
    if(processTimeout) clearTimeout(processTimeout)
    
    const matches = MatchDetection.getMatches(board)
    
    if(matches.length === 0){
        gameLocked = false
        checkWin()
        
        if(!hasPossibleMoves()){
            shuffleBoard()
        }
        return
    }
    
    // Обрабатываем все матчи
    matches.forEach(match => {
        let specialCell = null
        
        // Определяем центральную клетку для спеца
        if(match.type === "rocket" && match.cells.length >= 2){
            specialCell = match.cells[Math.floor(match.cells.length / 2)]
        } else if(match.type === "color" && match.cells.length >= 3){
            specialCell = match.cells[Math.floor(match.cells.length / 2)]
        } else if(match.type === "bomb" && match.cells.length >= 1){
            specialCell = match.cells[0]
        }
        
        match.cells.forEach(c => {
            // Пропускаем центральную клетку, если она будет заменена на спец
            if(specialCell && c.x === specialCell.x && c.y === specialCell.y) return
            
            const cell = board[c.y][c.x]
            
            // Активируем спецэлементы
            if(typeof cell === "object" && cell.special){
                Specials.activate(c.x, c.y, null, board, SIZE)
                score += 50
            }
            
            score += 10  // Базовые очки за клетку
            board[c.y][c.x] = null
        })
        
        // Создаём новый спецэлемент
        if(specialCell && match.type){
            board[specialCell.y][specialCell.x] = {
                special: match.type,
                color: randomColor()
            }
        }
    })
    
    drop()
    spawnNew()
    renderBoard()
    
    // Рекурсивный вызов с задержкой
    processTimeout = setTimeout(processMatches, 150)
}


// ================= DROP (исправлен) =================

function drop(){
    for(let x = 0; x < SIZE; x++){
        for(let y = SIZE - 1; y >= 0; y--){
            if(board[y][x] === null){
                // Ищем сверху не-null клетку
                for(let k = y - 1; k >= 0; k--){
                    if(board[k][x] !== null){
                        board[y][x] = board[k][x]
                        board[k][x] = null
                        break
                    }
                }
                // Если всё ещё null, оставляем как есть (spawnNew заполнит)
            }
        }
    }
}

function spawnNew(){
    for(let y = 0; y < SIZE; y++){
        for(let x = 0; x < SIZE; x++){
            if(board[y][x] === null){
                board[y][x] = randomColor()
            }
        }
    }
}


// ================= POSSIBLE MOVES (исправлен) =================

function hasPossibleMoves(){
    for(let y = 0; y < SIZE; y++){
        for(let x = 0; x < SIZE; x++){
            if(x < SIZE - 1){
                swapTest(x, y, x + 1, y)
                if(MatchDetection.getMatches(board).length > 0){
                    swapTest(x, y, x + 1, y)
                    return true
                }
                swapTest(x, y, x + 1, y)
            }
            
            if(y < SIZE - 1){
                swapTest(x, y, x, y + 1)
                if(MatchDetection.getMatches(board).length > 0){
                    swapTest(x, y, x, y + 1)
                    return true
                }
                swapTest(x, y, x, y + 1)
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


// ================= SHUFFLE (исправлен) =================

function shuffleBoard(){
    for(let y = 0; y < SIZE; y++){
        for(let x = 0; x < SIZE; x++){
            board[y][x] = randomColor()
        }
    }
    renderBoard()
    
    // Если после перемешивания нет возможных ходов — перемешать ещё раз
    if(!hasPossibleMoves()){
        shuffleBoard()
    }
}


// ================= HINT SYSTEM (исправлен) =================

function startHintTimer(){
    clearTimeout(hintTimer)
    hintTimer = setTimeout(showHint, 4000)
}

function showHint(){
    if(gameLocked || levelFinished) return
    
    for(let y = 0; y < SIZE; y++){
        for(let x = 0; x < SIZE; x++){
            if(x < SIZE - 1){
                swapTest(x, y, x + 1, y)
                if(MatchDetection.getMatches(board).length > 0){
                    swapTest(x, y, x + 1, y)
                    highlightHint(x, y)
                    return
                }
                swapTest(x, y, x + 1, y)
            }
            
            if(y < SIZE - 1){
                swapTest(x, y, x, y + 1)
                if(MatchDetection.getMatches(board).length > 0){
                    swapTest(x, y, x, y + 1)
                    highlightHint(x, y)
                    return
                }
                swapTest(x, y, x, y + 1)
            }
        }
    }
}

function highlightHint(x, y){
    clearHints()
    cells[y][x].classList.add("hint")
    setTimeout(clearHints, 2000)
}

function clearHints(){
    for(let y = 0; y < SIZE; y++){
        for(let x = 0; x < SIZE; x++){
            cells[y][x].classList.remove("hint")
        }
    }
}


// ================= HUD =================

function updateHUD(){
    const movesEl = document.getElementById("movesDisplay")
    if(movesEl) movesEl.innerText = `Ходы: ${movesLeft}`
    
    const targetEl = document.getElementById("targetDisplay")
    if(targetEl){
        if(levelData.type === "score"){
            targetEl.innerText = `Цель: ${score} / ${levelData.target}`
        } else if(levelData.type === "collect"){
            targetEl.innerText = `Собрано: ${collected} / ${levelData.target}`
        }
    }
}


// ================= WIN CHECK =================

function checkWin(){
    if(levelFinished) return
    
    if(levelData.type === "score" && score >= levelData.target){
        winLevel()
        return
    }
    
    if(levelData.type === "collect" && collected >= levelData.target){
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
    if(processTimeout) clearTimeout(processTimeout)
    
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
    if(processTimeout) clearTimeout(processTimeout)
    
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
    if(!coinsEl) return
    
    const rect = coinsEl.getBoundingClientRect()
    
    for(let i = 0; i < 10; i++){
        const coin = document.createElement("div")
        coin.innerHTML = "💰"
        coin.className = "coinFly"
        coin.style.left = window.innerWidth / 2 + "px"
        coin.style.top = window.innerHeight / 2 + "px"
        document.body.appendChild(coin)
        
        setTimeout(() => {
            coin.style.transform = `translate(${rect.left - window.innerWidth/2}px, ${rect.top - window.innerHeight/2}px) scale(0.5)`
            coin.style.opacity = "0"
        }, 20)
        
        setTimeout(() => coin.remove(), 900)
    }
      }
