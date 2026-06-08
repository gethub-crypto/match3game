// ================= TUTORIAL MANAGER =================
const TutorialManager = {
  isActive: false,
  currentTutorial: null,
  currentStep: 0,
  startTime: null,
  hintTimer: null,
  ghostHandTimer: null,
  tutorialLocked: true,
  
  // Конфигурация всех туториалов
  configs: [
    {
      id: 'swipe_basic',
      type: 'basic',
      title: 'Базовое перемещение',
      description: 'Свайпните фишку, чтобы составить ряд из 3 одинаковых цветов.',
      icon: '👆',
      trigger: { type: 'level', level: 1 },
      reward: { coins: 10 }
    },
    {
      id: 'rocket_create',
      type: 'discovery',
      specialType: 'rocket',
      title: 'Ракета создана!',
      description: 'Ракета очищает целую строку или столбец. Свайпните её в любом направлении.',
      icon: '🚀',
      trigger: { type: 'first_create', special: 'rocket' },
      board: 'rocket_tutorial',
      reward: { coins: 20 }
    },
    {
      id: 'bomb_create',
      type: 'discovery',
      specialType: 'bomb',
      title: 'Бомба создана!',
      description: 'Бомба взрывает область 3×3 вокруг себя. Свайпните её для активации.',
      icon: '💣',
      trigger: { type: 'first_create', special: 'bomb' },
      board: 'bomb_tutorial',
      reward: { coins: 20 }
    },
    {
      id: 'rainbow_create',
      type: 'discovery',
      specialType: 'color',
      title: 'Радуга создана!',
      description: 'Радуга удаляет все фишки одного цвета. Свайпните с фишкой нужного цвета.',
      icon: '🌈',
      trigger: { type: 'first_create', special: 'color' },
      board: 'rainbow_tutorial',
      reward: { coins: 30 }
    },
    {
      id: 'rocket_activate',
      type: 'activation',
      specialType: 'rocket',
      title: 'Активация ракеты',
      description: 'Свайпните ракету в сторону, чтобы очистить ряд или столбец.',
      icon: '🚀',
      trigger: { type: 'first_activate', special: 'rocket' },
      reward: { coins: 15 }
    },
    {
      id: 'bomb_activate',
      type: 'activation',
      specialType: 'bomb',
      title: 'Активация бомбы',
      description: 'Свайпните бомбу для взрыва области 3×3.',
      icon: '💣',
      trigger: { type: 'first_activate', special: 'bomb' },
      reward: { coins: 15 }
    },
    {
      id: 'rainbow_activate',
      type: 'activation',
      specialType: 'color',
      title: 'Активация радуги',
      description: 'Свайпните радугу с фишкой, цвет которой хотите удалить.',
      icon: '🌈',
      trigger: { type: 'first_activate', special: 'color' },
      reward: { coins: 20 }
    },
    {
      id: 'rocket_rocket_combo',
      type: 'combo',
      specialA: 'rocket',
      specialB: 'rocket',
      title: 'Ракета + Ракета',
      description: 'Объедините две ракеты для мощного крестового удара!',
      icon: '✚',
      trigger: { type: 'first_combo', comboKey: 'rocket_rocket' },
      board: 'rocket_rocket_tutorial',
      reward: { coins: 50 }
    },
    {
      id: 'rocket_bomb_combo',
      type: 'combo',
      specialA: 'rocket',
      specialB: 'bomb',
      title: 'Ракета + Бомба',
      description: 'Объедините ракету и бомбу для последовательной мощной атаки!',
      icon: '⚡',
      trigger: { type: 'first_combo', comboKey: 'bomb_rocket' },
      board: 'rocket_bomb_tutorial',
      reward: { coins: 50 }
    },
    {
      id: 'rocket_rainbow_combo',
      type: 'combo',
      specialA: 'rocket',
      specialB: 'color',
      title: 'Ракета + Радуга',
      description: 'Все фишки выбранного цвета превратятся в ракеты!',
      icon: '✨',
      trigger: { type: 'first_combo', comboKey: 'color_rocket' },
      board: 'rocket_rainbow_tutorial',
      reward: { coins: 75 }
    },
    {
      id: 'bomb_bomb_combo',
      type: 'combo',
      specialA: 'bomb',
      specialB: 'bomb',
      title: 'Бомба + Бомба',
      description: 'Создайте Мега-бомбу с огромным радиусом взрыва 5×5!',
      icon: '💥',
      trigger: { type: 'first_combo', comboKey: 'bomb_bomb' },
      board: 'bomb_bomb_tutorial',
      reward: { coins: 75 }
    },
    {
      id: 'bomb_rainbow_combo',
      type: 'combo',
      specialA: 'bomb',
      specialB: 'color',
      title: 'Бомба + Радуга',
      description: 'Все фишки выбранного цвета станут бомбами!',
      icon: '🎆',
      trigger: { type: 'first_combo', comboKey: 'bomb_color' },
      board: 'bomb_rainbow_tutorial',
      reward: { coins: 100 }
    },
    {
      id: 'rainbow_rainbow_combo',
      type: 'combo',
      specialA: 'color',
      specialB: 'color',
      title: 'Радуга + Радуга',
      description: 'Полная очистка всего игрового поля!',
      icon: '🌟',
      trigger: { type: 'first_combo', comboKey: 'color_color' },
      board: 'rainbow_rainbow_tutorial',
      reward: { coins: 150 }
    }
  ],
  
  init() {
    TutorialStorage.init();
    GhostHand.init();
    TutorialOverlay.init();
    
    // Проверяем туториалы при старте уровня
    this.checkLevelTutorials();
  },
  
  async checkLevelTutorials() {
    const levelTutorial = this.configs.find(c => 
      c.trigger?.type === 'level' && 
      c.trigger.level === currentLevel &&
      !TutorialStorage.isCompleted(c.id) &&
      !TutorialStorage.isSkipped(c.id)
    );
    
    if (levelTutorial) {
      await this.startTutorial(levelTutorial);
    }
  },
  
  async checkDiscoveryTutorial(specialType) {
    const tutorial = this.configs.find(c => 
      c.trigger?.type === 'first_create' && 
      c.trigger.special === specialType &&
      !TutorialStorage.isCompleted(c.id) &&
      !TutorialStorage.isSkipped(c.id)
    );
    
    if (tutorial) {
      await this.startTutorial(tutorial);
    }
  },
  
  async checkComboTutorial(comboKey) {
    const tutorial = this.configs.find(c => 
      c.trigger?.type === 'first_combo' && 
      c.trigger.comboKey === comboKey &&
      !TutorialStorage.isCompleted(c.id) &&
      !TutorialStorage.isSkipped(c.id)
    );
    
    if (tutorial) {
      await this.startTutorial(tutorial);
    }
  },
  
  async checkActivationTutorial(specialType) {
    const tutorial = this.configs.find(c => 
      c.trigger?.type === 'first_activate' && 
      c.trigger.special === specialType &&
      !TutorialStorage.isCompleted(c.id) &&
      !TutorialStorage.isSkipped(c.id)
    );
    
    if (tutorial) {
      await this.startTutorial(tutorial);
    }
  },
  
  async startTutorial(config) {
    if (this.isActive) return;
    
    this.isActive = true;
    this.currentTutorial = config;
    this.currentStep = 0;
    this.startTime = Date.now();
    this.tutorialLocked = true;
    
    TutorialStorage.markShown(config.id);
    TutorialStorage.trackEvent('tutorial_started', config.id);
    
    // Показать попап
    const action = await TutorialOverlay.showPopup({
      title: config.title,
      description: config.description,
      icon: config.icon,
      reward: config.reward
    });
    
    if (action === 'skip') {
      TutorialStorage.markSkipped(config.id);
      this.endTutorial(false);
      return;
    }
    
    // Блокируем игру
    gameLocked = true;
    
    // Загружаем специальную доску если есть
    if (config.board) {
      await this.loadTutorialBoard(config.board);
    }
    
    // Настраиваем визуальные подсказки
    this.setupVisualGuidance(config);
    
    // Запускаем систему подсказок
    this.startHintSystem(config);
  },
  
  async loadTutorialBoard(boardId) {
    const boardData = TutorialBoards.getBoard(boardId);
    if (!boardData) return;
    
    // Сохраняем текущее состояние
    const originalBoard = JSON.parse(JSON.stringify(board));
    
    // Загружаем предопределенную доску
    const newBoard = TutorialBoards.fillEmpty(JSON.parse(JSON.stringify(boardData.board)));
    
    board = newBoard;
    renderBoard();
    
    // Сохраняем оригинальную доску для восстановления
    this._originalBoard = originalBoard;
    this._boardData = boardData;
  },
  
  setupVisualGuidance(config) {
    TutorialOverlay.showDim();
    TutorialOverlay.clearHighlights();
    TutorialOverlay.clearDimAll();
    
    if (config.board && this._boardData) {
      const boardData = this._boardData;
      let highlightPositions = [];
      
      if (boardData.rocketPosition) {
        highlightPositions.push(boardData.rocketPosition);
      }
      if (boardData.bombPosition) {
        highlightPositions.push(boardData.bombPosition);
      }
      if (boardData.rainbowPosition) {
        highlightPositions.push(boardData.rainbowPosition);
      }
      if (boardData.comboPositions) {
        highlightPositions = highlightPositions.concat(boardData.comboPositions);
      }
      
      if (highlightPositions.length > 0) {
        TutorialOverlay.highlightCells(highlightPositions);
        TutorialOverlay.dimAllExcept(highlightPositions);
      }
    }
  },
  
  startHintSystem(config) {
    // Первая подсказка через 5 секунд
    this.hintTimer = setTimeout(() => {
      this.showFirstHint(config);
    }, 5000);
  },
  
  showFirstHint(config) {
    // Подсвечиваем нужные клетки еще ярче
    const highlighted = document.querySelectorAll('.tutorial-highlight-cell');
    highlighted.forEach(cell => {
      cell.classList.add('tutorial-hint-flash');
    });
    
    // Запускаем Ghost Hand через 10 секунд
    this.ghostHandTimer = setTimeout(() => {
      this.showGhostHand(config);
    }, 10000);
  },
  
  showGhostHand(config) {
    const boardData = this._boardData;
    if (!boardData) return;
    
    let fromX, fromY, toX, toY;
    
    if (boardData.swipeDirection) {
      fromX = boardData.swipeDirection.from;
      toX = boardData.swipeDirection.to;
      fromY = boardData.swipeDirection.y;
      toY = boardData.swipeDirection.y;
    } else if (boardData.swipeTargets && boardData.swipeTargets.length > 0) {
      const target = boardData.swipeTargets[0];
      if (boardData.rocketPosition) {
        fromX = boardData.rocketPosition.x;
        fromY = boardData.rocketPosition.y;
      } else if (boardData.bombPosition) {
        fromX = boardData.bombPosition.x;
        fromY = boardData.bombPosition.y;
      } else if (boardData.rainbowPosition) {
        fromX = boardData.rainbowPosition.x;
        fromY = boardData.rainbowPosition.y;
      }
      toX = target.x;
      toY = target.y;
    }
    
    if (fromX !== undefined && toX !== undefined) {
      GhostHand.startLoop(fromX, fromY, toX, toY);
    }
  },
  
  // Вызывается при попытке игрока сделать ход
  validateMove(fromX, fromY, toX, toY) {
    if (!this.isActive || !this.tutorialLocked) return true;
    
    const config = this.currentTutorial;
    const boardData = this._boardData;
    
    if (!boardData) return false;
    
    let isValid = false;
    
    // Проверяем правильность хода
    if (boardData.swipeDirection) {
      isValid = (fromX === boardData.swipeDirection.from && 
                 toX === boardData.swipeDirection.to &&
                 fromY === boardData.swipeDirection.y &&
                 toY === boardData.swipeDirection.y);
    }
    
    if (boardData.swipeTargets) {
      isValid = boardData.swipeTargets.some(target => {
        return toX === target.x && toY === target.y;
      });
    }
    
    if (!isValid) {
      this.handleWrongMove(fromX, fromY, config);
    }
    
    return isValid;
  },
  
  handleWrongMove(x, y, config) {
    TutorialStorage.addFailedAttempt(config.id);
    TutorialOverlay.shakeCell(x, y);
    TutorialOverlay.showWrongMovePopup(
      config.wrongMoveMessage || 'Попробуйте переместить выделенную фишку!'
    );
  },
  
  // Вызывается при успешном выполнении действия
  onCorrectAction() {
    if (!this.isActive) return;
    
    GhostHand.stopLoop();
    clearTimeout(this.hintTimer);
    clearTimeout(this.ghostHandTimer);
    
    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    TutorialStorage.addTimeSpent(this.currentTutorial.id, timeSpent);
    TutorialStorage.markCompleted(this.currentTutorial.id);
    
    // Выдать награду
    if (this.currentTutorial.reward?.coins) {
      addCoins(this.currentTutorial.reward.coins);
      updateCoinsUI();
    }
    
    // Показать попап завершения
    this.showCompletion();
  },
  
  async showCompletion() {
    gameLocked = true;
    
    await TutorialOverlay.showCompletionPopup({
      completionMessage: `Вы освоили "${this.currentTutorial.title}"!`,
      reward: this.currentTutorial.reward
    });
    
    this.endTutorial(true);
  },
  
  endTutorial(completed) {
    this.isActive = false;
    this.currentTutorial = null;
    this.tutorialLocked = false;
    
    GhostHand.stopLoop();
    clearTimeout(this.hintTimer);
    clearTimeout(this.ghostHandTimer);
    
    TutorialOverlay.hideDim();
    TutorialOverlay.clearHighlights();
    TutorialOverlay.clearDimAll();
    
    // Восстанавливаем оригинальную доску если была заменена
    if (this._originalBoard) {
      board = this._originalBoard;
      renderBoard();
      this._originalBoard = null;
      this._boardData = null;
    }
    
    gameLocked = false;
    updateHUD();
  },
  
  // Интеграция с onCellClick
  onCellClickHook(x, y) {
    if (!this.isActive) return true;
    
    if (selected) {
      const isValid = this.validateMove(selected.x, selected.y, x, y);
      if (isValid) {
        // Разрешаем ход
        this.tutorialLocked = false;
        setTimeout(() => this.onCorrectAction(), 1000);
        return true;
      }
      return false;
    }
    
    return true;
  },
  
  // Интеграция с созданием спец-фишек
  onSpecialCreated(specialType, x, y) {
    this.checkDiscoveryTutorial(specialType);
  },
  
  // Интеграция с активацией спец-фишек
  onSpecialActivated(specialType) {
    this.checkActivationTutorial(specialType);
  },
  
  // Интеграция с комбо
  onComboActivated(comboKey) {
    this.checkComboTutorial(comboKey);
  },
  
  // Ручной запуск туториала
  replayTutorial(tutorialId) {
    TutorialStorage.resetTutorial(tutorialId);
    const config = this.configs.find(c => c.id === tutorialId);
    if (config) {
      this.startTutorial(config);
    }
  },
  
  // Получить список всех туториалов для меню
  getAllTutorials() {
    return this.configs.map(c => ({
      ...c,
      completed: TutorialStorage.isCompleted(c.id),
      skipped: TutorialStorage.isSkipped(c.id)
    }));
  }
};
