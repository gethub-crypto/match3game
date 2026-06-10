// ==================== tutorial/tutorialManager.js ====================

const TutorialManager = {
  isActive: false,
  currentTutorial: null,
  tutorialBoard: null,
  boardBackup: null,
  hintTimer: null,
  ghostHandTimer: null,
  startTime: null,
  
  // Конфигурация всех туториалов
  tutorials: {
    basic_swipe: {
      id: "basic_swipe",
      type: "basic",
      title: "Basic Swipe",
      description: "Swipe to match 3 or more tiles of the same color!",
      icon: "👆",
      trigger: "level_1",
      board: "basic_swipe",
      reward: { coins: 10 }
    },
    rocket_created: {
      id: "rocket_created",
      type: "discovery",
      title: "Rocket Created!",
      description: "Rockets clear an entire row or column! Match 4 tiles in a row to create one.",
      icon: "🚀",
      trigger: "first_create_rocket",
      board: "rocket_tutorial",
      reward: { coins: 20 }
    },
    bomb_created: {
      id: "bomb_created",
      type: "discovery",
      title: "Bomb Created!",
      description: "Bombs explode in a 3x3 area! Match tiles in L or T shape to create one.",
      icon: "💣",
      trigger: "first_create_bomb",
      board: "bomb_tutorial",
      reward: { coins: 20 }
    },
    rainbow_created: {
      id: "rainbow_created",
      type: "discovery",
      title: "Rainbow Created!",
      description: "Rainbow tiles can match with any color! Match 5 tiles in a row to create one.",
      icon: "🌈",
      trigger: "first_create_rainbow",
      board: "rainbow_tutorial",
      reward: { coins: 30 }
    },
    rocket_activation: {
      id: "rocket_activation",
      type: "activation",
      title: "Rocket Activation",
      description: "Swipe a Rocket to activate it and clear a whole line!",
      icon: "🚀",
      trigger: "first_activate_rocket",
      board: "rocket_tutorial",
      reward: { coins: 15 }
    },
    bomb_activation: {
      id: "bomb_activation",
      type: "activation",
      title: "Bomb Activation",
      description: "Swipe a Bomb to explode nearby tiles!",
      icon: "💣",
      trigger: "first_activate_bomb",
      board: "bomb_tutorial",
      reward: { coins: 15 }
    },
    rainbow_activation: {
      id: "rainbow_activation",
      type: "activation",
      title: "Rainbow Activation",
      description: "Swipe a Rainbow with any color to collect all tiles of that color!",
      icon: "🌈",
      trigger: "first_activate_rainbow",
      board: "rainbow_tutorial",
      reward: { coins: 20 }
    },
    rocket_rocket: {
      id: "rocket_rocket",
      type: "combo",
      title: "Rocket + Rocket",
      description: "Combine two Rockets to clear a cross shape on the board!",
      icon: "🚀+🚀",
      trigger: "first_combo_rocket_rocket",
      board: "rocket_rocket_tutorial",
      reward: { coins: 40 }
    },
    rocket_bomb: {
      id: "rocket_bomb",
      type: "combo",
      title: "Rocket + Bomb",
      description: "Combine a Rocket and Bomb for a massive directional explosion!",
      icon: "🚀+💣",
      trigger: "first_combo_rocket_bomb",
      board: "rocket_bomb_tutorial",
      reward: { coins: 40 }
    },
    rocket_rainbow: {
      id: "rocket_rainbow",
      type: "combo",
      title: "Rocket + Rainbow",
      description: "Turn all tiles of one color into Rockets and launch them all!",
      icon: "🚀+🌈",
      trigger: "first_combo_rocket_rainbow",
      board: "rocket_rainbow_tutorial",
      reward: { coins: 50 }
    },
    bomb_bomb: {
      id: "bomb_bomb",
      type: "combo",
      title: "Bomb + Bomb",
      description: "Combine two Bombs for a mega explosion with extra rockets!",
      icon: "💣+💣",
      trigger: "first_combo_bomb_bomb",
      board: "bomb_bomb_tutorial",
      reward: { coins: 50 }
    },
    bomb_rainbow: {
      id: "bomb_rainbow",
      type: "combo",
      title: "Bomb + Rainbow",
      description: "Turn all tiles of one color into Bombs and detonate them!",
      icon: "💣+🌈",
      trigger: "first_combo_bomb_rainbow",
      board: "bomb_rainbow_tutorial",
      reward: { coins: 60 }
    },
    rainbow_rainbow: {
      id: "rainbow_rainbow",
      type: "combo",
      title: "Rainbow + Rainbow",
      description: "Combine two Rainbows to clear the entire board!",
      icon: "🌈+🌈",
      trigger: "first_combo_rainbow_rainbow",
      board: "rainbow_rainbow_tutorial",
      reward: { coins: 100 }
    }
  },
  
  init() {
    TutorialStorage.init();
    TutorialOverlay.init();
    GhostHand.init();
    
    console.log('📚 TutorialManager initialized');
  },
  
  checkTriggers(triggerType, data = {}) {
    if (this.isActive) return false;
    
    for (const [id, tutorial] of Object.entries(this.tutorials)) {
      if (this.shouldTrigger(tutorial, triggerType, data)) {
        this.startTutorial(id);
        return true;
      }
    }
    
    return false;
  },
  
  shouldTrigger(tutorial, triggerType, data) {
    if (TutorialStorage.isCompleted(tutorial.id)) return false;
    if (TutorialStorage.isSkipped(tutorial.id)) return false;
    
    const trigger = tutorial.trigger;
    
    if (trigger === triggerType) return true;
    
    // Проверка на level_X триггеры
    if (trigger.startsWith('level_') && triggerType === 'level_start') {
      const levelNum = parseInt(trigger.split('_')[1]);
      if (data.level === levelNum) return true;
    }
    
    // Проверка на first_create_ триггеры
    if (trigger.startsWith('first_create_') && triggerType === 'special_created') {
      const specialType = trigger.replace('first_create_', '');
      if (data.specialType === specialType && !TutorialStorage.hasFirstDiscovery(specialType)) {
        return true;
      }
    }
    
    // Проверка на first_activate_ триггеры
    if (trigger.startsWith('first_activate_') && triggerType === 'special_activated') {
      const specialType = trigger.replace('first_activate_', '');
      if (data.specialType === specialType) return true;
    }
    
    // Проверка на first_combo_ триггеры
    if (trigger.startsWith('first_combo_') && triggerType === 'combo_available') {
      const comboTarget = trigger.replace('first_combo_', '');
      const comboKey = [data.specialA, data.specialB].sort().join('_');
      if (comboKey === comboTarget) return true;
    }
    
    return false;
  },
  
  async startTutorial(tutorialId) {
    const tutorial = this.tutorials[tutorialId];
    if (!tutorial) {
      console.error(`Tutorial ${tutorialId} not found`);
      return;
    }
    
    console.log(`📚 Starting tutorial: ${tutorial.title}`);
    
    this.isActive = true;
    this.currentTutorial = tutorial;
    this.startTime = Date.now();
    
    TutorialStorage.trackAnalytics(tutorialId, 'started');
    
    // Сохраняем состояние игры
    this.saveGameState();
    
    // Блокируем игру
    this.lockGame();
    
    // Загружаем доску туториала ПЕРЕД показом попапа
    this.loadTutorialBoard(tutorial);
    
    // Показываем оверлей и подсветку
    TutorialOverlay.showOverlay();
    this.highlightTargetCells();
    this.dimOtherCells();
    
    // Показываем попап с описанием
    await this.showTutorialPopup(tutorial);
    
    // После закрытия попапа обновляем подсветку и запускаем подсказки
    this.highlightTargetCells();
    this.dimOtherCells();
    this.startHints();
    
    // Разблокируем игру для взаимодействия
    this.unlockGameForInteraction();
  },
  
  saveGameState() {
    this.boardBackup = {
      board: board ? JSON.parse(JSON.stringify(board)) : null,
      movesLeft: movesLeft,
      collectProgress: collectProgress ? { ...collectProgress } : {},
      levelData: levelData,
      currentLevel: currentLevel
    };
  },
  
  restoreGameState() {
    if (this.boardBackup) {
      board = this.boardBackup.board;
      movesLeft = this.boardBackup.movesLeft;
      collectProgress = this.boardBackup.collectProgress;
      levelData = this.boardBackup.levelData;
      currentLevel = this.boardBackup.currentLevel;
      
      renderBoard();
      updateHUD();
      initCollectTracker();
    }
    this.boardBackup = null;
  },
  
  lockGame() {
    gameLocked = true;
    isAnimating = false;
    isProcessingSpecial = false;
    levelFinished = false;
    
    // Останавливаем таймер подсказок
    if (hintTimer) {
      clearTimeout(hintTimer);
      hintTimer = null;
    }
    
    // Отключаем обычные подсказки
    clearHints();
  },
  
  unlockGameForInteraction() {
    // Разблокируем только взаимодействие, но не всю игру
    gameLocked = false;
    isAnimating = false;
    isProcessingSpecial = false;
    levelFinished = false;
    
    console.log('🔓 Game unlocked for tutorial interaction');
  },
  
  unlockGame() {
    gameLocked = false;
    isAnimating = false;
    isProcessingSpecial = false;
    
    console.log('🔓 Game fully unlocked');
  },
  
  async showTutorialPopup(tutorial) {
    return new Promise((resolve) => {
      TutorialOverlay.showPopup({
        title: tutorial.title,
        description: tutorial.description,
        icon: tutorial.icon,
        showSkip: true,
        continueText: 'Let\'s Try!',
        onContinue: () => {
          // Скрываем попап, но оставляем оверлей и подсветку
          TutorialOverlay.hidePopup();
          resolve();
        },
        onSkip: () => {
          this.skipTutorial();
          resolve();
        }
      });
    });
  },
  
  loadTutorialBoard(tutorial) {
    const boardLayout = TutorialBoards.getBoard(tutorial.board);
    if (!boardLayout) {
      console.error(`Board layout not found for ${tutorial.board}`);
      return;
    }
    
    this.tutorialBoard = boardLayout;
    
    // Копируем доску в глобальную переменную
    board = boardLayout.map(row => [...row]);
    movesLeft = 999; // Бесконечные ходы для туториала
    levelFinished = false;
    
    // Пересоздаем DOM элементы доски
    this.recreateBoardDOM();
    
    renderBoard();
    updateHUD();
  },
  
  recreateBoardDOM() {
    const boardEl = document.getElementById("board");
    if (!boardEl) return;
    
    boardEl.innerHTML = "";
    cells = [];
    
    for (let y = 0; y < SIZE; y++) {
      cells[y] = [];
      for (let x = 0; x < SIZE; x++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.x = x;
        cell.dataset.y = y;
        
        if (board[y] && board[y][x] !== undefined) {
          setColor(cell, board[y][x]);
        }
        
        setupCrossPlatformInput(cell, x, y);
        
        boardEl.appendChild(cell);
        cells[y][x] = cell;
      }
    }
    
    console.log('🔄 Board DOM recreated for tutorial');
  },
  
  highlightTargetCells() {
    if (!this.currentTutorial) return;
    
    TutorialOverlay.clearHighlights();
    
    const allowedMoves = TutorialBoards.getAllowedMoves(this.currentTutorial.board);
    const cellsToHighlight = [];
    
    allowedMoves.forEach(move => {
      if (cells[move.from.y] && cells[move.from.y][move.from.x]) {
        cellsToHighlight.push(cells[move.from.y][move.from.x]);
      }
      if (cells[move.to.y] && cells[move.to.y][move.to.x]) {
        cellsToHighlight.push(cells[move.to.y][move.to.x]);
      }
    });
    
    if (cellsToHighlight.length > 0) {
      TutorialOverlay.highlightCells(cellsToHighlight, true);
      console.log('✨ Highlighted', cellsToHighlight.length, 'cells for tutorial');
    }
  },
  
  dimOtherCells() {
    if (!this.currentTutorial) return;
    
    const allowedMoves = TutorialBoards.getAllowedMoves(this.currentTutorial.board);
    const keepCellElements = [];
    
    allowedMoves.forEach(move => {
      if (cells[move.from.y] && cells[move.from.y][move.from.x]) {
        keepCellElements.push(cells[move.from.y][move.from.x]);
      }
      if (cells[move.to.y] && cells[move.to.y][move.to.x]) {
        keepCellElements.push(cells[move.to.y][move.to.x]);
      }
    });
    
    TutorialOverlay.dimOtherCells(keepCellElements);
  },
  
  getTargetCellElements() {
    const allowedMoves = TutorialBoards.getAllowedMoves(this.currentTutorial.board);
    const cellElements = [];
    
    allowedMoves.forEach(move => {
      if (cells[move.from.y] && cells[move.from.y][move.from.x]) {
        cellElements.push(cells[move.from.y][move.from.x]);
      }
      if (cells[move.to.y] && cells[move.to.y][move.to.x]) {
        cellElements.push(cells[move.to.y][move.to.x]);
      }
    });
    
    return cellElements;
  },
  
  startHints() {
    // Очищаем предыдущие таймеры
    this.stopHints();
    
    console.log('💡 Starting tutorial hints...');
    
    // Первая подсказка через 5 секунд
    this.hintTimer = setTimeout(() => {
      if (!this.isActive) return;
      console.log('💡 Showing first hint...');
      this.showFirstHint();
    }, 5000);
  },
  
  showFirstHint() {
    if (!this.isActive) return;
    
    const targetMove = TutorialBoards.getTargetMove(this.currentTutorial.board);
    if (!targetMove) return;
    
    // Показываем анимацию на клетках
    const fromCell = cells[targetMove.from.y]?.[targetMove.from.x];
    const toCell = cells[targetMove.to.y]?.[targetMove.to.x];
    
    if (fromCell) {
      fromCell.style.animation = 'tutorialPulse 1s ease-in-out infinite';
      console.log('💡 Pulsing from cell:', targetMove.from);
    }
    
    if (toCell) {
      toCell.style.animation = 'tutorialPulse 1s ease-in-out infinite';
      console.log('💡 Pulsing to cell:', targetMove.to);
    }
    
    // Запускаем таймер для Ghost Hand через 5 секунд
    this.ghostHandTimer = setTimeout(() => {
      if (!this.isActive) return;
      console.log('👆 Showing ghost hand...');
      this.showGhostHand();
    }, 5000);
  },
  
  showGhostHand() {
    if (!this.isActive) return;
    
    const targetMove = TutorialBoards.getTargetMove(this.currentTutorial.board);
    if (!targetMove) return;
    
    const fromCell = cells[targetMove.from.y]?.[targetMove.from.x];
    const toCell = cells[targetMove.to.y]?.[targetMove.to.x];
    
    if (fromCell && toCell) {
      GhostHand.startRepeatAnimation(fromCell, toCell, 10000);
      console.log('👆 Ghost hand animation started');
    }
  },
  
  validateMove(from, to) {
    if (!this.isActive || !this.currentTutorial) return { valid: false, message: 'Tutorial not active' };
    
    const allowedMoves = TutorialBoards.getAllowedMoves(this.currentTutorial.board);
    
    const isValid = allowedMoves.some(move => 
      (move.from.x === from.x && move.from.y === from.y &&
       move.to.x === to.x && move.to.y === to.y) ||
      (move.from.x === to.x && move.from.y === to.y &&
       move.to.x === from.x && move.to.y === from.y)
    );
    
    if (!isValid) {
      return {
        valid: false,
        message: `Try combining the highlighted ${this.currentTutorial.title} tiles!`
      };
    }
    
    return { valid: true };
  },
  
  handleWrongMove(cellA, cellB) {
    if (!this.isActive || !this.currentTutorial) return;
    
    console.log('❌ Wrong move in tutorial');
    TutorialStorage.addFailedAttempt(this.currentTutorial.id);
    
    // Анимация неправильного хода
    const cellsToShake = [];
    if (cellA) cellsToShake.push(cellA);
    if (cellB) cellsToShake.push(cellB);
    
    TutorialOverlay.showWrongMoveEffect(cellsToShake);
    
    // Показываем сообщение с подсказкой
    const validation = this.validateMove(
      { x: parseInt(cellA?.dataset?.x) || 0, y: parseInt(cellA?.dataset?.y) || 0 },
      { x: parseInt(cellB?.dataset?.x) || 0, y: parseInt(cellB?.dataset?.y) || 0 }
    );
    
    setTimeout(() => {
      if (!this.isActive) return;
      
      TutorialOverlay.showPopup({
        title: 'Not Quite!',
        description: validation.message || 'Try the highlighted move!',
        icon: '🤔',
        showSkip: false,
        continueText: 'Try Again',
        onContinue: () => {
          TutorialOverlay.hidePopup();
          // Обновляем подсветку
          this.highlightTargetCells();
          this.dimOtherCells();
        }
      });
    }, 500);
  },
  
  handleCorrectMove() {
    if (!this.isActive) return;
    
    console.log('✅ Tutorial completed:', this.currentTutorial.title);
    
    this.stopHints();
    
    // Даем награду
    if (this.currentTutorial.reward) {
      if (this.currentTutorial.reward.coins) {
        addCoins(this.currentTutorial.reward.coins);
        updateCoinsUI();
        console.log('💰 Reward given:', this.currentTutorial.reward.coins, 'coins');
      }
    }
    
    // Отмечаем как завершенный
    TutorialStorage.markCompleted(this.currentTutorial.id);
    
    // Если это было открытие спец-фишки
    if (this.currentTutorial.type === 'discovery') {
      const specialType = this.currentTutorial.trigger.replace('first_create_', '');
      TutorialStorage.setFirstDiscovery(specialType);
    }
    
    // Показываем попап успеха
    setTimeout(() => {
      TutorialOverlay.showPopup({
        title: 'Excellent! 🎉',
        description: `You've mastered ${this.currentTutorial.title}!`,
        icon: '⭐',
        showSkip: false,
        continueText: 'Continue',
        onContinue: () => {
          this.endTutorial();
        }
      });
    }, 1000);
  },
  
  stopHints() {
    if (this.hintTimer) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
    if (this.ghostHandTimer) {
      clearTimeout(this.ghostHandTimer);
      this.ghostHandTimer = null;
    }
    GhostHand.hide();
    
    // Убираем анимации с клеток
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (cells[y] && cells[y][x]) {
          cells[y][x].style.animation = '';
        }
      }
    }
  },
  
  endTutorial() {
    console.log('📚 Ending tutorial');
    
    this.stopHints();
    TutorialOverlay.hideOverlay();
    TutorialOverlay.hidePopup();
    TutorialOverlay.clearHighlights();
    
    // Убираем затемнение со всех клеток
    const allCells = document.querySelectorAll('.cell');
    allCells.forEach(cell => cell.classList.remove('tutorial-dimmed'));
    
    // Восстанавливаем состояние игры
    this.restoreGameState();
    
    this.unlockGame();
    
    this.isActive = false;
    this.currentTutorial = null;
    this.tutorialBoard = null;
    
    // Перезапускаем уровень
    initLevel();
    
    console.log('📚 Tutorial ended, game restored');
  },
  
  skipTutorial() {
    if (!this.currentTutorial) return;
    
    console.log('⏭️ Tutorial skipped:', this.currentTutorial.title);
    
    TutorialStorage.markSkipped(this.currentTutorial.id);
    this.stopHints();
    TutorialOverlay.hideOverlay();
    TutorialOverlay.hidePopup();
    TutorialOverlay.clearHighlights();
    
    // Убираем затемнение со всех клеток
    const allCells = document.querySelectorAll('.cell');
    allCells.forEach(cell => cell.classList.remove('tutorial-dimmed'));
    
    this.restoreGameState();
    this.unlockGame();
    
    this.isActive = false;
    this.currentTutorial = null;
    this.tutorialBoard = null;
    
    initLevel();
    
    console.log('⏭️ Tutorial skipped, game restored');
  },
  
  // Интеграционные методы
  onLevelStart(level) {
    if (!this.isActive) {
      this.checkTriggers('level_start', { level });
    }
  },
  
  onSpecialCreated(specialType) {
    if (!this.isActive) {
      this.checkTriggers('special_created', { specialType });
    }
  },
  
  onSpecialActivated(specialType) {
    if (!this.isActive) {
      this.checkTriggers('special_activated', { specialType });
    }
  },
  
  onComboAvailable(specialA, specialB) {
    if (!this.isActive) {
      this.checkTriggers('combo_available', { specialA, specialB });
    }
  },
  
  isMoveAllowed(fromX, fromY, toX, toY) {
    if (!this.isActive) return true;
    
    const validation = this.validateMove(
      { x: fromX, y: fromY },
      { x: toX, y: toY }
    );
    
    return validation ? validation.valid : true;
  },
  
  destroy() {
    this.stopHints();
    TutorialOverlay.destroy();
    GhostHand.destroy();
    this.isActive = false;
    this.currentTutorial = null;
  }
};
