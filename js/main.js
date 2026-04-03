// ================= GLOBAL =================

let currentLevel = 1
let levelData = null

let movesLeft = 0
let score = 0

let levelFinished = false
let gameLocked = false

let hintTimer = null

const SIZE = 8
const COLORS = ["red","blue","green","yellow","purple"]

let board = []
let cells = []

let selected = null



// ================= INIT =================

async function init(){

LivesSystem.init()

await Levels.load()

updateCoinsUI()

}

window.onload = init



// ================= START LEVEL =================

function startLevel(){

if(!LivesSystem.hasLives()){
LivesSystem.showNoLivesPopup()
return
}

goTo("game")

initLevel()

}



// ================= INIT LEVEL =================

function initLevel(){

levelFinished = false
gameLocked = false

levelData = Levels.get(currentLevel)

createBoard()

movesLeft = levelData.moves

score = 0

updateHUD()

startHintTimer()

}



// ================= CREATE BOARD =================

function createBoard(){

const boardEl = document.getElementById("board")

boardEl.innerHTML = ""

board = []
cells = []

for(let y=0;y<SIZE;y++){

board[y] = []
cells[y] = []

for(let x=0;x<SIZE;x++){

let color

do{
color = randomColor()
board[y][x] = color
}
while(hasMatchAt(x,y))

const cell = document.createElement("div")

cell.className = "cell"

cell.dataset.x = x
cell.dataset.y = y

setColor(cell,color)

addSwipe(cell,x,y)

boardEl.appendChild(cell)

cells[y][x] = cell

}

}

}



// ================= RANDOM COLOR =================

function randomColor(){

return COLORS[Math.floor(Math.random()*COLORS.length)]

}



// ================= START MATCH CHECK =================

function hasMatchAt(x,y){

const color = board[y][x]

if(x>=2 && board[y][x-1]===color && board[y][x-2]===color) return true

if(y>=2 && board[y-1][x]===color && board[y-2][x]===color) return true

return false

}



// ================= CELL COLOR =================

function setColor(cell,color){

if(typeof color === "object"){

if(color.special==="rocket") cell.innerHTML="🚀"
if(color.special==="bomb") cell.innerHTML="💣"
if(color.special==="color") cell.innerHTML="🌈"

cell.style.background="#444"

}else{

cell.innerHTML=""
cell.style.background=color

}

}



// ================= SWIPE =================

function addSwipe(cell,x,y){

let startX=0
let startY=0

cell.addEventListener("touchstart",e=>{

startX = e.touches[0].clientX
startY = e.touches[0].clientY

selected = {x,y}

highlightCell(x,y)

})

cell.addEventListener("touchend",e=>{

if(gameLocked) return

const endX = e.changedTouches[0].clientX
const endY = e.changedTouches[0].clientY

const dx = endX-startX
const dy = endY-startY

let targetX=x
let targetY=y

if(Math.abs(dx)>Math.abs(dy)){

if(dx>30) targetX=x+1
if(dx<-30) targetX=x-1

}else{

if(dy>30) targetY=y+1
if(dy<-30) targetY=y-1

}

onCellClick(targetX,targetY)

})

}



// ================= SELECT CELL =================

function highlightCell(x,y){

for(let yy=0;yy<SIZE;yy++){
for(let xx=0;xx<SIZE;xx++){
cells[yy][xx].classList.remove("selected")
}
}

cells[y][x].classList.add("selected")

}

function clearHighlight(){

for(let yy=0;yy<SIZE;yy++){
for(let xx=0;xx<SIZE;xx++){
cells[yy][xx].classList.remove("selected")
}
}

}



// ================= CLICK =================

function onCellClick(x,y){

if(gameLocked) return
if(x<0||x>=SIZE||y<0||y>=SIZE) return

if(!selected){

selected={x,y}

highlightCell(x,y)

return

}

const dx=Math.abs(selected.x-x)
const dy=Math.abs(selected.y-y)

if(dx+dy!==1){

clearHighlight()
selected=null
return

}

swap(selected,{x,y})

const matches = MatchDetection.getMatches(board)

if(matches.length===0){

swap(selected,{x,y})

}else{

movesLeft--

processMatches()

}

clearHighlight()

selected=null

updateHUD()

startHintTimer()

}



// ================= SWAP =================

function swap(a,b){

const temp=board[a.y][a.x]

board[a.y][a.x]=board[b.y][b.x]
board[b.y][b.x]=temp

renderBoard()

}



// ================= RENDER =================

function renderBoard(){

for(let y=0;y<SIZE;y++){
for(let x=0;x<SIZE;x++){
setColor(cells[y][x],board[y][x])
}
}

}



// ================= PROCESS MATCH =================

