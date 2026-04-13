const Specials = {
    
    // Создание спецэлемента (унифицированный формат)
    create(type, x, y, board, SIZE, renderBoard){
        board[y][x] = {
            special: type,
            color: null  // Для спецэлементов цвет не нужен
        }
        if(renderBoard) renderBoard()
    },
    
    // Активация спецэлемента
    activate(x, y, color = null, board, SIZE){
        const cell = board[y][x]
        
        // Проверка: есть ли спецэлемент
        if(!cell || !cell.special) return
        
        // Удаляем спец перед активацией
        board[y][x] = null
        
        const methods = {
            rocket: this.rocket,
            bomb: this.bomb,
            color: this.colorBomb
        }
        
        if(methods[cell.special]){
            methods[cell.special].call(this, x, y, color, board, SIZE)
        }
    },
    
    // ===== РАКЕТА =====
    rocket(x, y, color, board, SIZE){
        for(let i = 0; i < SIZE; i++){
            if(board[y][i] !== null) board[y][i] = null
            if(board[i][x] !== null) board[i][x] = null
        }
    },
    
    // ===== БОМБА =====
    bomb(x, y, color, board, SIZE){
        for(let yy = y - 1; yy <= y + 1; yy++){
            for(let xx = x - 1; xx <= x + 1; xx++){
                if(xx >= 0 && yy >= 0 && xx < SIZE && yy < SIZE){
                    if(board[yy][xx] !== null) board[yy][xx] = null
                }
            }
        }
    },
    
    // ===== ЦВЕТНАЯ БОМБА =====
    colorBomb(x, y, color = null, board, SIZE){
        let targetColor = color
        
        // Если цвет не передан — ищем любой цвет на поле
        if(!targetColor){
            for(let yy = 0; yy < SIZE; yy++){
                for(let xx = 0; xx < SIZE; xx++){
                    const cell = board[yy][xx]
                    if(cell && typeof cell === "string"){
                        targetColor = cell
                        break
                    }
                    if(cell && typeof cell === "object" && cell.color){
                        targetColor = cell.color
                        break
                    }
                }
                if(targetColor) break
            }
        }
        
        if(!targetColor) return
        
        // Удаляем все клетки целевого цвета
        for(let yy = 0; yy < SIZE; yy++){
            for(let xx = 0; xx < SIZE; xx++){
                const cell = board[yy][xx]
                if(cell === targetColor){
                    board[yy][xx] = null
                } else if(cell && typeof cell === "object" && cell.color === targetColor){
                    board[yy][xx] = null
                }
            }
        }
    }
          }
