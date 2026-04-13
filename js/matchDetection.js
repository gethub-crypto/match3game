const matchDetection = {

getMatches(board){

const size = board.length
const matches = []
const mark = new Set()

function key(x,y){ return x+"_"+y }

function getColor(cell){
if(!cell) return null
if(typeof cell==="object") return cell.color
return cell
}

// ===== горизонтальные линии =====
for(let y=0;y<size;y++){

let x=0

while(x<size){

const color=getColor(board[y][x])
if(!color){ x++; continue }

let start=x

while(x<size && getColor(board[y][x])===color){
x++
}

let len=x-start

if(len>=3){

let cells=[]

for(let i=start;i<x;i++){
cells.push({x:i,y})
}

let type=null

if(len===4) type="rocket"
if(len>=5) type="color"

// проверка T / L для бомбы
cells.forEach(c=>{

let up=0
let down=0

for(let yy=c.y-1;yy>=0;yy--){
if(getColor(board[yy][c.x])===color) up++
else break
}

for(let yy=c.y+1;yy<size;yy++){
if(getColor(board[yy][c.x])===color) down++
else break
}

if(up+down>=2){
type="bomb"

for(let i=1;i<=up;i++) cells.push({x:c.x,y:c.y-i})
for(let i=1;i<=down;i++) cells.push({x:c.x,y:c.y+i})
}

})

// удаляем дубликаты
cells = cells.filter((c,i,a)=>
a.findIndex(o=>o.x===c.x && o.y===c.y)===i
)

const id=cells.map(c=>key(c.x,c.y)).join("|")

if(!mark.has(id)){

mark.add(id)

matches.push({
type:type,
cells:cells
})

}

}

}

}

// ===== вертикальные линии =====
for(let x=0;x<size;x++){

let y=0

while(y<size){

const color=getColor(board[y][x])
if(!color){ y++; continue }

let start=y

while(y<size && getColor(board[y][x])===color){
y++
}

let len=y-start

if(len>=3){

let cells=[]

for(let i=start;i<y;i++){
cells.push({x,y:i})
}

let type=null

if(len===4) type="rocket"
if(len>=5) type="color"

cells = cells.filter((c,i,a)=>
a.findIndex(o=>o.x===c.x && o.y===c.y)===i
)

const id=cells.map(c=>key(c.x,c.y)).join("|")

if(!mark.has(id)){

mark.add(id)

matches.push({
type:type,
cells:cells
})

}

}

}

}

return matches

}

                                   }
