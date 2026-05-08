const Specials = {
  // НОВО: флаг для предотвращения множественных вызовов
  _isProcessing: false,
  _lastCallTime: 0,
  _debounceDelay: 300,

  create(type, x, y, color = null){
    if(this._isProcessing) return
    board[y][x] = {
      color: color || randomColor(),
      special: type,
      type: "special"
    }
    renderBoard()
  },

  delay(ms){
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  // НОВО: проверка блокировки игры
  _isGameBlocked(){
    return gameLocked || levelFinished || isProcessingMove
  },

  // ===== АКТИВАЦИЯ СПЕЦА С ЗАДЕРЖКОЙ (С ЗАЩИТОЙ) =====
  async activateWithDelay(x, y, color = null){
    // НОВО: защита от множественных вызовов
    const now = Date.now()
    if(this._isProcessing) return
    if(now - this._lastCallTime < this._debounceDelay) return
    if(this._isGameBlocked()) return
    
    const cell = board[y]?.[x]
    if(!cell) return
    
    const isSpecial = (cell.type === "special") || (cell.special !== undefined)
    if(!isSpecial) return
    
    let specialType = cell.special || null
    if(!specialType && cell.type === "special") specialType = cell.special
    if(!specialType) return
    
    this._isProcessing = true
    this._lastCallTime = now
    
    try {
      // НОВО: временная блокировка игры
      const wasGameLocked = gameLocked
      gameLocked = true
      
      await this.showSpecialEffect(x, y, specialType)
      await this.delay(350)
      
      board[y][x] = null
      renderBoard()
      
      const map = {
        rocket: this.rocketWithDelay,
        bomb: this.bombWithDelay,
        color: this.colorBombWithDelay
      }
      
      if(map[specialType]){
        await map[specialType].call(this, x, y, color || cell.color)
      }
      
      // НОВО: восстанавливаем состояние игры
      if(!wasGameLocked){
        gameLocked = false
      }
    } catch(e) {
      console.error("Special activation error:", e)
    } finally {
      this._isProcessing = false
    }
  },
  
  async showSpecialEffect(x, y, type){
    if(!cells[y] || !cells[y][x]) return
    
    const el = cells[y][x]
    
    el.classList.remove("specialRocket", "specialBomb", "specialRainbow", "matchFlash")
    void el.offsetHeight
    
    if(type === "rocket"){
      el.classList.add("specialRocket")
      for(let i=0; i<3; i++){
        setTimeout(() => {
          if(cells[y]?.[x]) {
            cells[y][x].style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`
          }
        }, i * 50)
      }
      setTimeout(() => {
        if(cells[y] && cells[y][x]) {
          cells[y][x].style.transform = ""
          cells[y][x].classList.remove("specialRocket")
        }
      }, 350)
    } 
    else if(type === "bomb"){
      el.classList.add("specialBomb")
      el.style.animation = "bombCharge 0.3s ease-out 3"
      setTimeout(() => {
        if(cells[y] && cells[y][x]) {
          cells[y][x].style.animation = ""
          cells[y][x].classList.remove("specialBomb")
        }
      }, 350)
    } 
    else if(type === "color"){
      el.classList.add("specialRainbow")
      el.style.animation = "rainbowCharge 0.4s ease-out 2"
      setTimeout(() => {
        if(cells[y] && cells[y][x]) {
          cells[y][x].style.animation = ""
          cells[y][x].classList.remove("specialRainbow")
        }
      }, 400)
    }
    
    await this.delay(200)
  },

  // ===== РАКЕТА С ЗАДЕРЖКОЙ (ИСПРАВЛЕНА) =====
  async rocketWithDelay(x, y){
    // НОВО: проверка валидности координат
    if(x === undefined || y === undefined) return
    if(y < 0 || y >= SIZE || x < 0 || x >= SIZE) return
    
    for(let i=0; i<SIZE; i++){
      if(cells[y] && cells[y][i]) {
        cells[y][i].classList.remove("rocketLine", "matchFlash")
      }
      if(cells[i] && cells[i][x]) {
        cells[i][x].classList.remove("rocketLine", "matchFlash")
      }
    }
    
    void document.body.offsetHeight
    
    for(let i=0; i<SIZE; i++){
      if(cells[y] && cells[y][i]){
        cells[y][i].classList.add("rocketLine")
        setTimeout(() => {
          if(cells[y] && cells[y][i]) cells[y][i].classList.remove("rocketLine")
        }, 400)
      }
      if(cells[i] && cells[i][x]){
        cells[i][x].classList.add("rocketLine")
        setTimeout(() => {
          if(cells[i] && cells[i][x]) cells[i][x].classList.remove("rocketLine")
        }, 400)
      }
    }
    
    await this.delay(350)
    
    // НОВО: безопасное удаление с проверкой границ
    for(let i=0; i<SIZE; i++){
      if(board[y] && board[y][i] !== undefined){
        // НОВО: увеличиваем счет за уничтоженные ячейки
        if(score !== undefined && typeof board[y][i] !== "object"){
          score += 10
        }
        board[y][i] = null
      }
      if(board[i] && board[i][x] !== undefined){
        if(score !== undefined && typeof board[i][x] !== "object"){
          score += 10
        }
        board[i][x] = null
      }
    }
    
    renderBoard()
    await this.delay(150)
  },

  // ===== БОМБА С ЗАДЕРЖКОЙ (ИСПРАВЛЕНА) =====
  async bombWithDelay(x, y){
    if(x === undefined || y === undefined) return
    if(y < 0 || y >= SIZE || x < 0 || x >= SIZE) return
    
    // НОВО: радиус взрыва (можно настраивать)
    const radius = 2
    
    for(let yy=Math.max(0, y-radius); yy<=Math.min(SIZE-1, y+radius); yy++){
      for(let xx=Math.max(0, x-radius); xx<=Math.min(SIZE-1, x+radius); xx++){
        if(cells[yy] && cells[yy][xx]){
          cells[yy][xx].classList.remove("bombBlast", "matchFlash", "bombShockwave")
        }
      }
    }
    
    void document.body.offsetHeight
    
    const centerEl = cells[y]?.[x]
    if(centerEl) {
      centerEl.classList.add("bombCore")
      setTimeout(() => {
        if(cells[y]?.[x]) cells[y][x].classList.remove("bombCore")
      }, 200)
    }
    
    // Эффект взрыва
    for(let yy=Math.max(0, y-1); yy<=Math.min(SIZE-1, y+1); yy++){
      for(let xx=Math.max(0, x-1); xx<=Math.min(SIZE-1, x+1); xx++){
        if(cells[yy] && cells[yy][xx]){
          cells[yy][xx].classList.add("bombBlast")
          setTimeout(() => {
            if(cells[yy] && cells[yy][xx]) cells[yy][xx].classList.remove("bombBlast")
          }, 400)
        }
      }
    }
    
    await this.delay(150)
    
    // Эффект ударной волны
    for(let yy=Math.max(0, y-2); yy<=Math.min(SIZE-1, y+2); yy++){
      for(let xx=Math.max(0, x-2); xx<=Math.min(SIZE-1, x+2); xx++){
        if(Math.abs(xx-x) > 1 || Math.abs(yy-y) > 1){
          if(cells[yy] && cells[yy][xx]){
            cells[yy][xx].classList.add("bombShockwave")
            setTimeout(() => {
              if(cells[yy] && cells[yy][xx]) cells[yy][xx].classList.remove("bombShockwave")
            }, 300)
          }
        }
      }
    }
    
    await this.delay(200)
    
    // Уничтожение ячеек
    for(let yy=Math.max(0, y-1); yy<=Math.min(SIZE-1, y+1); yy++){
      for(let xx=Math.max(0, x-1); xx<=Math.min(SIZE-1, x+1); xx++){
        if(board[yy] && board[yy][xx] !== undefined){
          // НОВО: увеличиваем счет
          if(score !== undefined && typeof board[yy][xx] !== "object"){
            score += 15
          }
          board[yy][xx] = null
        }
      }
    }
    
    renderBoard()
    if(typeof updateHUD === 'function') updateHUD()
    await this.delay(150)
  },

  // ===== ЦВЕТНАЯ БОМБА (РАДУГА) С ЗАДЕРЖКОЙ (ИСПРАВЛЕНА) =====
  async colorBombWithDelay(x, y, color = null){
    if(x === undefined || y === undefined) return
    
    let targetColor = color
    
    if(!targetColor){
      for(let yy=0; yy<SIZE; yy++){
        let found = false
        for(let xx=0; xx<SIZE; xx++){
          const cell = board[yy]?.[xx]
          if(cell === null) continue
          if(typeof cell === "string"){
            targetColor = cell
            found = true
            break
          }
          if(typeof cell === "object" && cell !== null && cell.color){
            targetColor = cell.color
            found = true
            break
          }
        }
        if(found) break
      }
    }
    
    if(!targetColor) return
    
    // НОВО: собираем информацию о целевых ячейках до анимации
    const targetCells = []
    for(let yy=0; yy<SIZE; yy++){
      for(let xx=0; xx<SIZE; xx++){
        const cell = board[yy]?.[xx]
        if(cell === null) continue
        
        let cellColor = null
        if(typeof cell === "string") cellColor = cell
        else if(typeof cell === "object" && cell !== null) cellColor = cell.color
        
        if(cellColor === targetColor && cells[yy] && cells[yy][xx]){
          targetCells.push({x: xx, y: yy})
        }
      }
    }
    
    if(targetCells.length === 0) return
    
    for(let yy=0; yy<SIZE; yy++){
      for(let xx=0; xx<SIZE; xx++){
        if(cells[yy] && cells[yy][xx]) {
          cells[yy][xx].classList.remove("rainbowFlash", "matchFlash", "rainbowPulse")
        }
      }
    }
    
    void document.body.offsetHeight
    
    const centerEl = cells[y]?.[x]
    if(centerEl) {
      centerEl.classList.add("rainbowCore")
      setTimeout(() => {
        if(cells[y]?.[x]) cells[y][x].classList.remove("rainbowCore")
      }, 300)
    }
    
    // Анимация для каждой целевой ячейки
    for(let i=0; i<targetCells.length; i++){
      const {x: xx, y: yy} = targetCells[i]
      setTimeout(() => {
        if(cells[yy] && cells[yy][xx]) {
          cells[yy][xx].classList.add("rainbowFlash")
          setTimeout(() => {
            if(cells[yy] && cells[yy][xx]) cells[yy][xx].classList.remove("rainbowFlash")
          }, 400)
        }
      }, i * 15)
    }
    
    // Пульсация по всему полю
    for(let yy=0; yy<SIZE; yy++){
      for(let xx=0; xx<SIZE; xx++){
        if(cells[yy] && cells[yy][xx]) {
          cells[yy][xx].classList.add("rainbowPulse")
          setTimeout(() => {
            if(cells[yy] && cells[yy][xx]) cells[yy][xx].classList.remove("rainbowPulse")
          }, 500)
        }
      }
    }
    
    await this.delay(450)
    
    // Уничтожение целевых ячеек
    let destroyedCount = 0
    for(let yy=0; yy<SIZE; yy++){
      for(let xx=0; xx<SIZE; xx++){
        const cell = board[yy]?.[xx]
        if(cell === null) continue
        
        let cellColor = null
        if(typeof cell === "string") cellColor = cell
        else if(typeof cell === "object" && cell !== null) cellColor = cell.color
        
        if(cellColor === targetColor){
          // НОВО: увеличиваем счет
          if(score !== undefined && typeof board[yy][xx] !== "object"){
            score += 20
          }
          board[yy][xx] = null
          destroyedCount++
        }
      }
    }
    
    renderBoard()
    if(typeof updateHUD === 'function') updateHUD()
    await this.delay(150)
    
    return destroyedCount
  },

  // ===== ОРИГИНАЛЬНЫЕ МЕТОДЫ (для обратной совместимости) =====
  // НОВО: добавлена защита от вызова во время обработки
  activate(x, y, color = null){
    if(this._isProcessing) return
    if(this._isGameBlocked()) return
    
    const cell = board[y]?.[x]
    if(!cell) return
    
    const isSpecial = (cell.type === "special") || (cell.special !== undefined)
    if(!isSpecial) return
    
    let specialType = cell.special || null
    if(!specialType && cell.type === "special") specialType = cell.special
    if(!specialType) return
    
    board[y][x] = null
    
    const map = {
      rocket: this.rocket,
      bomb: this.bomb,
      color: this.colorBomb
    }
    
    if(map[specialType]){
      map[specialType].call(this, x, y, color || cell.color)
    }
    renderBoard()
    if(typeof updateHUD === 'function') updateHUD()
  },

  rocket(x, y){
    if(x === undefined || y === undefined) return
    for(let i=0; i<SIZE; i++){
      if(board[y] && board[y][i] !== undefined){
        if(score !== undefined && typeof board[y][i] !== "object"){
          score += 10
        }
        board[y][i] = null
      }
      if(board[i] && board[i][x] !== undefined){
        if(score !== undefined && typeof board[i][x] !== "object"){
          score += 10
        }
        board[i][x] = null
      }
    }
  },

  bomb(x, y){
    if(x === undefined || y === undefined) return
    for(let yy=Math.max(0, y-1); yy<=Math.min(SIZE-1, y+1); yy++){
      for(let xx=Math.max(0, x-1); xx<=Math.min(SIZE-1, x+1); xx++){
        if(board[yy] && board[yy][xx] !== undefined){
          if(score !== undefined && typeof board[yy][xx] !== "object"){
            score += 15
          }
          board[yy][xx] = null
        }
      }
    }
  },

  colorBomb(x, y, color = null){
    let targetColor = color
    
    if(!targetColor){
      for(let yy=0; yy<SIZE; yy++){
        let found = false
        for(let xx=0; xx<SIZE; xx++){
          const cell = board[yy]?.[xx]
          if(cell === null) continue
          if(typeof cell === "string"){
            targetColor = cell
            found = true
            break
          }
          if(typeof cell === "object" && cell !== null && cell.color){
            targetColor = cell.color
            found = true
            break
          }
        }
        if(found) break
      }
    }
    
    if(!targetColor) return
    
    let destroyedCount = 0
    for(let yy=0; yy<SIZE; yy++){
      for(let xx=0; xx<SIZE; xx++){
        const cell = board[yy]?.[xx]
        if(cell === null) continue
        
        let cellColor = null
        if(typeof cell === "string") cellColor = cell
        else if(typeof cell === "object" && cell !== null) cellColor = cell.color
        
        if(cellColor === targetColor){
          if(score !== undefined && typeof board[yy][xx] !== "object"){
            score += 20
          }
          board[yy][xx] = null
          destroyedCount++
        }
      }
    }
    return destroyedCount
  }
    }
