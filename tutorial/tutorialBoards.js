// tutorial/tutorialBoards.js
// ================= TUTORIAL BOARDS =================
// Специальные доски для каждого туториала
// Никакой рандомизации, никаких каскадов

const TutorialBoards = {
  // Вспомогательная функция: создать пустую доску
  createEmpty() {
    const board = [];
    for (let y = 0; y < SIZE; y++) {
      board[y] = [];
      for (let x = 0; x < SIZE; x++) {
        board[y][x] = null;
      }
    }
    return board;
  },

  // Заполнить доску цветами кроме указанных позиций
  fillWithColors(board, exceptPositions = []) {
    const exceptSet = new Set(exceptPositions.map(p => `${p.x},${p.y}`));
    
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (exceptSet.has(`${x},${y}`)) continue;
        if (board[y][x] !== null) continue;
        
        // Выбираем цвет, который не создаст случайных матчей
        let color;
        do {
          color = COLORS[Math.floor(Math.random() * COLORS.length)];
          board[y][x] = color;
        } while (wouldCreateMatch(board, x, y));
      }
    }
    return board;
  },

  // Проверка: создаст ли этот цвет матч
  wouldCreateMatch(board, x, y) {
    const color = board[y][x];
    if (!color) return false;
    
    // Горизонтальная проверка
    if (x >= 2 && 
        board[y][x-1] === color && 
        board[y][x-2] === color) return true;
    
    // Вертикальная проверка
    if (y >= 2 && 
        board[y-1] && board[y-1][x] === color && 
        board[y-2] && board[y-2][x] === color) return true;
    
    return false;
  },

  // ================= БАЗОВЫЙ СВАЙП =================
  basicSwipe() {
    const board = this.createEmpty();
    
    // Создаём ситуацию для очевидного свайпа
    board[3][3] = 'red';
    board[3][4] = 'blue';
    board[3][5] = 'red';
    board[4][3] = 'green';
    board[4][4] = 'red';   // ← эту фишку нужно свайпнуть вверх
    board[4][5] = 'yellow';
    board[5][3] = 'purple';
    board[5][4] = 'red';
    board[5][5] = 'blue';
    
    this.fillWithColors(board, [
      {x:3,y:3},{x:3,y:4},{x:3,y:5},
      {x:4,y:3},{x:4,y:4},{x:4,y:5},
      {x:5,y:3},{x:5,y:4},{x:5,y:5}
    ]);
    
    // Позиции для подсветки: свайп (4,4) ↔ (3,4)
    return {
      board,
      targetAction: {
        type: 'swipe',
        from: { x: 4, y: 4 },
        to: { x: 3, y: 4 },
        description: 'Свайпни красную фишку вверх к другим красным'
      },
      expectedMatch: {
        cells: [{x:3,y:4}, {x:4,y:4}, {x:5,y:4}],
        color: 'red'
      }
    };
  },

  // ================= СОЗДАНИЕ РАКЕТЫ =================
  createRocket() {
    const board = this.createEmpty();
    
    // 4 красных в ряд по горизонтали
    board[3][2] = 'red';
    board[3][3] = 'red';
    board[3][4] = 'red';
    board[3][5] = 'red';
    
    // Очевидный свайп чтобы их совместить
    board[4][3] = 'red';
    board[4][4] = 'blue';
    
    this.fillWithColors(board, [
      {x:2,y:3},{x:3,y:3},{x:4,y:3},{x:5,y:3},
      {x:3,y:4},{x:4,y:4}
    ]);
    
    return {
      board,
      targetAction: {
        type: 'swipe',
        from: { x: 3, y: 4 },
        to: { x: 3, y: 3 },
        description: 'Свайпни красную фишку, чтобы создать 4 в ряд'
      },
      expectedMatch: {
        type: 'rocket',
        cells: [{x:2,y:3}, {x:3,y:3}, {x:4,y:3}, {x:5,y:3}],
        color: 'red'
      }
    };
  },

  // ================= СОЗДАНИЕ БОМБЫ =================
  createBomb() {
    const board = this.createEmpty();
    
    // L-образная форма для бомбы
    board[2][3] = 'green';
    board[3][2] = 'green';
    board[3][3] = 'green';
    board[3][4] = 'green';
    board[4][3] = 'green';
    
    // Свайп чтобы завершить форму
    board[4][4] = 'green';
    board[4][5] = 'blue';
    
    this.fillWithColors(board, [
      {x:3,y:2},{x:2,y:3},{x:3,y:3},{x:4,y:3},{x:3,y:4},
      {x:4,y:4},{x:5,y:4}
    ]);
    
    return {
      board,
      targetAction: {
        type: 'swipe',
        from: { x: 4, y: 4 },
        to: { x: 3, y: 4 },
        description: 'Свайпни зелёную фишку для создания L-формы'
      },
      expectedMatch: {
        type: 'bomb',
        cells: [{x:3,y:2},{x:2,y:3},{x:3,y:3},{x:4,y:3},{x:3,y:4}],
        color: 'green'
      }
    };
  },

  // ================= СОЗДАНИЕ РАДУГИ =================
  createRainbow() {
    const board = this.createEmpty();
    
    // 5 фишек в ряд
    board[3][1] = 'yellow';
    board[3][2] = 'yellow';
    board[3][3] = 'yellow';
    board[3][4] = 'yellow';
    board[3][5] = 'yellow';
    
    // Свайп чтобы завершить 5 в ряд
    board[4][3] = 'yellow';
    board[4][4] = 'purple';
    
    this.fillWithColors(board, [
      {x:1,y:3},{x:2,y:3},{x:3,y:3},{x:4,y:3},{x:5,y:3},
      {x:3,y:4},{x:4,y:4}
    ]);
    
    return {
      board,
      targetAction: {
        type: 'swipe',
        from: { x: 3, y: 4 },
        to: { x: 3, y: 3 },
        description: 'Свайпни жёлтую фишку, чтобы создать 5 в ряд'
      },
      expectedMatch: {
        type: 'color',
        cells: [{x:1,y:3},{x:2,y:3},{x:3,y:3},{x:4,y:3},{x:5,y:3}],
        color: 'yellow'
      }
    };
  },

  // ================= РАКЕТА + РАКЕТА =================
  rocketRocket() {
    const board = this.createEmpty();
    
    // Две ракеты рядом
    board[3][3] = { color: 'red', special: 'rocket', type: 'special' };
    board[3][4] = { color: 'blue', special: 'rocket', type: 'special' };
    
    this.fillWithColors(board, [
      {x:3,y:3}, {x:4,y:3}
    ]);
    
    return {
      board,
      targetAction: {
        type: 'swipe',
        from: { x: 3, y: 3 },
        to: { x: 4, y: 3 },
        description: 'Свайпни одну ракету к другой'
      },
      expectedCombo: {
        type: 'rocket_rocket',
        cellA: { x: 3, y: 3, special: 'rocket' },
        cellB: { x: 4, y: 3, special: 'rocket' }
      }
    };
  },

  // ================= РАКЕТА + БОМБА =================
  rocketBomb() {
    const board = this.createEmpty();
    
    board[3][3] = { color: 'red', special: 'rocket', type: 'special' };
    board[3][4] = { color: 'green', special: 'bomb', type: 'special' };
    
    this.fillWithColors(board, [
      {x:3,y:3}, {x:4,y:3}
    ]);
    
    return {
      board,
      targetAction: {
        type: 'swipe',
        from: { x: 3, y: 3 },
        to: { x: 4, y: 3 },
        description: 'Свайпни ракету к бомбе'
      },
      expectedCombo: {
        type: 'rocket_bomb',
        cellA: { x: 3, y: 3, special: 'rocket' },
        cellB: { x: 4, y: 3, special: 'bomb' }
      }
    };
  },

  // ================= РАКЕТА + РАДУГА =================
  rocketRainbow() {
    const board = this.createEmpty();
    
    board[3][3] = { color: 'red', special: 'rocket', type: 'special' };
    board[3][4] = { color: 'rainbow', special: 'color', type: 'special' };
    
    this.fillWithColors(board, [
      {x:3,y:3}, {x:4,y:3}
    ]);
    
    return {
      board,
      targetAction: {
        type: 'swipe',
        from: { x: 3, y: 3 },
        to: { x: 4, y: 3 },
        description: 'Свайпни ракету к радуге'
      },
      expectedCombo: {
        type: 'rocket_color',
        cellA: { x: 3, y: 3, special: 'rocket' },
        cellB: { x: 4, y: 3, special: 'color' }
      }
    };
  },

  // ================= БОМБА + БОМБА =================
  bombBomb() {
    const board = this.createEmpty();
    
    board[3][3] = { color: 'blue', special: 'bomb', type: 'special' };
    board[3][4] = { color: 'purple', special: 'bomb', type: 'special' };
    
    this.fillWithColors(board, [
      {x:3,y:3}, {x:4,y:3}
    ]);
    
    return {
      board,
      targetAction: {
        type: 'swipe',
        from: { x: 3, y: 3 },
        to: { x: 4, y: 3 },
        description: 'Свайпни одну бомбу к другой'
      },
      expectedCombo: {
        type: 'bomb_bomb',
        cellA: { x: 3, y: 3, special: 'bomb' },
        cellB: { x: 4, y: 3, special: 'bomb' }
      }
    };
  },

  // ================= БОМБА + РАДУГА =================
  bombRainbow() {
    const board = this.createEmpty();
    
    board[3][3] = { color: 'green', special: 'bomb', type: 'special' };
    board[3][4] = { color: 'rainbow', special: 'color', type: 'special' };
    
    this.fillWithColors(board, [
      {x:3,y:3}, {x:4,y:3}
    ]);
    
    return {
      board,
      targetAction: {
        type: 'swipe',
        from: { x: 3, y: 3 },
        to: { x: 4, y: 3 },
        description: 'Свайпни бомбу к радуге'
      },
      expectedCombo: {
        type: 'bomb_color',
        cellA: { x: 3, y: 3, special: 'bomb' },
        cellB: { x: 4, y: 3, special: 'color' }
      }
    };
  },

  // ================= РАДУГА + РАДУГА =================
  rainbowRainbow() {
    const board = this.createEmpty();
    
    board[3][3] = { color: 'rainbow', special: 'color', type: 'special' };
    board[3][4] = { color: 'rainbow', special: 'color', type: 'special' };
    
    this.fillWithColors(board, [
      {x:3,y:3}, {x:4,y:3}
    ]);
    
    return {
      board,
      targetAction: {
        type: 'swipe',
        from: { x: 3, y: 3 },
        to: { x: 4, y: 3 },
        description: 'Свайпни одну радугу к другой'
      },
      expectedCombo: {
        type: 'color_color',
        cellA: { x: 3, y: 3, special: 'color' },
        cellB: { x: 4, y: 3, special: 'color' }
      }
    };
  },

  // Получить доску по ID туториала
  getBoard(tutorialId) {
    const map = {
      'basic_swipe': this.basicSwipe,
      'create_rocket': this.createRocket,
      'create_bomb': this.createBomb,
      'create_rainbow': this.createRainbow,
      'activate_rocket': this.createRocket, // reuse
      'activate_bomb': this.createBomb,
      'activate_rainbow': this.createRainbow,
      'rocket_rocket': this.rocketRocket,
      'rocket_bomb': this.rocketBomb,
      'rocket_rainbow': this.rocketRainbow,
      'bomb_bomb': this.bombBomb,
      'bomb_rainbow': this.bombRainbow,
      'rainbow_rainbow': this.rainbowRainbow
    };
    
    const method = map[tutorialId];
    if (!method) {
      console.error(`❌ TutorialBoards: No board for "${tutorialId}"`);
      return null;
    }
    
    return method.call(this);
  }
};

// Глобальная вспомогательная функция
function wouldCreateMatch(board, x, y) {
  return TutorialBoards.wouldCreateMatch(board, x, y);
}

window.TutorialBoards = TutorialBoards;
console.log('🎯 TutorialBoards initialized');
