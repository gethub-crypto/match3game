const specials = {

    create(type, x, y, board, SIZE, renderBoard){
        board[y][x] = {
            special: type,
            color: null
        }
        if(renderBoard) renderBoard()
    },

    // ===== АКТИВАЦИЯ СПЕЦА =====
    activate(x, y, color, board, SIZE){
        const cell = board[y][x]
        
        // проверка: есть ли спецэлемент
        if(!cell || !cell.special) return false
        
        // сохраняем тип спеца
        const specialType = cell.special
        
        // удаляем спец перед активацией
        board[y][x] = null
        
        // активируем в зависимости от типа
        if(specialType === "rocket"){
            this.rocket(x, y, board, SIZE)
        } else if(specialType === "bomb"){
            this.bomb(x, y, board, SIZE)
        } else if(specialType === "color"){
            this.colorBomb(x, y, color, board, SIZE)
        }
        
        return true
    },

    // ===== РАКЕТА =====
    // очищает всю строку и всю колонку
    rocket(x, y, board, SIZE){
        for(let i = 0; i < SIZE; i++){
            if(board[y][i] !== null) board[y][i] = null
            if(board[i][x] !== null) board[i][x] = null
        }
    },

    // ===== БОМБА =====
    // взрыв 3x3
    bomb(x, y, board, SIZE){
        for(let yy = y - 1; yy <= y + 1; yy++){
            for(let xx = x - 1; xx <= x + 1; xx++){
                if(xx >= 0 && yy >= 0 && xx < SIZE && yy < SIZE){
                    if(board[yy][xx] !== null) board[yy][xx] = null
                }
            }
        }
    },

    // ===== ЦВЕТНАЯ БОМБА (РАДУГА) =====
    // удаляет все шарики выбранного цвета
    colorBomb(x, y, color, board, SIZE){
        let targetColor = color
        
        // если цвет не передан — ищем любой цвет на поле
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
        
        // удаляем все клетки целевого цвета
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
