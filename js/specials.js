const Specials = {
  create(type, x, y, color = null){
    board[y][x] = {
      color: color || randomColor(),  // ← для matchDetection.js
      special: type,                   // ← для main.js
      type: "special"                  // ← для проверки в activate
    }
    renderBoard()
  },

  // ===== АКТИВАЦИЯ СПЕЦА =====
  activate(x, y, color = null){
    const cell = board[y][x]
    
    // Универсальная проверка (работает с разными форматами)
    if(!cell) return
    
    // Проверка на спец-ячейку (поддерживает оба формата)
    const isSpecial = (cell.type === "special") || (cell.special !== undefined)
    if(!isSpecial) return
    
    // Определяем тип спец-ячейки
    let specialType = cell.special || null
    if(!specialType && cell.type === "special") specialType = cell.special
    
    if(!specialType) return
    
    // Удаляем спец-шар перед активацией
    board[y][x] = null
    
    const map = {
      rocket: this.rocket,
      bomb: this.bomb,
      color: this.colorBomb
    }
    
    if(map[specialType]){
      // Передаем цвет, если он есть в ячейке
      map[specialType].call(this, x, y, color || cell.color)
    }
  },

  // ===== РАКЕТА =====
  // очищает ряд и колонку
  rocket(x, y){
    for(let i=0; i<SIZE; i++){
      board[y][i] = null
      board[i][x] = null
    }
  },

  // ===== БОМБА =====
  // взрыв 3x3
  bomb(x, y){
    for(let yy=y-1; yy<=y+1; yy++){
      for(let xx=x-1; xx<=x+1; xx++){
        if(xx>=0 && yy>=0 && xx<SIZE && yy<SIZE){
          board[yy][xx] = null
        }
      }
    }
  },

  // ===== ЦВЕТНАЯ БОМБА =====
  // удаляет все шарики выбранного цвета
  colorBomb(x, y, color = null){
    let targetColor = color
    
    // если цвет не передали — ищем любой
    if(!targetColor){
      for(let yy=0; yy<SIZE; yy++){
        for(let xx=0; xx<SIZE; xx++){
          const cell = board[yy][xx]
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
        const cell = board[yy][xx]
        
        // Проверяем цвет в разных форматах
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
