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

  // ===== СБОР ФИШКИ (вызывается перед удалением) =====
  collectCell(x, y) {
    const cell = board[y]?.[x]
    if (!cell) return
    
    let cellColor = null
    
    if (typeof cell === "string") {
      cellColor = cell
    } else if (typeof cell === "object" && cell !== null && cell.color) {
      cellColor = cell.color
    }
    
    if (cellColor && levelData.colors && levelData.colors.includes(cellColor)) {
      const comboBonus = ComboManager.isActive() ? ComboManager.combo : 0
      const total = 1 + comboBonus
      
      collectProgress[cellColor] = (collectProgress[cellColor] || 0) + total
      updateCollectTracker(cellColor)
      
      if (comboBonus > 0) {
        console.log(`🔥 Combo x${comboBonus + 1}! +${total} ${cellColor} chips (special)`)
      }
    }
  },

  // ===== АКТИВАЦИЯ СПЕЦА С ЗАДЕРЖКОЙ =====
  async activateWithDelay(x, y, color = null, direction = null){
    const cell = board[y]?.[x]
    
    if(!cell) return
    
    const isSpecial = (cell.type === "special") || (cell.special !== undefined)
    if(!isSpecial) return
    
    let specialType = cell.special || null
    if(!specialType && cell.type === "special") specialType = cell.special
    
    if(!specialType) return
    
    await this.showSpecialEffect(x, y, specialType)
    await this.delay(400)
    
    // Собираем саму спец-фишку если она нужного цвета
    this.collectCell(x, y)
    board[y][x] = null
    
    const map = {
      rocket: this.rocketWithDelay,
      bomb: this.bombWithDelay,
      color: this.colorBombWithDelay
    }
    
    if(map[specialType]){
      await map[specialType].call(this, x, y, color || cell.color, direction)
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

  // ===== РАКЕТА С ЗАДЕРЖКОЙ =====
  async rocketWithDelay(x, y, color = null, direction = null){
    // Если направление не указано (две ракеты) — бьём крестом
    const horizontal = !direction || direction === 'horizontal'
    const vertical = !direction || direction === 'vertical'
    
    // Убираем старые подсветки
    if(horizontal){
      for(let i=0; i<SIZE; i++){
        if(cells[y] && cells[y][i]) {
          cells[y][i].classList.remove("rocketLine", "matchFlash")
        }
      }
    }
    if(vertical){
      for(let i=0; i<SIZE; i++){
        if(cells[i] && cells[i][x]) {
          cells[i][x].classList.remove("rocketLine", "matchFlash")
        }
      }
    }
    
    void document.body.offsetHeight
    
    // Подсветка
    if(horizontal){
      for(let i=0; i<SIZE; i++){
        if(cells[y] && cells[y][i]){
          cells[y][i].classList.add("rocketLine")
          setTimeout(() => {
            if(cells[y] && cells[y][i]) cells[y][i].classList.remove("rocketLine")
          }, 400)
        }
      }
    }
    if(vertical){
      for(let i=0; i<SIZE; i++){
        if(cells[i] && cells[i][x]){
          cells[i][x].classList.add("rocketLine")
          setTimeout(() => {
            if(cells[i] && cells[i][x]) cells[i][x].classList.remove("rocketLine")
          }, 400)
        }
      }
    }
    
    await this.delay(350)
    
    // Собираем фишки перед удалением
    if(horizontal){
      for(let i=0; i<SIZE; i++){
        if(board[y] && board[y][i]) this.collectCell(i, y)
      }
    }
    if(vertical){
      for(let i=0; i<SIZE; i++){
        if(board[i] && board[i][x]) this.collectCell(x, i)
      }
    }
    
    // Удаляем
    if(horizontal){
      for(let i=0; i<SIZE; i++){
        if(board[y] && board[y][i]) board[y][i] = null
      }
    }
    if(vertical){
      for(let i=0; i<SIZE; i++){
        if(board[i] && board[i][x]) board[i][x] = null
      }
    }
    
    renderBoard()
    await this.delay(150)
  },

  // ===== БОМБА С ЗАДЕРЖКОЙ =====
  async bombWithDelay(x, y){
    for(let yy=y-1; yy<=y+1; yy++){
      for(let xx=x-1; xx<=x+1; xx++){
        if(xx>=0 && yy>=0 && xx<SIZE && yy<SIZE && cells[yy] && cells[yy][xx]){
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
    
    await this.delay(150)
    
    for(let yy=y-2; yy<=y+2; yy++){
      for(let xx=x-2; xx<=x+2; xx++){
        if(xx>=0 && yy>=0 && xx<SIZE && yy<SIZE && cells[yy] && cells[yy][xx]){
          if(Math.abs(xx-x) > 1 || Math.abs(yy-y) > 1){
            cells[yy][xx].classList.add("bombShockwave")
            setTimeout(() => {
              if(cells[yy] && cells[yy][xx]) cells[yy][xx].classList.remove("bombShockwave")
            }, 300)
          }
        }
      }
    }
    
    await this.delay(200)
    
    // Собираем фишки перед удалением
    for(let yy=y-1; yy<=y+1; yy++){
      for(let xx=x-1; xx<=x+1; xx++){
        if(xx>=0 && yy>=0 && xx<SIZE && yy<SIZE){
          this.collectCell(xx, yy)
        }
      }
    }
    
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

  // ===== ЦВЕТНАЯ БОМБА (РАДУГА) С ЗАДЕРЖКОЙ =====
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
    
    const targetCells = []
    for(let yy=0; yy<SIZE; yy++){
      for(let xx=0; xx<SIZE; xx++){
        const cell = board[yy]?.[xx]
        let cellColor = null
        
        if(typeof cell === "string") cellColor = cell
        else if(typeof cell === "object" && cell !== null) cellColor = cell.color
        
        if(cellColor === targetColor && cells[yy] && cells[yy][xx]){
          targetCells.push({x: xx, y: yy})
        }
      }
    }
    
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
    
    await this.delay(400)
    
    // Собираем фишки перед удалением
    for(let yy=0; yy<SIZE; yy++){
      for(let xx=0; xx<SIZE; xx++){
        const cell = board[yy]?.[xx]
        
        if(typeof cell === "string" && cell === targetColor){
          this.collectCell(xx, yy)
        }
        else if(typeof cell === "object" && cell !== null && cell.color === targetColor){
          this.collectCell(xx, yy)
        }
      }
    }
    
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
  activate(x, y, color = null, direction = null){
    const cell = board[y]?.[x]
    if(!cell) return
    
    const isSpecial = (cell.type === "special") || (cell.special !== undefined)
    if(!isSpecial) return
    
    let specialType = cell.special || null
    if(!specialType && cell.type === "special") specialType = cell.special
    if(!specialType) return
    
    this.collectCell(x, y)
    board[y][x] = null
    
    const map = {
      rocket: this.rocket,
      bomb: this.bomb,
      color: this.colorBomb
    }
    
    if(map[specialType]){
      map[specialType].call(this, x, y, color || cell.color, direction)
    }
  },

  rocket(x, y, color = null, direction = null){
    const horizontal = !direction || direction === 'horizontal'
    const vertical = !direction || direction === 'vertical'
    
    if(horizontal){
      for(let i=0; i<SIZE; i++){
        if(board[y] && board[y][i]) this.collectCell(i, y)
      }
    }
    if(vertical){
      for(let i=0; i<SIZE; i++){
        if(board[i] && board[i][x]) this.collectCell(x, i)
      }
    }
    
    if(horizontal){
      for(let i=0; i<SIZE; i++){
        if(board[y] && board[y][i]) board[y][i] = null
      }
    }
    if(vertical){
      for(let i=0; i<SIZE; i++){
        if(board[i] && board[i][x]) board[i][x] = null
      }
    }
  },

  bomb(x, y){
    for(let yy=y-1; yy<=y+1; yy++){
      for(let xx=x-1; xx<=x+1; xx++){
        if(xx>=0 && yy>=0 && xx<SIZE && yy<SIZE){
          this.collectCell(xx, yy)
        }
      }
    }
    
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
          this.collectCell(xx, yy)
        }
        else if(typeof cell === "object" && cell !== null && cell.color === targetColor){
          this.collectCell(xx, yy)
        }
      }
    }
    
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
