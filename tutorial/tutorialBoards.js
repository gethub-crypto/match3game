// ================= TUTORIAL BOARDS =================
const TutorialBoards = {
  // Предопределенные доски для каждого туториала
  boards: {
    rocket_tutorial: {
      board: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, {special:'rocket', color:'red', type:'special'}, {color:'blue'}, {color:'green'}, null, null, null, null]
      ],
      rocketPosition: {x: 1, y: 7},
      swipeTargets: [
        {x: 2, y: 7, direction: 'right'},
        {x: 0, y: 7, direction: 'left'}
      ]
    },
    
    bomb_tutorial: {
      board: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, {special:'bomb', color:'blue', type:'special'}, {color:'red'}, null, null, null, null]
      ],
      bombPosition: {x: 2, y: 7},
      swipeTargets: [
        {x: 3, y: 7, direction: 'right'},
        {x: 1, y: 7, direction: 'left'}
      ]
    },
    
    rainbow_tutorial: {
      board: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, {special:'color', color:'rainbow', type:'special'}, {color:'red'}, {color:'red'}, null, null, null, null]
      ],
      rainbowPosition: {x: 1, y: 7},
      swipeTargets: [
        {x: 2, y: 7, direction: 'right'},
        {x: 3, y: 7, direction: 'right'}
      ]
    },
    
    rocket_rocket_tutorial: {
      board: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, {special:'rocket', color:'red', type:'special'}, {special:'rocket', color:'blue', type:'special'}, null, null, null, null, null]
      ],
      comboPositions: [
        {x: 1, y: 7, type: 'rocket'},
        {x: 2, y: 7, type: 'rocket'}
      ],
      swipeDirection: {from: 1, to: 2, y: 7}
    },
    
    rocket_bomb_tutorial: {
      board: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, {special:'rocket', color:'red', type:'special'}, {special:'bomb', color:'blue', type:'special'}, null, null, null, null, null]
      ],
      comboPositions: [
        {x: 1, y: 7, type: 'rocket'},
        {x: 2, y: 7, type: 'bomb'}
      ],
      swipeDirection: {from: 1, to: 2, y: 7}
    },
    
    rocket_rainbow_tutorial: {
      board: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, {special:'rocket', color:'red', type:'special'}, {special:'color', color:'rainbow', type:'special'}, {color:'red'}, null, null, null, null]
      ],
      comboPositions: [
        {x: 1, y: 7, type: 'rocket'},
        {x: 2, y: 7, type: 'color'}
      ],
      swipeDirection: {from: 1, to: 2, y: 7}
    },
    
    bomb_bomb_tutorial: {
      board: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, {special:'bomb', color:'red', type:'special'}, {special:'bomb', color:'blue', type:'special'}, null, null, null, null, null]
      ],
      comboPositions: [
        {x: 1, y: 7, type: 'bomb'},
        {x: 2, y: 7, type: 'bomb'}
      ],
      swipeDirection: {from: 1, to: 2, y: 7}
    },
    
    bomb_rainbow_tutorial: {
      board: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, {special:'bomb', color:'red', type:'special'}, {special:'color', color:'rainbow', type:'special'}, {color:'red'}, null, null, null, null]
      ],
      comboPositions: [
        {x: 1, y: 7, type: 'bomb'},
        {x: 2, y: 7, type: 'color'}
      ],
      swipeDirection: {from: 1, to: 2, y: 7}
    },
    
    rainbow_rainbow_tutorial: {
      board: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, {special:'color', color:'rainbow', type:'special'}, {special:'color', color:'rainbow', type:'special'}, null, null, null, null, null]
      ],
      comboPositions: [
        {x: 1, y: 7, type: 'color'},
        {x: 2, y: 7, type: 'color'}
      ],
      swipeDirection: {from: 1, to: 2, y: 7}
    }
  },
  
  getBoard(tutorialId) {
    return this.boards[tutorialId] || null;
  },
  
  // Заполняет пустые клетки случайными цветами без создания матчей
  fillEmpty(board) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (board[y] === undefined) board[y] = [];
        if (board[y][x] === null || board[y][x] === undefined) {
          let color;
          do {
            color = COLORS[Math.floor(Math.random() * COLORS.length)];
            board[y][x] = color;
          } while (this.wouldCreateMatch(board, x, y));
        }
      }
    }
    return board;
  },
  
  wouldCreateMatch(board, x, y) {
    const color = board[y][x];
    
    // Проверка горизонтали
    if (x >= 2) {
      const c1 = typeof board[y][x-1] === 'string' ? board[y][x-1] : null;
      const c2 = typeof board[y][x-2] === 'string' ? board[y][x-2] : null;
      if (c1 === color && c2 === color) return true;
    }
    
    // Проверка вертикали
    if (y >= 2) {
      const c1 = typeof board[y-1]?.[x] === 'string' ? board[y-1][x] : null;
      const c2 = typeof board[y-2]?.[x] === 'string' ? board[y-2][x] : null;
      if (c1 === color && c2 === color) return true;
    }
    
    return false;
  }
};
