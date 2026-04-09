const Specials = {

create(type,x,y){

board[y][x] = {
type:"special",
special:type
}

renderBoard()

},

// ===== АКТИВАЦИЯ СПЕЦА =====

activate(x,y,color=null){

const cell = board[y][x]

if(!cell || cell.type!=="special") return

// удалить спец-шар перед активацией
board[y][x] = null

const map = {
rocket: this.rocket,
bomb: this.bomb,
color: this.colorBomb
}

if(map[cell.special]){
map[cell.special].call(this,x,y,color)
}

},

// ===== РАКЕТА =====
// очищает ряд и колонку

rocket(x,y){

for(let i=0;i<SIZE;i++){

board[y][i] = null
board[i][x] = null

}

},

// ===== БОМБА =====
// взрыв 3x3

bomb(x,y){

for(let yy=y-1;yy<=y+1;yy++){
for(let xx=x-1;xx<=x+1;xx++){

if(xx>=0 && yy>=0 && xx<SIZE && yy<SIZE){
board[yy][xx] = null
}

}
}

},

// ===== ЦВЕТНАЯ БОМБА =====
// удаляет все шарики выбранного цвета

colorBomb(x,y,color=null){

let targetColor = color

// если цвет не передали — ищем любой
if(!targetColor){

for(let yy=0;yy<SIZE;yy++){
for(let xx=0;xx<SIZE;xx++){

if(typeof board[yy][xx] === "string"){
targetColor = board[yy][xx]
break
}

}

if(targetColor) break
}

}

if(!targetColor) return

for(let yy=0;yy<SIZE;yy++){
for(let xx=0;xx<SIZE;xx++){

if(board[yy][xx] === targetColor){
board[yy][xx] = null
}

}
}

}

  }
