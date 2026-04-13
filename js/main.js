// ================= GLOBAL =================

let currentLevel = 1
let levelData = null

let movesLeft = 0
let score = 0
let collected = 0

let levelFinished = false
let gameLocked = false

let hintTimer = null
let processTimeout = null
let isProcessing = false

const SIZE = 8
const COLORS = ["red","blue","green","yellow","purple"]

let board = []
let cells = []

let selected = null


// ================= INIT =================

async function init(){
    try {
        if(typeof LivesSystem !== "undefined") LivesSystem.init()
        if(typeof Levels !== "undefined") await Levels.load()
        updateScreens()
        updateCoinsUI()
    } catch(e){
        console.log("Init error", e)
    }
}

window.onload = init


// ================= START LEVEL =================

function startLevel(){
    if(typeof LivesSystem !== "undefined" && !LivesSystem.hasLives()){
        if(typeof LivesSystem.showNoLivesPopup === "function") LivesSystem.showNoLivesPopup()
        return
    }
    if(typeof goTo === "function") goTo("game")
    initLevel()
}


// ================= INIT LEVEL =================

function initLevel(){
    levelFinished = false
    gameLocked = false
    isProcessing = false
    if(processTimeout) clearTimeout(processTimeout)
    if(hintTimer) clearTimeout(hintTimer)
    
    if(typeof Levels !== "undefined") levelData = Levels.get(currentLevel)
    else {
        levelData = { moves: 20, type: "score", target: 500, reward: 10 }
    }
    
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
    if(!boardEl) return
    
    boardEl.innerHTML = ""
    board = []
    cells = []

    for(let y = 0; y < SIZE; y++){
        board[y] = []
        cells[y] = []
        for(let x = 0; x < SIZE; x++){
            let color
            let attempts = 0
            do {
                color = randomColor()
                attempts++
                if(attempts > 100) break
            } while(hasMatchAt(x, y, color))
            
            board[y][x] = color
            
            const cell = document.createElement("div")
            cell.className = "cell"
            cell.dataset.x = x
            cell.dataset.y = y
            setColor(cell, color)
            
            addTouchEvents(cell, x, y)
            addMouseEvents(cell, x, y)
            
            boardEl.appendChild(cell)
            cells[y][x] = cell
        }
    }
}

function hasMatchAt(x, y, color){
    if(x >= 2 && board[y][x-1] === color && board[y][x-2] === color) return true
    if(y >= 2 && board[y-1][x] === color && board[y-2][x] === color) return true
    return false
}


// ================= RANDOM =================

function randomColor(){
    return COLORS[Math.floor(Math.random() * COLORS.length)]
}


// ================= COLOR & RENDER =================

function setColor(cell, cellData){
    if(!cell) return
    
    if(typeof cellData === "object" && cellData && cellData.special){
        if(cellData.special === "rocket") cell.innerHTML = "🚀"
        else if(cellData.special === "bomb") cell.innerHTML = "💣"
        else if(cellData.special === "color") cell.innerHTML = "🌈"
        else cell.innerHTML = "?"
        cell.style.background = "#444"
        cell.style.color = "white"
        cell.style.fontSize = "28px"
        cell.style.display = "flex"
        cell.style.alignItems = "center"
        cell.style.justifyContent = "center"
    } else {
        const color = typeof cellData === "string" ? cellData : (cellData?.color || "#999")
        cell.innerHTML = ""
        cell.style.background = color
    }
}

function renderBoard(){
    for(let y = 0; y < SIZE; y++){
        for(let x = 0; x < SIZE; x++){
            setColor(cells[y][x], board[y][x])
        }
    }
}


// ================= TOUCH EVENTS =================

function addTouchEvents(cell, x, y){
    let touchStartX = 0
    let touchStartY = 0
    let isTouching = false
    
    cell.addEventListener("touchstart", (e) => {
        if(gameLocked || levelFinished) return
        e.preventDefault()
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
        isTouching = true
        selected = { x, y }
        highlightCell(x, y)
    })
    
    cell.addEventListener("touchmove", (e) => {
        if(!isTouching || gameLocked || levelFinished) return
        e.preventDefault()
        
        const endX = e.touches[0].clientX
        const endY = e.touches[0].clientY
        const dx = endX - touchStartX
        const dy = endY - touchStartY
        
        let targetX = x
        let targetY = y
        
        if(Math.abs(dx) > Math.abs(dy)){
            if(dx > 30) targetX = x + 1
            if(dx < -30) targetX = x - 1
        } else {
            if(dy > 30) targetY = y + 1
            if(dy < -30) targetY = y - 1
        }
        
        if((targetX !== x || targetY !== y) && targetX >= 0 && targetX < SIZE && targetY >= 0 && targetY < SIZE){
            isTouching = false
            onCellClick(targetX, targetY)
        }
    })
    
    cell.addEventListener("touchend", (e) => {
        isTouching = false
        e.preventDefault()
    })
    
    cell.addEventListener("touchcancel", (e) => {
        isTouching = false
        e.preventDefault()
    })
}


