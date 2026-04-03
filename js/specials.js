const Specials = {

create(type,x,y){

board[y][x] = {
type:"special",
special:type
}

renderBoard()

},

activate(x,y){

const cell = board[y][x]

if(!cell) return

if(typeof cell === "object" && cell.type==="special"){

if(cell.special==="rocket"){
this.rocket(x,y)
}

if(cell.special==="bomb"){
this.bomb(x,y)
}

if(cell.special==="color"){
this.colorBomb(x,y)
}

}

},

// ===== РАКЕТА =====

rocket(x,y){

for(let i=0;i<SIZE;i++){

board[y][i] = null
board[i][x] = null

}

},

// ===== БОМБА =====

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

colorBomb(x,y){

let targetColor = null

for(let yy=0;yy<SIZE;yy++){
for(let xx=0;xx<SIZE;xx++){

if(typeof board[yy][xx] === "string"){
targetColor = board[yy][xx]
break
}

}

if(targetColor) break
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
