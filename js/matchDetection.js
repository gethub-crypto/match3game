const MatchDetection = {
    
    getMatches(board){
        const size = board.length
        const matches = []
        const mark = new Set()
        
        function key(x, y){ return x + "_" + y }
        
        function getColor(cell){
            if(!cell) return null
            // Поддержка спецэлементов
            if(typeof cell === "object"){
                return cell.color || null
            }
            return cell
        }
        
        // ===== горизонтальные линии =====
        for(let y = 0; y < size; y++){
            let x = 0
            while(x < size){
                const color = getColor(board[y][x])
                if(!color){ x++; continue }
                
                let start = x
                while(x < size && getColor(board[y][x]) === color){
                    x++
                }
                
                let len = x - start
                
                if(len >= 3){
                    let cells = []
                    for(let i = start; i < x; i++){
                        cells.push({x: i, y})
                    }
                    
                    let type = null
                    if(len === 4) type = "rocket"
                    if(len >= 5) type = "color"
                    
                    // Проверка на крест (T/L) — для бомбы
                    for(let c of cells){
                        let up = 0, down = 0
                        for(let yy = c.y - 1; yy >= 0; yy--){
                            if(getColor(board[yy][c.x]) === color) up++
                            else break
                        }
                        for(let yy = c.y + 1; yy < size; yy++){
                            if(getColor(board[yy][c.x]) === color) down++
                            else break
                        }
                        // Если есть хотя бы 2 клетки вертикально (в сумме сверху и снизу)
                        // и общая длина горизонтали >=3, это бомба
                        if(up + down >= 2){
                            type = "bomb"
                            for(let i = 1; i <= up; i++) cells.push({x: c.x, y: c.y - i})
                            for(let i = 1; i <= down; i++) cells.push({x: c.x, y: c.y + i})
                        }
                    }
                    
                    // Удаляем дубликаты
                    cells = cells.filter((c, i, a) => 
                        a.findIndex(o => o.x === c.x && o.y === c.y) === i
                    )
                    
                    const id = cells.map(c => key(c.x, c.y)).join("|")
                    
                    if(!mark.has(id)){
                        mark.add(id)
                        matches.push({ type: type, cells: cells })
                    }
                }
            }
        }
        
        // ===== вертикальные линии =====
        for(let x = 0; x < size; x++){
            let y = 0
            while(y < size){
                const color = getColor(board[y][x])
                if(!color){ y++; continue }
                
                let start = y
                while(y < size && getColor(board[y][x]) === color){
                    y++
                }
                
                let len = y - start
                
                if(len >= 3){
                    let cells = []
                    for(let i = start; i < y; i++){
                        cells.push({x, y: i})
                    }
                    
                    let type = null
                    if(len === 4) type = "rocket"
                    if(len >= 5) type = "color"
                    
                    // Проверка на крест для вертикальных линий
                    for(let c of cells){
                        let left = 0, right = 0
                        for(let xx = c.x - 1; xx >= 0; xx--){
                            if(getColor(board[c.y][xx]) === color) left++
                            else break
                        }
                        for(let xx = c.x + 1; xx < size; xx++){
                            if(getColor(board[c.y][xx]) === color) right++
                            else break
                        }
                        if(left + right >= 2){
                            type = "bomb"
                            for(let i = 1; i <= left; i++) cells.push({x: c.x - i, y: c.y})
                            for(let i = 1; i <= right; i++) cells.push({x: c.x + i, y: c.y})
                        }
                    }
                    
                    cells = cells.filter((c, i, a) => 
                        a.findIndex(o => o.x === c.x && o.y === c.y) === i
                    )
                    
                    const id = cells.map(c => key(c.x, c.y)).join("|")
                    
                    if(!mark.has(id)){
                        mark.add(id)
                        matches.push({ type: type, cells: cells })
                    }
                }
            }
        }
        
        return matches
    }
    }