// ================= MOUSE EVENTS =================

function addMouseEvents(cell, x, y){
    let mouseStartX = 0
    let mouseStartY = 0
    let isDragging = false
    let hasMoved = false
    
    cell.addEventListener("mousedown", (e) => {
        if(gameLocked || levelFinished) return
        e.preventDefault()
        mouseStartX = e.clientX
        mouseStartY = e.clientY
        isDragging = true
        hasMoved = false
        selected = { x, y }
        highlightCell(x, y)
    })
    
    cell.addEventListener("mousemove", (e) => {
        if(!isDragging || gameLocked || levelFinished) return
        e.preventDefault()
        
        const dx = e.clientX - mouseStartX
        const dy = e.clientY - mouseStartY
        
        let targetX = x
        let targetY = y
        
        if(Math.abs(dx) > Math.abs(dy)){
            if(dx > 20) targetX = x + 1
            if(dx < -20) targetX = x - 1
        } else {
            if(dy > 20) targetY = y + 1
            if(dy < -20) targetY = y - 1
        }
        
        if((targetX !== x || targetY !== y) && targetX >= 0 && targetX < SIZE && targetY >= 0 && targetY < SIZE){
            isDragging = false
            hasMoved = true
            onCellClick(targetX, targetY)
        }
    })
    
    cell.addEventListener("mouseup", (e) => {
        if(!isDragging || gameLocked || levelFinished) {
            isDragging = false
            return
        }
        e.preventDefault()
        isDragging = false
    })
    
    cell.addEventListener("mouseleave", (e) => {
        isDragging = false
    })
}


// ================= HIGHLIGHT =================

function highlightCell(x, y){
    clearHints()
    clearHighlight()
    if(cells[y] && cells[y][x]) cells[y][x].classList.add("selected")
}

function clearHighlight(){
    for(let y = 0; y < SIZE; y++){
        for(let x = 0; x < SIZE; x++){
            if(cells[y] && cells[y][x]) cells[y][x].classList.remove("selected")
        }
    }
}


// ================= CLICK HANDLER =================

