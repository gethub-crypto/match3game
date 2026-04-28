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

  // ===== АКТИВАЦИЯ СПЕЦА С ЗАДЕРЖКОЙ =====
  async activateWithDelay(x, y, color = null){
    const cell = board[y][x]
    
    if(!cell) return
    
    const isSpecial = (cell.type === "special") || (cell.special !== undefined)
    if(!isSpecial) return
    
    let specialType = cell.special || null
    if(!specialType && cell.type === "special") specialType = cell.special
    
    if(!specialType) return
    
    // Визуальный эффект перед удалением
    await this.showSpecialEffect(x, y, specialType)
    
    // Пауза 400мс
    await this.delay(400)
    
    // Удаляем спец-шар
    board[y][x] = null
    
    const map = {
      rocket: this.rocketWithDelay,
      bomb: this.bombWithDelay,
      color: this.colorBombWithDelay
    }
    
    if(map[specialType]){
      await map[specialType].call(this, x, y, color || cell.color)
    }
  },
  
  // Визуальный эффект перед активацией
  async showSpecialEffect(x, y, type){
    if(!cells[y] || !cells[y][x]) return
    
    const el = cells[y][x]
    
    if(type === "rocket"){
      el.classList.add("specialRocket")
      setTimeout(() => {
        if(cells[y] && cells[y][x]) cells[y][x].classList.remove("specialRocket")
      }, 300)
    } else if(type === "bomb"){
      el.classList.add("specialBomb")
      setTimeout(() => {
        if(cells[y] && cells[y][x]) cells[y][x].classList.remove("specialBomb")
      }, 300)
    } else if(type === "color"){
      el.classList.add("specialRainbow")
      setTimeout(() => {
        if(cells[y] && cells[y][x]) cells[y][x].classList.remove("specialRainbow")
      }, 300)
    }
    
    await this.delay(150)
  },

  // ===== РАКЕТА С ЗАДЕРЖКОЙ =====
  async rocketWithDelay(x, y){
    // Анимация линии
    for(let i=0; i<SIZE; i++){
      if(cells[y] && cells[y][i]){
        cells[y][i].classList.add("rocketLine")
        setTimeout(() => {
          if(cells[y] && cells[y][i]) cells[y][i].classList.remove("rocketLine")
        }, 350)
      }
      if(cells[i] && cells[i][x]){
        cells[i][x].classList.add("rocketLine")
        setTimeout(() => {
          if(cells[i] && cells[i][x]) cells[i][x].classList.remove("rocketLine")
        }, 350)
      }
    }
    
    await this.delay(300)
    
    // Очистка ряда и колонки
    for(let i=0; i<SIZE; i++){
      if(board[y] && board[y][i]) board[y][i] = null
      if(board[i] && board[i][x]) board[i][x] = null
    }
    
    renderBoard()
    await this.delay(150)
  },

  // ===== БОМБА С ЗАДЕРЖКОЙ =====
  async bombWithDelay(x, y){
    // Анимация взрыва 3x3
    for(let yy=y-1; yy<=y+1; yy++){
      for(let xx=x-1; xx<=x+1; xx++){
        if(xx>=0 && yy>=0 && xx<SIZE && yy<SIZE && cells[yy] && cells[yy][xx]){
          cells[yy][xx].classList.add("bombBlast")
          setTimeout(() => {
            if(cells[yy] && cells[yy][xx]) cells[yy][xx].classList.remove("bombBlast")
          }, 350)
        }
      }
    }
    
    await this.delay(300)
    
    // Удаление 3x3
    for(let yy=y-1; yy<=y+1; yy++){
      for(let xx=x-1; xx<=x+1; xx++){
        if(xx>=0 && yy>=0 && xx<SIZE && yy<SIZE){
          if(board[yy] && board[yy][xx] !== undefined) board[yy][xx] = null
        }
      }
    }
    
    renderBoard()
    await this.delay(150)
  },

  // ===== ЦВЕТНАЯ БОМБА С ЗАДЕРЖКОЙ =====
  async colorBombWithDelay(x, y, color = null){
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
    
    // Радужная вспышка
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
    
    await this.delay(350)
    
    // Удаление всех шариков выбранного цвета
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
    
    renderBoard()
    await this.delay(150)
  },

  // ===== ОРИГИНАЛЬНЫЕ МЕТОДЫ (для обратной совместимости) =====
  activate(x, y, color = null){
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
  },

  rocket(x, y){
    for(let i=0; i<SIZE; i++){
      if(board[y] && board[y][i]) board[y][i] = null
      if(board[i] && board[i][x]) board[i][x] = null
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
