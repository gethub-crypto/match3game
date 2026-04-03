const MatchDetection = {

getMatches(board){

const matches=[]
const map={}

for(let y=0;y<SIZE;y++){
for(let x=0;x<SIZE;x++){

const color=board[y][x]

if(typeof color !== "string") continue

// горизонталь
let line=[{x,y}]

for(let i=x+1;i<SIZE;i++){

if(board[y][i]===color){
line.push({x:i,y})
}else{
break
}

}

if(line.length>=3){

line.forEach(c=>{
map[c.x+"_"+c.y]=true
})

matches.push({
cells:line,
type:this.detectSpecial(line)
})

}

// вертикаль
line=[{x,y}]

for(let i=y+1;i<SIZE;i++){

if(board[i][x]===color){
line.push({x,y:i})
}else{
break
}

}

if(line.length>=3){

line.forEach(c=>{
map[c.x+"_"+c.y]=true
})

matches.push({
cells:line,
type:this.detectSpecial(line)
})

}

}
}

return matches

},



detectSpecial(line){

if(line.length>=5){
return "color"
}

if(line.length===4){
return "rocket"
}

return null

},



detectShape(board,cells){

const xs=cells.map(c=>c.x)
const ys=cells.map(c=>c.y)

const minX=Math.min(...xs)
const maxX=Math.max(...xs)

const minY=Math.min(...ys)
const maxY=Math.max(...ys)

const width=maxX-minX+1
const height=maxY-minY+1

if(width===3 && height===3){
return "bomb"
}

return null

}

  }
