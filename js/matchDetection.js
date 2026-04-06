const MatchDetection = {

getMatches(board){

const matches=[]
const size=board.length

const used=new Set()

function key(x,y){
return x+"_"+y
}

function getColor(cell){
if(!cell) return null
if(typeof cell==="object") return cell.color || null
return cell
}

for(let y=0;y<size;y++){
for(let x=0;x<size;x++){

const color=getColor(board[y][x])
if(!color) continue

let horiz=[{x,y}]

for(let i=x+1;i<size;i++){

if(getColor(board[y][i])===color){
horiz.push({x:i,y})
}else break

}

if(horiz.length>=3){

let type=null

if(horiz.length===4) type="rocket"
if(horiz.length>=5) type="color"

let cells=[...horiz]

horiz.forEach(c=>{

let vert=[c]

for(let j=c.y+1;j<size;j++){

if(getColor(board[j][c.x])===color){
vert.push({x:c.x,y:j})
}else break

}

for(let j=c.y-1;j>=0;j--){

if(getColor(board[j][c.x])===color){
vert.unshift({x:c.x,y:j})
}else break

}

if(vert.length>=3){

type="bomb"

vert.forEach(v=>cells.push(v))

}

})

cells=cells.filter((c,i,a)=>
a.findIndex(o=>o.x===c.x && o.y===c.y)===i
)

const id=cells.map(c=>key(c.x,c.y)).join("|")

if(!used.has(id)){

used.add(id)

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
