const Specials = {
  create(type, x, y, color = null){
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

  // ===== АКТИВАЦИЯ СПЕЦА С ЗАДЕРЖКОЙ (ОСНОВНОЙ МЕТОД) =====
  async activateWithDelay(x, y, color = null){
    // Проверяем что мы не в процессе анимации
    if(isAnimating) return
    
    const cell = board[y]?.[x]
    if(!cell) return
    
    const isSpecial = (cell.type === "special") || (cell.special !== undefined)
    if(!isSpecial) return
    
    let specialType = cell.special || null
    if(!specialType) return
    
    // Показываем эффект активации
    await this.showSpecialEffect(x, y, specialType)
    await this.delay(200)
    
    // Удаляем special плитку
    board[y][x] = null
    renderBoard()
    
    // Активируем эффект
    const map = {
      rocket: this.rocketWithDelay,
      bomb: this.bombWithDelay,
      color: this.colorBombWithDelay
    }
    
    if(map[specialType]){
      await map[specialType].call(this, x, y, color || cell.color)
    }
    
    // После активации делаем gravity
    await this.delay(100)
  },
  
  // ===== ВИЗУАЛЬНЫЙ ЭФФЕКТ АКТИВАЦИИ =====
  async showSpecialEffect(x, y, type){
    if(!cells[y] || !cells[y][x]) return
    
    const el = cells[y][x]
    
    // Очищаем предыдущие классы
    el.classList.remove("specialRocket", "specialBomb", "specialRainbow", "matchFlash")
    
    // Принудительный reflow для перезапуска анимации
    void el.offsetHeight
    
    if(type === "rocket"){
      el.classList.add("specialRocket")
      setTimeout(() => {
        if(cells[y]?.[x]) {
          cells[y][x].classList.remove("specialRocket")
        }
      }, 350)
    } 
    else if(type === "bomb"){
      el.classList.add("specialBomb")
      setTimeout(() => {
        if(cells[y]?.[x]) {
          cells[y][x].classList.remove("specialBomb")
        }
      }, 350)
    } 
    else if(type === "color"){
      el.classList.add("specialRainbow")
      setTimeout(() => {
        if(cells[y]?.[x]) {
          cells[y][x].classList.remove("specialRainbow")
        }
      }, 400)
    }
    
    await this.delay(200)
  },

  // ===== РАКЕТА С ЗАДЕРЖКОЙ =====
  async rocketWithDelay(x, y){
    // Показываем анимацию линий
    for(let i=0; i<SIZE; i++){
      if(cells[y] && cells[y][i]) {
        cells[y][i].classList.add("rocketLine")
        setTimeout(() => {
          if(cells[y] && cells[y][i]) cells[y][i].classList.remove("rocketLine")
        }, 400)
      }
      if(cells[i] && cells[i][x]) {
        cells[i][x].classList.add("rocketLine")
        setTimeout(() => {
          if(cells[i] && cells[i][x]) cells[i][x].classList.remove("rocketLine")
        }, 400)
      }
    }
    
    await this.delay(350)
    
    // Уничтожаем ряд и колонку
    for(let i=0; i<SIZE; i++){
      if(board[y] && board[y][i] !== undefined) {
        // Если там другая special - не трогаем
        const cell = board[y][i]
        if(typeof cell === "object" && cell !== null && cell.special) continue
        board[y][i] = null
      }
      if(board[i] && board[i][x] !== undefined) {
        const cell = board[i][x]
        if(typeof cell === "object" && cell !== null && cell.special) continue
        board[i][x] = null
      }
    }
    
    renderBoard()
    await this.delay(150)
  },

  // ===== БОМБА С ЗАДЕРЖКОЙ =====
  async bombWithDelay(x, y){
    // Анимация взрыва
    for(let yy=y-1; yy<=y+1; yy++){
      for(let xx=x-1; xx<=x+1; xx++){
        if(xx>=0 && yy>=0 && xx<SIZE && yy<SIZE && cells[yy] && cells[yy][xx]){
          cells[yy][xx].classList.add("bombBlast")
          setTimeout(() => {
            if(cells[yy] && cells[yy][xx]) cells[yy][xx].classList.remove("bombBlast")
          }, 400)
        }
      }
    }
    
    await this.delay(200)
    
    // Уничтожаем область 3x3
    for(let yy=y-1; yy<=y+1; yy++){
      for(let xx=x-1; xx<=x+1; xx++){
        if(xx>=0 && yy>=0 && xx<SIZE && yy<SIZE){
          if(board[yy] && board[yy][xx] !== undefined) {
            const cell = board[yy][xx]
            if(typeof cell === "object" && cell !== null && cell.special) continue
            board[yy][xx] = null
          }
        }
      }
    }
    
    renderBoard()
    await this.delay(150)
  },

  // ===== ЦВЕТНАЯ БОМБА (РАДУГА) С ЗАДЕРЖКОЙ =====
  async colorBombWithDelay(x, y, color = null){
    let targetColor = color
    
    // Если цвет не указан, берём первый попавшийся цвет на доске
    if(!targetColor){
      for(let yy=0; yy<SIZE; yy++){
        for(let xx=0; xx<SIZE; xx++){
          const cell = board[yy]?.[xx]
          if(typeof cell === "string"){
            targetColor = cell
            break
          }
          if(typeof cell === "object" && cell !== null && cell.color){
            targetColor = cell.color
            break
          }
        }
        if(targetColor) break
      }
    }
    
    if(!targetColor) return
    
    // Анимация для всех плиток целевого цвета
    for(let yy=0; yy<SIZE; yy++){
      for(let xx=0; xx<SIZE; xx++){
        const cell = board[yy]?.[xx]
        let cellColor = null
        
        if(typeof cell === "string") cellColor = cell
        else if(typeof cell === "object" && cell !== null) cellColor = cell.color
        
        if(cellColor === targetColor && cells[yy] && cells[yy][xx]){
          cells[yy][xx].classList.add("rainbowFlash")
          setTimeout(() => {
            if(cells[yy] && cells[yy][xx]) cells[yy][xx].classList.remove("rainbowFlash")
          }, 400)
        }
      }
    }
    
    await this.delay(300)
    
    // Уничтожаем все плитки целевого цвета
    for(let yy=0; yy<SIZE; yy++){
      for(let xx=0; xx<SIZE; xx++){
        const cell = board[yy]?.[xx]
        
        if(typeof cell === "string" && cell === targetColor){
          board[yy][xx] = null
        }
        else if(typeof cell === "object" && cell !== null && cell.color === targetColor){
          // Не уничтожаем другие special плитки
          if(!cell.special) {
            board[yy][xx] = null
          }
        }
      }
    }
    
    renderBoard()
    await this.delay(150)
  },

  // ===== СИНХРОННЫЕ МЕТОДЫ (для обратной совместимости, с защитой) =====
  activate(x, y, color = null){
    // Проверка чтобы избежать двойной активации
    if(isAnimating) return
    
    const cell = board[y]?.[x]
    if(!cell) return
    
    const isSpecial = (cell.type === "special") || (cell.special !== undefined)
    if(!isSpecial) return
    
    let specialType = cell.special || null
    if(!specialType) return
    
    // Удаляем special плитку
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
  },

  rocket(x, y){
    for(let i=0; i<SIZE; i++){
      if(board[y] && board[y][i] !== undefined) board[y][i] = null
      if(board[i] && board[i][x] !== undefined) board[i][x] = null
    }
  },

  bomb(x, y){
    for(let yy=y-1; yy<=y+1; yy++){
      for(let xx=x-1; xx<=x+1; xx++){
        if(xx>=0 && yy>=0 && xx<SIZE && yy<SIZE){
          if(board[yy] && board[yy][xx] !== undefined) board[yy][xx] = null
        }
      }
    }
  },

  colorBomb(x, y, color = null){
    let targetColor = color
    
    if(!targetColor){
      for(let yy=0; yy<SIZE; yy++){
        for(let xx=0; xx<SIZE; xx++){
          const cell = board[yy]?.[xx]
          if(typeof cell === "string"){
            targetColor = cell
            break
          }
          if(typeof cell === "object" && cell !== null && cell.color){
            targetColor = cell.color
            break
          }
        }
        if(targetColor) break
      }
    }
    
    if(!targetColor) return
    
    for(let yy=0; yy<SIZE; yy++){
      for(let xx=0; xx<SIZE; xx++){
        const cell = board[yy]?.[xx]
        
        if(typeof cell === "string" && cell === targetColor){
          board[yy][xx] = null
        }
        else if(typeof cell === "object" && cell !== null && cell.color === targetColor){
          board[yy][xx] = null
        }
      }
    }
  }
           }