function onCellClick(x, y){
    if(gameLocked || levelFinished) return
    if(x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
    
    if(!selected){
        selected = { x, y }
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
    
    swap(selected, { x, y })
    
    clearHighlight()
    selected = null
    updateHUD()
    startHintTimer()
}


// ================= SWAP =================

function swap(a, b){
    if(gameLocked || levelFinished) return
    
    const A = board[a.y][a.x]
    const B = board[b.y][b.x]
    
    board[a.y][a.x] = B
    board[b.y][b.x] = A
    renderBoard()
    
    let matches = []
    if(typeof matchDetection !== "undefined" && matchDetection.getMatches){
        matches = matchDetection.getMatches(board)
    } else {
        matches = checkMatchesSimple()
    }
    
    if(matches.length === 0){
        board[a.y][a.x] = A
        board[b.y][b.x] = B
        renderBoard()
        return
    }
    
    gameLocked = true
    movesLeft--
    updateHUD()
    
    processMatches()
}


// ================= ПРОСТАЯ ПРОВЕРКА МАТЧЕЙ =================

function checkMatchesSimple(){
    const matches = []
    
    for(let y = 0; y < SIZE; y++){
        let count = 1
        for(let x = 1; x < SIZE; x++){
            const curr = board[y][x]
            const prev = board[y][x-1]
            if(curr === prev && curr !== null){
                count++
            } else {
                if(count >= 3){
                    for(let i = 0; i < count; i++){
                        matches.push({ x: x-1-i, y })
                    }
                }
                count = 1
            }
        }
        if(count >= 3){
            for(let i = 0; i < count; i++){
                matches.push({ x: SIZE-1-i, y })
            }
        }
    }
    
    for(let x = 0; x < SIZE; x++){
        let count = 1
        for(let y = 1; y < SIZE; y++){
            const curr = board[y][x]
            const prev = board[y-1][x]
            if(curr === prev && curr !== null){
                count++
            } else {
                if(count >= 3){
                    for(let i = 0; i < count; i++){
                        matches.push({ x, y: y-1-i })
                    }
                }
                count = 1
            }
        }
        if(count >= 3){
            for(let i = 0; i < count; i++){
                matches.push({ x, y: SIZE-1-i })
            }
        }
    }
    
    return matches
}


// ================= PROCESS MATCH =================

function processMatches(){
    if(processTimeout) clearTimeout(processTimeout)
    if(isProcessing) return
    isProcessing = true
    
    let matches = []
    if(typeof matchDetection !== "undefined" && matchDetection.getMatches){
        matches = matchDetection.getMatches(board)
    } else {
        matches = checkMatchesSimple()
    }
    
    if(matches.length === 0){
        gameLocked = false
        isProcessing = false
        checkWin()
        
        if(!hasPossibleMoves()){
            shuffleBoard()
        }
        return
    }
    
    for(let match of matches){
        let specialCell = null
        
        if(match.type === "rocket" && match.cells && match.cells.length >= 2){
            specialCell = match.cells[Math.floor(match.cells.length / 2)]
        } else if(match.type === "color" && match.cells && match.cells.length >= 3){
            specialCell = match.cells[Math.floor(match.cells.length / 2)]
        } else if(match.type === "bomb" && match.cells && match.cells.length >= 1){
            specialCell = match.cells[0]
        }
        
        if(match.cells){
            for(let c of match.cells){
                if(specialCell && c.x === specialCell.x && c.y === specialCell.y) continue
                
                const cell = board[c.y][c.x]
                
                if(cell && typeof cell === "object" && cell.special){
                    if(typeof specials !== "undefined" && specials.activate){
                        specials.activate(c.x, c.y, null, board, SIZE)
                    }
                    score += 50
                }
                
                score += 10
                board[c.y][c.x] = null
            }
        }
        
        if(specialCell && match.type){
            board[specialCell.y][specialCell.x] = {
                special: match.type,
                color: randomColor()
            }
        }
    }
    
    drop()
    spawnNew()
    renderBoard()
    
    processTimeout = setTimeout(() => {
        isProcessing = false
        let newMatches = []
        if(typeof matchDetection !== "undefined" && matchDetection.getMatches){
            newMatches = matchDetection.getMatches(board)
        } else {
            newMatches = checkMatchesSimple()
        }
        
        if(newMatches.length > 0){
            processMatches()
        } else {
            gameLocked = false
            checkWin()
        }
    }, 120)
}


// ================= DROP =================

function drop(){
    for(let x = 0; x < SIZE; x++){
        const column = []
        
        for(let y = 0; y < SIZE; y++){
            if(board[y][x] !== null){
                column.push(board[y][x])
            }
        }
        
        for(let y = SIZE - 1; y >= 0; y--){
            if(column.length > 0){
                board[y][x] = column.pop()
            } else {
                board[y][x] = null
            }
        }
    }
}


// ================= SPAWN NEW =================

function spawnNew(){
    for(let y = 0; y < SIZE; y++){
        for(let x = 0; x < SIZE; x++){
            if(board[y][x] === null){
                board[y][x] = randomColor()
            }
        }
    }
}


// ================= POSSIBLE MOVES =================

function hasPossibleMoves(){
    for(let y = 0; y < SIZE; y++){
        for(let x = 0; x < SIZE; x++){
            if(x < SIZE - 1){
                swapTest(x, y, x+1, y)
                let matches = []
                if(typeof matchDetection !== "undefined" && matchDetection.getMatches){
                    matches = matchDetection.getMatches(board)
                } else {
                    matches = checkMatchesSimple()
                }
                if(matches.length > 0){
                    swapTest(x, y, x+1, y)
                    return true
                }
                swapTest(x, y, x+1, y)
            }
            
            if(y < SIZE - 1){
                swapTest(x, y, x, y+1)
                let matches = []
                if(typeof matchDetection !== "undefined" && matchDetection.getMatches){
                    matches = matchDetection.getMatches(board)
                } else {
                    matches = checkMatchesSimple()
                }
                if(matches.length > 0){
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
    for(let y = 0; y < SIZE; y++){
        for(let x = 0; x < SIZE; x++){
            board[y][x] = randomColor()
        }
    }
    renderBoard()
    
    if(!hasPossibleMoves()){
        shuffleBoard()
    }
}


// ================= HINT SYSTEM =================

function startHintTimer(){
    if(hintTimer) clearTimeout(hintTimer)
    if(!gameLocked && !levelFinished){
        hintTimer = setTimeout(showHint, 4000)
    }
}

function showHint(){
    if(gameLocked || levelFinished) return
    
    for(let y = 0; y < SIZE; y++){
        for(let x = 0; x < SIZE; x++){
            if(x < SIZE - 1){
                swapTest(x, y, x+1, y)
                let matches = []
                if(typeof matchDetection !== "undefined" && matchDetection.getMatches){
                    matches = matchDetection.getMatches(board)
                } else {
                    matches = checkMatchesSimple()
                }
                if(matches.length > 0){
                    swapTest(x, y, x+1, y)
                    highlightHint(x, y)
                    return
                }
                swapTest(x, y, x+1, y)
            }
            
            if(y < SIZE - 1){
                swapTest(x, y, x, y+1)
                let matches = []
                if(typeof matchDetection !== "undefined" && matchDetection.getMatches){
                    matches = matchDetection.getMatches(board)
                } else {
                    matches = checkMatchesSimple()
                }
                if(matches.length > 0){
                    swapTest(x, y, x, y+1)
                    highlightHint(x, y)
                    return
                }
                swapTest(x, y, x, y+1)
            }
        }
    }
}

function highlightHint(x, y){
    clearHints()
    if(cells[y] && cells[y][x]) cells[y][x].classList.add("hint")
    setTimeout(clearHints, 2000)
}

function clearHints(){
    for(let y = 0; y < SIZE; y++){
        for(let x = 0; x < SIZE; x++){
            if(cells[y] && cells[y][x]) cells[y][x].classList.remove("hint")
        }
    }
}


// ================= HUD =================

function updateHUD(){
    const movesEl = document.getElementById("movesDisplay")
    if(movesEl) movesEl.innerText = "Ходы: " + movesLeft
    
    const targetEl = document.getElementById("targetDisplay")
    if(targetEl && levelData){
        if(levelData.type === "score"){
            targetEl.innerText = "Цель: " + score + " / " + levelData.target
        } else if(levelData.type === "collect"){
            targetEl.innerText = "Собрано: " + collected + " / " + levelData.target
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
    
    if(movesLeft <= 0 && !levelFinished){
        loseLevel()
    }
}


// ================= WIN =================

function winLevel(){
    if(levelFinished) return
    
    levelFinished = true
    gameLocked = true
    if(processTimeout) clearTimeout(processTimeout)
    if(hintTimer) clearTimeout(hintTimer)
    
    animateCoins()
    
    setTimeout(() => {
        if(typeof addCoins === "function") addCoins(levelData.reward)
        updateCoinsUI()
    }, 700)
    
    if(typeof showPopup === "function"){
        showPopup(`
            <h2>Победа!</h2>
            <p>Награда: ${levelData.reward} монет</p>
            <button onclick="nextLevel()">Далее</button>
        `)
    } else {
        alert("Победа! +" + levelData.reward + " монет")
        nextLevel()
    }
}


// ================= LOSE =================

function loseLevel(){
    if(levelFinished) return
    
    levelFinished = true
    gameLocked = true
    if(processTimeout) clearTimeout(processTimeout)
    if(hintTimer) clearTimeout(hintTimer)
    
    if(typeof LivesSystem !== "undefined" && LivesSystem.useLife){
        LivesSystem.useLife()
    }
    
    if(typeof showPopup === "function"){
        showPopup(`
            <h2>Поражение</h2>
            <button onclick="restartLevel()">Заново</button>
        `)
    } else {
        alert("Поражение! Попробуйте ещё раз")
        restartLevel()
    }
}


// ================= LEVEL NAVIGATION =================

function nextLevel(){
    currentLevel++
    if(typeof hidePopup === "function") hidePopup()
    initLevel()
}

function restartLevel(){
    if(typeof LivesSystem !== "undefined" && LivesSystem.useLife){
        if(!LivesSystem.useLife()) return
    }
    if(typeof hidePopup === "function") hidePopup()
    initLevel()
}


// ================= COINS =================

function updateCoinsUI(){
    const el = document.getElementById("coinsDisplay")
    if(el){
        let coins = 0
        if(typeof getCoins === "function") coins = getCoins()
        el.innerText = "💰 " + coins
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
        coin.style.position = "fixed"
        coin.style.left = window.innerWidth / 2 + "px"
        coin.style.top = window.innerHeight / 2 + "px"
        coin.style.fontSize = "30px"
        coin.style.transition = "all 0.7s ease-out"
        coin.style.zIndex = "1000"
        document.body.appendChild(coin)
        
        setTimeout(() => {
            coin.style.transform = `translate(${rect.left - window.innerWidth/2}px, ${rect.top - window.innerHeight/2}px) scale(0.3)`
            coin.style.opacity = "0"
        }, 20)
        
        setTimeout(() => coin.remove(), 800)
    }
}
