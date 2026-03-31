// ================= DROP =================

function drop() {

for (let x = 0; x < SIZE; x++) {

for (let y = SIZE - 1; y >= 0; y--) {

if (board[y][x] === null) {

for (let k = y - 1; k >= 0; k--) {

if (board[k][x] !== null) {

board[y][x] = board[k][x];
board[k][x] = null;

break;

}

}

}

if (board[y][x] === null) {

board[y][x] = randomColor();

}

}

}

    }
