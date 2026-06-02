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

  // ===== СБОР ФИШКИ =====
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

  // ===== БЕЗОПАСНОЕ УДАЛЕНИЕ =====
  safeRemove(x, y) {
    if (x >= 0 && y >= 0 && x < SIZE && y < SIZE && board[y] && board[y][x] !== undefined) {
      this.collectCell(x, y)
      board[y][x] = null
    }
  },

  // ===== ПОЛУЧИТЬ ЦВЕТ КЛЕТКИ =====
  getCellColor(x, y) {
    const cell = board[y]?.[x]
    if (!cell) return null
    if (typeof cell === "string") return cell
    if (typeof cell === "object" && cell !== null) return cell.color
    return null
  },

  // ===== СОБРАТЬ ВСЕ КЛЕТКИ ОПРЕДЕЛЁННОГО ЦВЕТА =====
  collectAllOfColor(targetColor) {
    for (let yy = 0; yy < SIZE; yy++) {
      for (let xx = 0; xx < SIZE; xx++) {
        if (this.getCellColor(xx, yy) === targetColor) {
          this.collectCell(xx, yy)
        }
      }
    }
  },

  // ===== УДАЛИТЬ ВСЕ КЛЕТКИ ОПРЕДЕЛЁННОГО ЦВЕТА =====
  removeAllOfColor(targetColor) {
    for (let yy = 0; yy < SIZE; yy++) {
      for (let xx = 0; xx < SIZE; xx++) {
        if (this.getCellColor(xx, yy) === targetColor) {
          board[yy][xx] = null
        }
      }
    }
  },

  // ===== НАЙТИ СЛУЧАЙНУЮ ПУСТУЮ КЛЕТКУ =====
  findRandomEmpty() {
    const empties = []
    for (let yy = 0; yy < SIZE; yy++) {
      for (let xx = 0; xx < SIZE; xx++) {
        if (board[yy][xx] === null) empties.push({x: xx, y: yy})
      }
    }
    if (empties.length === 0) return null
    return empties[Math.floor(Math.random() * empties.length)]
  },

  // ===== РАЗБРОСАТЬ РАКЕТЫ =====
  spawnRockets(count) {
    for (let i = 0; i < count; i++) {
      const pos = this.findRandomEmpty()
      if (pos) {
        board[pos.y][pos.x] = {
          color: randomColor(),
          special: "rocket",
          type: "special"
        }
      }
    }
  },

  // =====================================================
  // ===== ГЛАВНАЯ АКТИВАЦИЯ КОМБО ДВУХ СПЕЦ-ФИШЕК =====
  // =====================================================
  async activateCombo(x1, y1, x2, y2, spec1, spec2, direction) {
    const comboKey = [spec1, spec2].sort().join('+')
    
    // Выбираем цвет из той фишки, которая радуга (если есть)
    let comboColor = null
    if (spec1 === "color" || spec2 === "color") {
      // Берём цвет из не-радужной фишки, или находим доминирующий цвет на доске
      if (spec1 !== "color") {
        comboColor = this.getCellColor(x1, y1)
      } else if (spec2 !== "color") {
        comboColor = this.getCellColor(x2, y2)
      } else {
        // Обе радуги — очистка всего поля, цвет не важен
      }
    }

    // Ракета + Ракета (крест)
    if (comboKey === "rocket+rocket") {
      await this.rocketWithDelay(x1, y1, null, null) // null = крест
    }
    
    // Ракета + Бомба
    else if (comboKey === "bomb+rocket") {
      await this.showComboEffect(x1, y1, x2, y2, "rocket-bomb")
      await this.rocketWithDelay(x1, y1, null, direction)
      await this.bombWithDelay(x2, y2)
    }
    
    // Ракета + Радуга
    else if (comboKey === "color+rocket") {
      if (!comboColor) comboColor = this.getCellColor(x2, y2)
      await this.showComboEffect(x1, y1, x2, y2, "rainbow-rocket")
      // Превращаем все фишки выбранного цвета в ракеты и активируем
      await this.rainbowToRockets(comboColor)
    }
    
    // Бомба + Бомба
    else if (comboKey === "bomb+bomb") {
      await this.showComboEffect(x1, y1, x2, y2, "bomb-bomb")
      await this.megaBomb(x1, y1)
      this.spawnRockets(3)
      renderBoard()
      await this.delay(200)
    }
    
    // Бомба + Радуга
    else if (comboKey === "bomb+color") {
      if (!comboColor) comboColor = this.getCellColor(x2, y2)
      await this.showComboEffect(x1, y1, x2, y2, "rainbow-bomb")
      // Превращаем все фишки выбранного цвета в бомбы и взрываем
      await this.rainbowToBombs(comboColor)
    }
    
    // Радуга + Радуга
    else if (comboKey === "color+color") {
      await this.showComboEffect(x1, y1, x2, y2, "rainbow-rainbow")
      // Очищаем всё поле
      await this.clearAllBoard()
    }
  },

  // ===== ВИЗУАЛЬНЫЙ ЭФФЕКТ КОМБО =====
  async showComboEffect(x1, y1, x2, y2, comboType) {
    // Вспышка на обеих клетках
    const el1 = cells[y1]?.[x1]
    const el2 = cells[y2]?.[x2]
    
    if (el1) {
      el1.style.transform = "scale(1.5)"
      el1.style.filter = "brightness(3)"
      el1.style.zIndex = "30"
    }
    if (el2) {
      el2.style.transform = "scale(1.5)"
      el2.style.filter = "brightness(3)"
      el2.style.zIndex = "30"
    }
    
    await this.delay(250)
    
    if (el1) {
      el1.style.transform = ""
      el1.style.filter = ""
      el1.style.zIndex = ""
    }
    if (el2) {
      el2.style.transform = ""
      el2.style.filter = ""
      el2.style.zIndex = ""
    }
  },

  // ===== РАДУГА → РАКЕТЫ =====
  async rainbowToRockets(targetColor) {
    const rocketPositions = []
    
    // Собираем и удаляем фишки цвета, запоминаем позиции для ракет
    for (let yy = 0; yy < SIZE; yy++) {
      for (let xx = 0; xx < SIZE; xx++) {
        if (this.getCellColor(xx, yy) === targetColor) {
          this.collectCell(xx, yy)
          board[yy][xx] = null
          rocketPositions.push({x: xx, y: yy})
        }
      }
    }
    
    // Ставим ракеты на места удалённых фишек
    rocketPositions.forEach(pos => {
      board[pos.y][pos.x] = {
        color: targetColor,
        special: "rocket",
        type: "special"
      }
    })
    
    renderBoard()
    await this.delay(300)
    
    // Активируем каждую ракету (рандомное направление для хаоса)
    for (const pos of rocketPositions) {
      if (board[pos.y]?.[pos.x]?.special === "rocket") {
        const dir = Math.random() < 0.5 ? 'horizontal' : 'vertical'
        board[pos.y][pos.x] = null
        await this.rocketWithDelay(pos.x, pos.y, null, dir)
      }
    }
  },

  // ===== РАДУГА → БОМБЫ =====
  async rainbowToBombs(targetColor) {
    const bombPositions = []
    
    // Собираем и удаляем фишки цвета, запоминаем позиции для бомб
    for (let yy = 0; yy < SIZE; yy++) {
      for (let xx = 0; xx < SIZE; xx++) {
        if (this.getCellColor(xx, yy) === targetColor) {
          this.collectCell(xx, yy)
          board[yy][xx] = null
          bombPositions.push({x: xx, y: yy})
        }
      }
    }
    
    // Ставим бомбы на места удалённых фишек
    bombPositions.forEach(pos => {
      board[pos.y][pos.x] = {
        color: targetColor,
        special: "bomb",
        type: "special"
      }
    })
    
    renderBoard()
    await this.delay(300)
    
    // Взрываем все бомбы одновременно
    const explosionRadius = []
    for (const pos of bombPositions) {
      if (board[pos.y]?.[pos.x]?.special === "bomb") {
        board[pos.y][pos.x] = null
        // Собираем область взрыва
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = pos.x + dx
            const ny = pos.y + dy
            if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE) {
              if (!explosionRadius.some(p => p.x === nx && p.y === ny)) {
                explosionRadius.push({x: nx, y: ny})
              }
            }
          }
        }
      }
    }
    
    // Визуальный эффект для всех клеток
    explosionRadius.forEach(pos => {
      const el = cells[pos.y]?.[pos.x]
      if (el) {
        el.classList.add("bombBlast")
        setTimeout(() => el.classList.remove("bombBlast"), 400)
      }
    })
    
    await this.delay(200)
    
    // Собираем и удаляем
    explosionRadius.forEach(pos => this.safeRemove(pos.x, pos.y))
    
    renderBoard()
    await this.delay(200)
  },

  // ===== МЕГА-БОМБА (5×5) =====
  async megaBomb(x, y) {
    // Подсветка
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && cells[ny]?.[nx]) {
          cells[ny][nx].classList.add("bombBlast")
          setTimeout(() => {
            if (cells[ny]?.[nx]) cells[ny][nx].classList.remove("bombBlast")
          }, 500)
        }
      }
    }
    
    // Ядро
    const centerEl = cells[y]?.[x]
    if (centerEl) {
      centerEl.classList.add("bombCore")
      setTimeout(() => centerEl.classList.remove("bombCore"), 300)
    }
    
    await this.delay(300)
    
    // Собираем и удаляем
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.safeRemove(x + dx, y + dy)
      }
    }
    
    renderBoard()
    await this.delay(200)
  },

  // ===== ОЧИСТКА ВСЕГО ПОЛЯ =====
  async clearAllBoard() {
    for (let yy = 0; yy < SIZE; yy++) {
      for (let xx = 0; xx < SIZE; xx++) {
        if (cells[yy]?.[xx]) {
          cells[yy][xx].classList.add("rainbowFlash")
        }
      }
    }
    
    await this.delay(400)
    
    for (let yy = 0; yy < SIZE; yy++) {
      for (let xx = 0; xx < SIZE; xx++) {
        this.collectCell(xx, yy)
        board[yy][xx] = null
        if (cells[yy]?.[xx]) {
          cells[yy][xx].classList.remove("rainbowFlash")
        }
      }
    }
    
    renderBoard()
    await this.delay(200)
  },

  // ===============================================
  // ===== АКТИВАЦИЯ ОДНОЙ СПЕЦ-ФИШКИ =====
  // ===============================================
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
    
    // Собираем саму спец-фишку
    this.collectCell(x, y)
    board[y][x] = null
    
    // Проверяем, не попала ли ракета/бомба на другую спец-фишку
    // (автоактивация при попадании ракеты в бомбу/радугу)
    if (specialType === "rocket" && direction) {
      await this.rocketWithChainCheck(x, y, direction)
    } else {
      const map = {
        rocket: this.rocketWithDelay,
        bomb: this.bombWithDelay,
        color: this.colorBombWithDelay
      }
      
      if(map[specialType]){
        await map[specialType].call(this, x, y, color || cell.color, direction)
      }
    }
  },

  // ===== РАКЕТА С ПРОВЕРКОЙ НА ЦЕПОЧКУ =====
  async rocketWithChainCheck(x, y, direction) {
    const horizontal = direction === 'horizontal'
    const cellsToCheck = []
    
    // Собираем все клетки на линии
    for (let i = 0; i < SIZE; i++) {
      const cx = horizontal ? i : x
      const cy = horizontal ? y : i
      if (cx !== x || cy !== y) {
        cellsToCheck.push({x: cx, y: cy})
      }
    }
    
    // Подсветка
    for (const pos of cellsToCheck) {
      const el = cells[pos.y]?.[pos.x]
      if (el) {
        el.classList.add("rocketLine")
        setTimeout(() => el.classList.remove("rocketLine"), 400)
      }
    }
    
    await this.delay(300)
    
    // Проверяем на спец-фишки на пути и собираем
    const foundSpecials = []
    for (const pos of cellsToCheck) {
      this.collectCell(pos.x, pos.y)
      const cell = board[pos.y]?.[pos.x]
      if (cell && typeof cell === "object" && cell.special) {
        foundSpecials.push({x: pos.x, y: pos.y, spec: cell.special})
      }
      board[pos.y][pos.x] = null
    }
    
    renderBoard()
    await this.delay(150)
    
    // Активируем найденные спец-фишки
    for (const fs of foundSpecials) {
      const map = {
        bomb: this.bombWithDelay,
        color: this.colorBombWithDelay,
        rocket: this.rocketWithDelay
      }
      if (map[fs.spec]) {
        await map[fs.spec].call(this, fs.x, fs.y)
      }
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

  // ===== РАКЕТА =====
  async rocketWithDelay(x, y, color = null, direction = null){
    const horizontal = !direction || direction === 'horizontal'
    const vertical = !direction || direction === 'vertical'
    
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
    
    renderBoard()
    await this.delay(150)
  },

  // ===== БОМБА =====
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

  // ===== РАДУГА =====
  async colorBombWithDelay(x, y, color = null){
    let targetColor = color
    
    if(!targetColor){
      for(let yy=0; yy<SIZE; yy++){
        for(let xx=0; xx<SIZE; xx++){
          const cellColor = this.getCellColor(xx, yy)
          if(cellColor){
            targetColor = cellColor
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
        if(this.getCellColor(xx, yy) === targetColor && cells[yy] && cells[yy][xx]){
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
    
    this.collectAllOfColor(targetColor)
    this.removeAllOfColor(targetColor)
    
    renderBoard()
    await this.delay(150)
  },

  // ===== СТАРЫЕ МЕТОДЫ ДЛЯ СОВМЕСТИМОСТИ =====
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
          const cellColor = this.getCellColor(xx, yy)
          if(cellColor){
            targetColor = cellColor
            break
          }
        }
        if(targetColor) break
      }
    }
    
    if(!targetColor) return
    
    this.collectAllOfColor(targetColor)
    this.removeAllOfColor(targetColor)
  }
}
