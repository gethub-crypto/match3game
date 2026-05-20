const MatchDetection = {
  getMatches(board){
    const size = board.length
    const matches = []
    const mark = new Set()
    const usedCells = new Set() // FIX: Отслеживаем использованные ячейки
    
    function key(x, y){ return x + "_" + y }
    
    function getColor(cell){
      if(!cell) return null
      // FIX: Special плитки не участвуют в матчах
      if(typeof cell === "object" && cell !== null){
        if(cell.special || cell.type === "special") return null
        if(cell.color) return cell.color
        return null
      }
      if(typeof cell === "string") return cell
      return null
    }
    
    function isSpecial(cell){
      if(!cell) return false
      if(typeof cell === "object" && cell !== null){
        return cell.special !== undefined || cell.type === "special"
      }
      return false
    }
    
    // ===== горизонтальные линии =====
    for(let y=0; y<size; y++){
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
          
          for(let i=start; i<x; i++){
            cells.push({x: i, y})
          }
          
          let type = null
          
          if(len === 4) type = "rocket"
          if(len >= 5) type = "color"
          
          // проверка T / L для создания бомбы
          cells.forEach(c => {
            let up = 0
            let down = 0
            
            for(let yy=c.y-1; yy>=0; yy--){
              if(getColor(board[yy][c.x]) === color) up++
              else break
            }
            
            for(let yy=c.y+1; yy<size; yy++){
              if(getColor(board[yy][c.x]) === color) down++
              else break
            }
            
            if(up + down >= 2){
              type = "bomb"
              
              for(let i=1; i<=up; i++) cells.push({x: c.x, y: c.y - i})
              for(let i=1; i<=down; i++) cells.push({x: c.x, y: c.y + i})
            }
          })
          
          // удаляем дубликаты
          cells = cells.filter((c, i, a) =>
            a.findIndex(o => o.x === c.x && o.y === c.y) === i
          )
          
          const id = cells.map(c => key(c.x, c.y)).sort().join("|")
          
          if(!mark.has(id)){
            mark.add(id)
            matches.push({
              type: type,
              cells: cells
            })
          }
        }
      }
    }
    
    // ===== вертикальные линии =====
    for(let x=0; x<size; x++){
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
          
          for(let i=start; i<y; i++){
            cells.push({x: x, y: i})
          }
          
          let type = null
          
          if(len === 4) type = "rocket"
          if(len >= 5) type = "color"
          
          // FIX: Проверка T / L для вертикальных матчей
          cells.forEach(c => {
            let left = 0
            let right = 0
            
            for(let xx=c.x-1; xx>=0; xx--){
              if(getColor(board[c.y][xx]) === color) left++
              else break
            }
            
            for(let xx=c.x+1; xx<size; xx++){
              if(getColor(board[c.y][xx]) === color) right++
              else break
            }
            
            if(left + right >= 2){
              type = "bomb"
              
              for(let i=1; i<=left; i++) cells.push({x: c.x - i, y: c.y})
              for(let i=1; i<=right; i++) cells.push({x: c.x + i, y: c.y})
            }
          })
          
          cells = cells.filter((c, i, a) =>
            a.findIndex(o => o.x === c.x && o.y === c.y) === i
          )
          
          const id = cells.map(c => key(c.x, c.y)).sort().join("|")
          
          if(!mark.has(id)){
            mark.add(id)
            matches.push({
              type: type,
              cells: cells
            })
          }
        }
      }
    }
    
    // FIX: Удаляем пересекающиеся матчи (берём первый, остальные игнорируем)
    const deduped = []
    for(const match of matches){
      const hasOverlap = match.cells.some(c => usedCells.has(key(c.x, c.y)))
      if(!hasOverlap){
        deduped.push(match)
        match.cells.forEach(c => usedCells.add(key(c.x, c.y)))
      }
    }
    
    return deduped
  }
            }
