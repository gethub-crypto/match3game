function init() { console.log('Game started'); 
                 updateScreens(); 
                 createBoard(); }

function createBoard() { const board = document.getElementById('board'); board.innerHTML = '';

for (let i = 0; i < 64; i++) { const cell = document.createElement('div'); cell.className = 'cell'; 
                              board.appendChild(cell); } }

window.onload = init;
