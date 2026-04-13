const specials = {

create(type,x,y,board,SIZE,renderBoard){

board[y][x] = {
special: type,
color: null
}

if(renderBoard) renderBoard()

},

// ===== АКТИВАЦИЯ СПЕЦА =====

activate(x,y,color=null,board,SIZE){

const cell = board[y][x]

if(!cell || !cell.special) return

// удалить спец-шар перед активацией
board[y][x] = null

const map = {
rocket: this.rocket,
bomb: this.bomb,
color: this.colorBomb
}

if(map[cell.special]){
map[cell.special].call(this,x,y,color,board,SIZE)
}

},

// ===== РАКЕТА =====
// очищает ряд и колонку

rocket(x,y,color,board,SIZE){

for(let i=0;i<SIZE;i++){

if(board[y][i] !== null) board[y][i] = null
if(board[i][x] !== null) board[i][x] = null

}

},

// ===== БОМБА =====
// взрыв 3x3

bomb(x,y,color,board,SIZE){

for(let yy=y-1;yy<=y+1;yy++){
for(let xx=x-1;xx<=x+1;xx++){

if(xx>=0 && yy>=0 && xx<SIZE && yy<SIZE){
if(board[yy][xx] !== null) board[yy][xx] = null
}

}
}

},

// ===== ЦВЕТНАЯ БОМБА =====
// удаляет все шарики выбранного цвета

colorBomb(x,y,color=null,board,SIZE){

let targetColor = color

// если цвет не передали — ищем любой
if(!targetColor){

for(let yy=0;yy<SIZE;yy++){
for(let xx=0;xx<SIZE;xx++){

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

for(let yy=0;yy<SIZE;yy++){
for(let xx=0;xx<SIZE;xx++){

const cell = board[yy][xx]

if(cell === targetColor){
board[yy][xx] = null
}

if(cell && typeof cell === "object" && cell.color === targetColor){
board[yy][xx] = null
}

}
}

}

    }
