// ==================== tutorial/tutorialBoards.js ====================

const TutorialBoards = {
  SIZE: 8,
  COLORS: ["red", "blue", "green", "yellow", "purple"],
  
  // Базовое обучение свайпу
  basic_swipe: {
    name: "Basic Swipe",
    description: "Swipe to match 3 or more tiles of the same color",
    board: function() {
      const board = this.createEmptyBoard();
      
      // Создаем гарантированный матч из 3 красных в центре
      board[3][2] = "red";
      board[3][3] = "red";
      board[4][3] = "red";
      board[4][4] = "red";
      board[3][4] = "blue";
      
      this.fillRemaining(board);
      return board;
    },
    allowedMoves: [{ from: {x: 3, y: 4}, to: {x: 3, y: 3} }],
    targetMove: { from: {x: 3, y: 4}, to: {x: 3, y: 3} }
  },
  
  // Обучение созданию ракеты
  rocket_tutorial: {
    name: "Rocket Creation",
    description: "Match 4 tiles in a row to create a Rocket",
    board: function() {
      const board = this.createEmptyBoard();
      
      // Создаем гарантированный матч из 4 для ракеты
      board[4][2] = "blue";
      board[4][3] = "blue";
      board[4][4] = "blue";
      board[4][5] = "blue";
      
      // Добавляем свайп для завершения матча
      board[3][2] = "red";
      board[3][3] = "blue";
      
      this.fillRemaining(board);
      return board;
    },
    allowedMoves: [{ from: {x: 3, y: 3}, to: {x: 2, y: 4} }],
    targetMove: { from: {x: 3, y: 3}, to: {x: 2, y: 4} }
  },
  
  // Обучение созданию бомбы
  bomb_tutorial: {
    name: "Bomb Creation",
    description: "Match tiles in L or T shape to create a Bomb",
    board: function() {
      const board = this.createEmptyBoard();
      
      // Создаем L-образный матч для бомбы
      board[3][3] = "green";
      board[3][4] = "green";
      board[3][5] = "green";
      board[4][3] = "green";
      board[5][3] = "green";
      
      board[4][2] = "red";
      board[4][4] = "green";
      
      this.fillRemaining(board);
      return board;
    },
    allowedMoves: [{ from: {x: 4, y: 2}, to: {x: 4, y: 4} }],
    targetMove: { from: {x: 4, y: 2}, to: {x: 4, y: 4} }
  },
  
  // Обучение созданию радуги
  rainbow_tutorial: {
    name: "Rainbow Creation",
    description: "Match 5 tiles in a row to create a Rainbow",
    board: function() {
      const board = this.createEmptyBoard();
      
      // Создаем матч из 5 для радуги
      board[4][1] = "yellow";
      board[4][2] = "yellow";
      board[4][3] = "yellow";
      board[4][4] = "yellow";
      board[4][5] = "yellow";
      
      board[3][1] = "red";
      board[3][3] = "yellow";
      
      this.fillRemaining(board);
      return board;
    },
    allowedMoves: [{ from: {x: 3, y: 3}, to: {x: 1, y: 4} }],
    targetMove: { from: {x: 3, y: 3}, to: {x: 1, y: 4} }
  },
  
  // Комбинация Rocket + Rocket
  rocket_rocket_tutorial: {
    name: "Rocket + Rocket",
    description: "Combine two Rockets to clear a cross shape",
    board: function() {
      const board = this.createEmptyBoard();
      
      // Размещаем две ракеты
      board[3][3] = { color: "red", special: "rocket", type: "special" };
      board[3][4] = { color: "blue", special: "rocket", type: "special" };
      
      this.fillRemaining(board);
      return board;
    },
    allowedMoves: [{ from: {x: 3, y: 3}, to: {x: 4, y: 3} }],
    targetMove: { from: {x: 3, y: 3}, to: {x: 4, y: 3} }
  },
  
  // Комбинация Rocket + Bomb
  rocket_bomb_tutorial: {
    name: "Rocket + Bomb",
    description: "Combine a Rocket and Bomb for a powerful explosion",
    board: function() {
      const board = this.createEmptyBoard();
      
      board[3][3] = { color: "red", special: "rocket", type: "special" };
      board[3][4] = { color: "green", special: "bomb", type: "special" };
      
      this.fillRemaining(board);
      return board;
    },
    allowedMoves: [{ from: {x: 3, y: 3}, to: {x: 4, y: 3} }],
    targetMove: { from: {x: 3, y: 3}, to: {x: 4, y: 3} }
  },
  
  // Комбинация Rocket + Rainbow
  rocket_rainbow_tutorial: {
    name: "Rocket + Rainbow",
    description: "Combine a Rocket and Rainbow to turn all tiles of one color into Rockets",
    board: function() {
      const board = this.createEmptyBoard();
      
      board[3][3] = { color: "yellow", special: "rocket", type: "special" };
      board[3][4] = { color: null, special: "color", type: "special" };
      
      this.fillRemaining(board);
      return board;
    },
    allowedMoves: [{ from: {x: 3, y: 3}, to: {x: 4, y: 3} }],
    targetMove: { from: {x: 3, y: 3}, to: {x: 4, y: 3} }
  },
  
  // Комбинация Bomb + Bomb
  bomb_bomb_tutorial: {
    name: "Bomb + Bomb",
    description: "Combine two Bombs for a mega explosion",
    board: function() {
      const board = this.createEmptyBoard();
      
      board[3][3] = { color: "red", special: "bomb", type: "special" };
      board[3][4] = { color: "blue", special: "bomb", type: "special" };
      
      this.fillRemaining(board);
      return board;
    },
    allowedMoves: [{ from: {x: 3, y: 3}, to: {x: 4, y: 3} }],
    targetMove: { from: {x: 3, y: 3}, to: {x: 4, y: 3} }
  },
  
  // Комбинация Bomb + Rainbow
  bomb_rainbow_tutorial: {
    name: "Bomb + Rainbow",
    description: "Combine a Bomb and Rainbow to turn all tiles of one color into Bombs",
    board: function() {
      const board = this.createEmptyBoard();
      
      board[3][3] = { color: "green", special: "bomb", type: "special" };
      board[3][4] = { color: null, special: "color", type: "special" };
      
      this.fillRemaining(board);
      return board;
    },
    allowedMoves: [{ from: {x: 3, y: 3}, to: {x: 4, y: 3} }],
    targetMove: { from: {x: 3, y: 3}, to: {x: 4, y: 3} }
  },
  
  // Комбинация Rainbow + Rainbow
  rainbow_rainbow_tutorial: {
    name: "Rainbow + Rainbow",
    description: "Combine two Rainbows to clear the entire board",
    board: function() {
      const board = this.createEmptyBoard();
      
      board[3][3] = { color: null, special: "color", type: "special" };
      board[3][4] = { color: null, special: "color", type: "special" };
      
      this.fillRemaining(board);
      return board;
    },
    allowedMoves: [{ from: {x: 3, y: 3}, to: {x: 4, y: 3} }],
    targetMove: { from: {x: 3, y: 3}, to: {x: 4, y: 3} }
  },
  
  createEmptyBoard() {
    return Array.from({ length: this.SIZE }, () => 
      Array.from({ length: this.SIZE }, () => null)
    );
  },
  
  fillRemaining(board) {
    for (let y = 0; y < this.SIZE; y++) {
      for (let x = 0; x < this.SIZE; x++) {
        if (board[y][x] === null) {
          board[y][x] = this.COLORS[Math.floor(Math.random() * this.COLORS.length)];
        }
      }
    }
  },
  
  getBoard(tutorialId) {
    if (this[tutorialId] && typeof this[tutorialId].board === 'function') {
      return this[tutorialId].board();
    }
    return null;
  },
  
  getAllowedMoves(tutorialId) {
    return this[tutorialId]?.allowedMoves || [];
  },
  
  getTargetMove(tutorialId) {
    return this[tutorialId]?.targetMove || null;
  }
};
