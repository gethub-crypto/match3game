const Specials = {
  create(type, x, y, color = null){
    if(board[y]?.[x] !== null){
      console.warn(`Cell ${x},${y} is not empty, cannot create special`)
      return false
    }
    
    board[y][x] = {
      color: color || randomColor(),
      special: type,
      type: "special"
    }
    renderBoard()
    return true
  },

  delay(ms){
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  async activateWithDelay(x, y, color = null, direction = null){
    const cell = board[y]?.[x]
    if(!cell) return
    
    const isSpecial = (cell.type === "special") || (cell.special !== undefined)
    if(!isSpecial) return
    
    let specialType = cell.special || null
    if(!specialType && cell.type === "special") specialType = cell.special
    if(!specialType) return
    
    const cellColor = cell.color || null
    
    if(specialType === "color" && !color && !cellColor){
      let targetColor = null
      for(let yy=0; yy<SIZE; yy++){
        for(let xx=0; xx<SIZE; xx++){
          const c = board[yy]?.[xx]
          if(typeof c === "string"){ targetColor = c; break }
          if(typeof c === "object" && c !== null && c.color){
            targetColor = c.color; break
          }
        }
        if(targetColor) break
      }
      if(!targetColor){
        console.warn("Color bomb: no target color found, aborting")
        return
      }
    }
    
    await this.showSpecialEffect(x, y, specialType)
    await this.delay(400)
    
    board[y][x] = null
    
    const map = {
      rocket: this.rocketWithDelay,
      bomb: this.bombWithDelay,
      color: this.colorBombWithDelay
    }
    
    if(map[specialType]){
      await map[specialType].call(this, x, y, color || cellColor, direction)
    }
  },
  
  async showSpecialEffect(x, y, type){
    if(!cells[y] || !cells[y][x]) return
    const el = cells[y][x]
    if(!document.contains(el)) return
    
    el.classList.remove("specialRocket", "specialBomb", "specialRainbow", "matchFlash")
    void el.offsetHeight
    
    if(type === "rocket"){
      el.classList.add("specialRocket")
      for(let i=0; i<3; i++){
        setTimeout(() => {
          const currentEl = cells[y]?.[x]
          if(currentEl && document.contains(currentEl)){
            currentEl.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`
          }
        }, i * 50)
      }
      setTimeout(() => {
        const currentEl = cells[y]?.[x]
        if(currentEl && document.contains(currentEl)){
          currentEl.style.transform = ""
          currentEl.classList.remove("specialRocket")
        }
      }, 350)
    } 
    else if(type === "bomb"){
      el.classList.add("specialBomb")
      el.style.animation = "bombCharge 0.3s ease-out 3"
      setTimeout(() => {
        const currentEl = cells[y]?.[x]
        if(currentEl && document.contains(currentEl)){
          currentEl.style.animation = ""
          currentEl.classList.remove("specialBomb")
        }
      }, 350)
    } 
    else if(type === "color"){
      el.classList.add("specialRainbow")
      el.style.animation = "rainbowCharge 0.4s ease-out 2"
      setTimeout(() => {
        const currentEl = cells[y]?.[x]
        if(currentEl && document.contains(currentEl)){
          currentEl.style.animation = ""
          currentEl.classList.remove("specialRainbow")
        }
      }, 400)
    }
    
    await this.delay(200)
  },

  async rocketWithDelay(x, y, color = null, direction = null){
    const toClear = new Set()
    const isHorizontal = direction !== 'vertical'
    
    if(isHorizontal){
      for(let i=0; i<SIZE; i++){
        toClear.add(`${i},${y}`)
      }
    } else {
      for(let i=0; i<SIZE; i++){
        toClear.add(`${x},${i}`)
      }
    }
    
    for(let i=0; i<SIZE; i++){
      if(isHorizontal && cells[y] && cells[y][i]){
        cells[y][i].classList.remove("rocketLine", "matchFlash")
      } else if(!isHorizontal && cells[i] && cells[i][x]){
        cells[i][x].classList.remove("rocketLine", "matchFlash")
      }
    }
    
    void document.body.offsetHeight
    
    for(let i=0; i<SIZE; i++){
      if(isHorizontal && cells[y] && cells[y][i]){
        cells[y][i].classList.add("rocketLine")
        setTimeout(() => {
          if(cells[y] && cells[y][i]) cells[y][i].classList.remove("rocketLine")
        }, 400)
      } else if(!isHorizontal && cells[i] && cells[i][x]){
        cells[i][x].classList.add("rocketLine")
        setTimeout(() => {
          if(cells[i] && cells[i][x]) cells[i][x].classList.remove("rocketLine")
        }, 400)
      }
    }
    
    await this.delay(350)
    
    toClear.forEach(key => {
      const [cx, cy] = key.split(',').map(Number)
      if(board[cy] && board[cy][cx] !== undefined) board[cy][cx] = null
    })
    
    renderBoard()
    await this.delay(150)
  },

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
    
    await this.delay(350)
    
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

  activate(x, y, color = null, direction = null){
    const cell = board[y]?.[x]
    if(!cell) return
    
    const isSpecial = (cell.type === "special") || (cell.special !== undefined)
    if(!isSpecial) return
    
    let specialType = cell.special || null
    if(!specialType && cell.type === "special") specialType = cell.special
    if(!specialType) return
    
    const cellColor = cell.color || null
    board[y][x] = null
    
    const map = {
      rocket: this.rocket,
      bomb: this.bomb,
      color: this.colorBomb
    }
    
    if(map[specialType]){
      map[specialType].call(this, x, y, color || cellColor, direction)
    }
  },

  rocket(x, y, color = null, direction = null){
    const toClear = new Set()
    const isHorizontal = direction !== 'vertical'
    
    if(isHorizontal){
      for(let i=0; i<SIZE; i++) toClear.add(`${i},${y}`)
    } else {
      for(let i=0; i<SIZE; i++) toClear.add(`${x},${i}`)
    }
    
    toClear.forEach(key => {
      const [cx, cy] = key.split(',').map(Number)
      if(board[cy] && board[cy][cx] !== undefined) board[cy][cx] = null
    })
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