function processMatches(){

const matches = MatchDetection.getMatches(board)

if(matches.length===0){

checkWin()

if(!hasPossibleMoves()){
shuffleBoard()
}

return

}

matches.forEach(match=>{

if(match.type){

const c = match.cells[0]

Specials.create(match.type,c.x,c.y)

}

match.cells.forEach(cell=>{

let piece = board[cell.y][cell.x]

if(typeof piece === "object"){
Specials.activate(cell.x,cell.y)
}

score += 50

board[cell.y][cell.x]=null

})

})

drop()

renderBoard()

setTimeout(processMatches,200)

}



// ================= DROP =================

function drop(){

for(let x=0;x<SIZE;x++){

for(let y=SIZE-1;y>=0;y--){

if(board[y][x]===null){

for(let k=y-1;k>=0;k--){

if(board[k][x]!==null){

board[y][x]=board[k][x]
board[k][x]=null

break

}

}

}

if(board[y][x]===null){
board[y][x]=randomColor()
}

}

}

}



// ================= POSSIBLE MOVES =================

function hasPossibleMoves(){

for(let y=0;y<SIZE;y++){
for(let x=0;x<SIZE;x++){

if(x<SIZE-1){

swapTest(x,y,x+1,y)

if(MatchDetection.getMatches(board).length>0){
swapTest(x,y,x+1,y)
return true
}

swapTest(x,y,x+1,y)

}

if(y<SIZE-1){

swapTest(x,y,x,y+1)

if(MatchDetection.getMatches(board).length>0){
swapTest(x,y,x,y+1)
return true
}

swapTest(x,y,x,y+1)

}

}
}

return false

}

function swapTest(x1,y1,x2,y2){

const temp=board[y1][x1]

board[y1][x1]=board[y2][x2]
board[y2][x2]=temp

}



// ================= SHUFFLE =================

function shuffleBoard(){

for(let y=0;y<SIZE;y++){
for(let x=0;x<SIZE;x++){
board[y][x]=randomColor()
}
}

renderBoard()

}



// ================= HINT =================

function startHintTimer(){

clearTimeout(hintTimer)

hintTimer=setTimeout(showHint,4000)

}

function showHint(){

for(let y=0;y<SIZE;y++){
for(let x=0;x<SIZE;x++){

if(x<SIZE-1){

swapTest(x,y,x+1,y)

if(MatchDetection.getMatches(board).length>0){

cells[y][x].classList.add("hint")

setTimeout(()=>cells[y][x].classList.remove("hint"),2000)

swapTest(x,y,x+1,y)

return

}

swapTest(x,y,x+1,y)

}

}
}

}



// ================= HUD =================

function updateHUD(){

document.getElementById("movesDisplay").innerText=`Ходы: ${movesLeft}`

document.getElementById("targetDisplay").innerText=`Очки: ${score}`

}



// ================= WIN CHECK =================

function checkWin(){

if(levelFinished) return

if(score>=levelData.target){

winLevel()
return

}

if(movesLeft<=0){

loseLevel()

}

}



// ================= WIN =================

function winLevel(){

levelFinished=true
gameLocked=true

animateCoins()

setTimeout(()=>{

addCoins(levelData.reward)
updateCoinsUI()

},700)

showPopup(`
<h2>Победа</h2>
<p>Награда ${levelData.reward} монет</p>
<button onclick="nextLevel()">Далее</button>
`)

}



// ================= LOSE =================

function loseLevel(){

levelFinished=true
gameLocked=true

LivesSystem.useLife()

showPopup(`
<h2>Поражение</h2>
<button onclick="restartLevel()">Заново</button>
`)

}



// ================= LEVEL =================

function nextLevel(){

currentLevel++

hidePopup()

initLevel()

}

function restartLevel(){

if(!LivesSystem.useLife()) return

hidePopup()

initLevel()

}



// ================= COINS =================

function updateCoinsUI(){

const el=document.getElementById("coinsDisplay")

if(el){
el.innerText="💰 "+getCoins()
}

}



// ================= COIN ANIMATION =================

function animateCoins(){

const coinsEl=document.getElementById("coinsDisplay")

const rect=coinsEl.getBoundingClientRect()

for(let i=0;i<10;i++){

const coin=document.createElement("div")

coin.innerHTML="💰"

coin.className="coinFly"

coin.style.left=window.innerWidth/2+"px"
coin.style.top=window.innerHeight/2+"px"

document.body.appendChild(coin)

setTimeout(()=>{

coin.style.transform=`translate(${rect.left-window.innerWidth/2}px,
${rect.top-window.innerHeight/2}px) scale(0.5)`

coin.style.opacity="0"

},20)

setTimeout(()=>coin.remove(),900)

}

 }
