// tutorial/tutorialManager.js
// ================= TUTORIAL MANAGER (FINAL) =================
// Главный контроллер всей системы туториалов

const TutorialManager = {
  // Состояние
  isActive: false,
  currentTutorial: null,
  currentStep: 0,
  steps: [],
  
  // Блокировки
  originalGameLocked: false,
  originalIsAnimating: false,
  inputLocked: false,
  
  // Таймеры
  hintTimer: null,
  secondHintTimer: null,
  ghostHandTimer: null,
  inactivityTimer: null,
  lastInteractionTime: 0,
  
  config: {
    hintDelay: 5000,
    secondHintDelay: 10000,
    ghostHandDelay: 15000,
    ghostHandRepeat: 10000
  },

  // ================= ИНИЦИАЛИЗАЦИЯ =================
  init() {
    console.log('🎓 TutorialManager: Initializing...');
    this.loadTutorialConfig();
    this.installHooks();
    console.log('✅ TutorialManager: Ready');
  },

  // ================= КОНФИГУРАЦИЯ ТУТОРИАЛОВ =================
  loadTutorialConfig() {
    this.tutorials = {
      basic_swipe: {
        id: 'basic_swipe',
        type: 'swipe',
        title: 'Базовый свайп',
        description: 'Свайпай соседние фишки, чтобы собрать 3 одинаковых в ряд!',
        icon: '👆',
        trigger: 'level_1',
        board: 'basicSwipe',
        reward: { coins: 25 },
        highlightCells: [
          { x: 4, y: 4 },
          { x: 3, y: 4 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 4, y: 4 },
          to: { x: 3, y: 4 },
          description: 'Свайпни красную фишку вверх к другим красным'
        }
      },

      create_rocket: {
        id: 'create_rocket',
        type: 'create_special',
        title: 'Создание ракеты 🚀',
        description: 'Собери 4 фишки в ряд, чтобы создать ракету! Ракета очищает целую линию.',
        icon: '🚀',
        trigger: 'level_2',
        board: 'createRocket',
        reward: { coins: 50 },
        highlightCells: [
          { x: 3, y: 4 },
          { x: 3, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 4 },
          to: { x: 3, y: 3 },
          description: 'Свайпни красную фишку, чтобы создать 4 в ряд'
        },
        expectedSpecial: 'rocket'
      },

      create_bomb: {
        id: 'create_bomb',
        type: 'create_special',
        title: 'Создание бомбы 💣',
        description: 'Собери фишки в форме буквы L или T, чтобы создать бомбу!',
        icon: '💣',
        trigger: 'level_3',
        board: 'createBomb',
        reward: { coins: 50 },
        highlightCells: [
          { x: 4, y: 4 },
          { x: 3, y: 4 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 4, y: 4 },
          to: { x: 3, y: 4 },
          description: 'Свайпни зелёную фишку для создания L-формы'
        },
        expectedSpecial: 'bomb'
      },

      create_rainbow: {
        id: 'create_rainbow',
        type: 'create_special',
        title: 'Создание радуги 🌈',
        description: 'Собери 5 фишек в ряд, чтобы создать радугу!',
        icon: '🌈',
        trigger: 'level_4',
        board: 'createRainbow',
        reward: { coins: 75 },
        highlightCells: [
          { x: 3, y: 4 },
          { x: 3, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 4 },
          to: { x: 3, y: 3 },
          description: 'Свайпни жёлтую фишку, чтобы создать 5 в ряд'
        },
        expectedSpecial: 'color'
      },

      rocket_rocket: {
        id: 'rocket_rocket',
        type: 'combo',
        title: 'Ракета + Ракета ✨',
        description: 'Объедини две ракеты! Они создадут супер-крест.',
        icon: '🚀🚀',
        trigger: 'level_5',
        board: 'rocketRocket',
        reward: { coins: 100 },
        highlightCells: [
          { x: 3, y: 3 },
          { x: 4, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 },
          description: 'Свайпни одну ракету к другой'
        },
        expectedCombo: 'rocket_rocket',
        specialA: 'rocket',
        specialB: 'rocket'
      },

      rocket_bomb: {
        id: 'rocket_bomb',
        type: 'combo',
        title: 'Ракета + Бомба 💥',
        description: 'Объедини ракету и бомбу! Мощный взрыв.',
        icon: '🚀💣',
        trigger: 'level_6',
        board: 'rocketBomb',
        reward: { coins: 100 },
        highlightCells: [
          { x: 3, y: 3 },
          { x: 4, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 },
          description: 'Свайпни ракету к бомбе'
        },
        expectedCombo: 'rocket_bomb',
        specialA: 'rocket',
        specialB: 'bomb'
      },

      rocket_rainbow: {
        id: 'rocket_rainbow',
        type: 'combo',
        title: 'Ракета + Радуга 🎆',
        description: 'Все фишки одного цвета станут ракетами!',
        icon: '🚀🌈',
        trigger: 'level_7',
        board: 'rocketRainbow',
        reward: { coins: 150 },
        highlightCells: [
          { x: 3, y: 3 },
          { x: 4, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 },
          description: 'Свайпни ракету к радуге'
        },
        expectedCombo: 'rocket_color',
        specialA: 'rocket',
        specialB: 'color'
      },

      bomb_bomb: {
        id: 'bomb_bomb',
        type: 'combo',
        title: 'Бомба + Бомба 💣💣',
        description: 'Мега-взрыв очистит огромную область!',
        icon: '💣💣',
        trigger: 'level_8',
        board: 'bombBomb',
        reward: { coins: 150 },
        highlightCells: [
          { x: 3, y: 3 },
          { x: 4, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 },
          description: 'Свайпни одну бомбу к другой'
        },
        expectedCombo: 'bomb_bomb',
        specialA: 'bomb',
        specialB: 'bomb'
      },

      bomb_rainbow: {
        id: 'bomb_rainbow',
        type: 'combo',
        title: 'Бомба + Радуга 🌈💣',
        description: 'Все фишки одного цвета станут бомбами!',
        icon: '💣🌈',
        trigger: 'level_9',
        board: 'bombRainbow',
        reward: { coins: 150 },
        highlightCells: [
          { x: 3, y: 3 },
          { x: 4, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 },
          description: 'Свайпни бомбу к радуге'
        },
        expectedCombo: 'bomb_color',
        specialA: 'bomb',
        specialB: 'color'
      },

      rainbow_rainbow: {
        id: 'rainbow_rainbow',
        type: 'combo',
        title: 'Радуга + Радуга 🌈🌈',
        description: 'Очищает ВСЁ поле! Самая мощная комбинация!',
        icon: '🌈🌈',
        trigger: 'level_10',
        board: 'rainbowRainbow',
        reward: { coins: 200 },
        highlightCells: [
          { x: 3, y: 3 },
          { x: 4, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 },
          description: 'Свайпни одну радугу к другой'
        },
        expectedCombo: 'color_color',
        specialA: 'color',
        specialB: 'color'
      }
    };
  },

  // ================= ХУКИ =================
  installHooks() {
    const self = this;

    // Хукаем onCellClick
    const originalOnCellClick = window.onCellClick;
    
    window.onCellClick = async function(x, y) {
      // Если туториал активен и ввод заблокирован — проверяем свайп
      if (self.isActive && self.inputLocked) {
        const targetAction = self.expectedAction || (self.currentTutorial && self.currentTutorial.targetAction);
        
        if (targetAction && targetAction.from && targetAction.to) {
          if (selected) {
            // Завершение свайпа
            const isCorrectSwipe = 
              selected.x === targetAction.from.x && 
              selected.y === targetAction.from.y && 
              x === targetAction.to.x && 
              y === targetAction.to.y;
            
            if (!isCorrectSwipe) {
              // Неправильный свайп
              clearHighlight();
              selected = null;
              self.handleWrongMove(x, y);
              return; // БЛОКИРУЕМ неправильный свайп
            }
            // Правильный свайп — разрешаем
          }
        }
      }

      // Вызываем оригинальный обработчик
      if (originalOnCellClick) {
        await originalOnCellClick.call(this, x, y);
      }
    };

    console.log('🔗 TutorialManager: Hooks installed');
  },

  // ================= ЗАПУСК ТУТОРИАЛА =================
  start(tutorialId) {
    const tutorial = this.tutorials[tutorialId];
    if (!tutorial) {
      console.error(`❌ TutorialManager: Tutorial "${tutorialId}" not found`);
      return false;
    }

    // Проверяем, нужно ли показывать
    if (!TutorialStorage.shouldShow(tutorialId)) {
      console.log(`📚 Tutorial "${tutorialId}" already completed/skipped`);
      return false;
    }

    console.log(`🎓 Starting tutorial: "${tutorialId}"`);

    // Ждём готовности доски
    if (!cells || cells.length === 0) {
      console.warn('⚠️ Board not ready, retrying in 300ms...');
      setTimeout(() => this.start(tutorialId), 300);
      return false;
    }

    this.saveGameState();
    this.isActive = true;
    this.currentTutorial = tutorial;
    this.currentStep = 0;
    this.inputLocked = true;
    
    // Блокируем игру
    gameLocked = true;
    isAnimating = false;
    clearTimeout(hintTimer);
    clearHints();

    // Загружаем обучающую доску
    this.loadTutorialBoard(tutorial);

    // Показываем оверлей и подсветку
    TutorialOverlay.show(tutorial.highlightCells || []);

    // Показываем попап
    TutorialOverlay.showPopup(
      tutorial.title,
      tutorial.description,
      tutorial.icon,
      () => this.onPopupClosed()
    );

    TutorialStorage.startAnalytics(tutorialId);
    TutorialAnalytics.track('tutorial_started', { tutorialId });
    
    return true;
  },

  // ================= ЗАГРУЗКА ДОСКИ =================
  loadTutorialBoard(tutorial) {
    if (!tutorial.board) return;

    const boardData = TutorialBoards.getBoard(tutorial.id);
    if (!boardData || !boardData.board) {
      console.error(`❌ Failed to load board for "${tutorial.id}"`);
      return;
    }

    const boardEl = document.getElementById("board");
    if (!boardEl) {
      console.error('❌ Board element not found');
      return;
    }
    
    // Полностью очищаем доску
    boardEl.innerHTML = "";
    
    // Пересоздаём массивы
    board = [];
    cells = [];
    selected = null;
    clearHighlight();
    
    for (let y = 0; y < SIZE; y++) {
      board[y] = [];
      cells[y] = [];
      
      for (let x = 0; x < SIZE; x++) {
        // Копируем значение с обучающей доски
        const cellData = (boardData.board[y] && boardData.board[y][x] !== undefined) 
          ? boardData.board[y][x] 
          : null;
        
        board[y][x] = cellData;
        
        // Создаём DOM-элемент
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.x = x;
        cell.dataset.y = y;
        
        // Применяем цвет/спец-фишку
        setColor(cell, cellData);
        
        // Настраиваем обработчики ввода
        setupCrossPlatformInput(cell, x, y);
        
        // Добавляем на доску
        boardEl.appendChild(cell);
        cells[y][x] = cell;
      }
    }

    // Сохраняем ожидаемое действие
    this.expectedAction = boardData.targetAction;
    this.expectedMatch = boardData.expectedMatch;
    this.expectedCombo = boardData.expectedCombo;
    this.expectedSpecial = boardData.expectedSpecial;

    // Блокируем шаффл
    const self = this;
    window.shuffleBoard = function() {
      console.log('🚫 Tutorial: Shuffle blocked');
    };
    
    console.log('📋 Tutorial board loaded successfully');
  },

  // ================= ПОСЛЕ ЗАКРЫТИЯ ПОПАПА =================
  onPopupClosed() {
    console.log('🎓 Popup closed, player can now interact');
    
    // Разблокируем ТОЛЬКО целевые клетки
    this.inputLocked = false;
    gameLocked = false;
    
    // Подсвечиваем стартовую клетку
    const target = this.expectedAction || this.currentTutorial?.targetAction;
    if (target && target.from) {
      const startCell = cells[target.from.y] && cells[target.from.y][target.from.x];
      if (startCell) {
        startCell.classList.add('tutorial-highlight');
        startCell.style.animation = 'tutorialPulse 1.5s ease-in-out infinite';
      }
    }
    
    // Запускаем подсказки
    this.startHintTimers();
    this.scheduleGhostHand();
    this.lastInteractionTime = Date.now();
    this.startInactivityTimer();
    
    console.log('🔓 Board unlocked for tutorial interaction');
  },

  // ================= ОБРАБОТКА НЕПРАВИЛЬНОГО ХОДА =================
  handleWrongMove(x, y) {
    console.log('❌ Wrong move at', x, y);
    
    TutorialStorage.recordFailedAttempt(this.currentTutorial?.id);
    TutorialAnalytics.track('wrong_move', { 
      tutorialId: this.currentTutorial?.id,
      attemptedX: x,
      attemptedY: y
    });

    const message = this.currentTutorial?.targetAction?.description || 'Попробуй другой ход!';
    TutorialOverlay.showWrongMove(message);
    
    // Трясём целевые клетки
    const targetCells = this.currentTutorial?.highlightCells || [];
    targetCells.forEach(pos => {
      const cell = cells[pos.y] && cells[pos.y][pos.x];
      if (cell) {
        cell.style.animation = 'none';
        cell.offsetHeight;
        cell.style.animation = 'shakeWrong 0.5s ease';
        setTimeout(() => {
          if (cell) cell.style.animation = 'tutorialPulse 1.5s ease-in-out infinite';
        }, 500);
      }
    });

    this.lastInteractionTime = Date.now();
  },

  // ================= ОБРАБОТКА ПРАВИЛЬНОГО ХОДА =================
  handleCorrectMove(x, y) {
    console.log('✅ Correct move!');
    
    TutorialAnalytics.track('correct_move', { 
      tutorialId: this.currentTutorial?.id 
    });

    this.lastInteractionTime = Date.now();

    // Завершаем туториал
    setTimeout(() => {
      if (this.isActive) this.complete();
    }, 1500);
  },

  // ================= ЗАВЕРШЕНИЕ =================
  complete() {
    if (!this.isActive || !this.currentTutorial) return;

    const tutorialId = this.currentTutorial.id;
    console.log(`🎉 Tutorial "${tutorialId}" completed!`);

    TutorialStorage.updateTimeSpent(tutorialId);
    TutorialStorage.markCompleted(tutorialId);
    TutorialAnalytics.track('tutorial_completed', { tutorialId });

    const reward = TutorialStorage.claimReward(tutorialId);
    if (reward && reward.coins) {
      if (typeof addCoins === 'function') addCoins(reward.coins);
      if (typeof updateCoinsUI === 'function') updateCoinsUI();
      this.showRewardPopup(reward);
    }

    this.cleanup();
  },

  skipCurrent() {
    if (!this.currentTutorial) return;

    const tutorialId = this.currentTutorial.id;
    console.log(`⏭️ Skipping "${tutorialId}"`);

    TutorialStorage.markSkipped(tutorialId);
    TutorialAnalytics.track('tutorial_skipped', { tutorialId });

    this.cleanup();
  },

  showRewardPopup(reward) {
    const popup = document.createElement('div');
    popup.className = 'tutorial-reward-popup';
    popup.innerHTML = `
      <div class="reward-content">
        <div class="reward-icon">🎁</div>
        <h3>Обучение пройдено!</h3>
        <p>Награда: +${reward.coins} 💰</p>
        <button class="tutorial-btn" onclick="this.closest('.tutorial-reward-popup').remove()">
          Отлично!
        </button>
      </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 5000);
  },

  // ================= ОЧИСТКА =================
  cleanup() {
    console.log('🧹 Cleaning up tutorial...');

    TutorialOverlay.hide();
    GhostHand.hide();
    GhostHand.clearHighlights();
    this.clearAllTimers();

    // Разблокируем всё
    this.inputLocked = false;
    gameLocked = false;
    isAnimating = false;
    selected = null;
    clearHighlight();

    // Очищаем стили со всех клеток
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = cells[y] && cells[y][x];
        if (cell) {
          cell.style.pointerEvents = '';
          cell.style.filter = '';
          cell.style.zIndex = '';
          cell.style.boxShadow = '';
          cell.style.animation = '';
          cell.classList.remove('tutorial-highlight', 'ghost-target', 'selected', 'drag-target');
        }
      }
    }

    this.isActive = false;
    this.currentTutorial = null;
    this.currentStep = 0;
    this.expectedAction = null;
    this.expectedMatch = null;
    this.expectedCombo = null;
    this.expectedSpecial = null;

    // Failsafe
    setTimeout(() => {
      if (this.inputLocked) {
        console.warn('⚠️ Failsafe unlock');
        this.inputLocked = false;
        gameLocked = false;
        isAnimating = false;
      }
    }, 1000);

    // Перезапускаем уровень
    if (!levelFinished && typeof initLevel === 'function') {
      setTimeout(() => {
        if (!this.isActive) initLevel();
      }, 400);
    }

    console.log('✅ Tutorial cleanup complete');
  },

  // ================= ТАЙМЕРЫ =================
  startHintTimers() {
    this.clearAllTimers();

    this.hintTimer = setTimeout(() => {
      if (this.isActive) this.showFirstHint();
    }, this.config.hintDelay);

    this.secondHintTimer = setTimeout(() => {
      if (this.isActive) this.showSecondHint();
    }, this.config.secondHintDelay);
  },

  showFirstHint() {
    console.log('💡 First hint');
    const cells = TutorialOverlay.highlightCells;
    if (cells) {
      cells.forEach(cell => {
        if (cell) cell.style.animation = 'tutorialPulseFast 1s ease-in-out infinite';
      });
    }
  },

  showSecondHint() {
    console.log('💡 Second hint');
    if (this.currentTutorial?.targetAction?.description) {
      TutorialOverlay.showWrongMove(this.currentTutorial.targetAction.description);
    }
  },

  scheduleGhostHand() {
    this.ghostHandTimer = setTimeout(() => {
      if (this.isActive && this.currentTutorial) this.showGhostHand();
    }, this.config.ghostHandDelay);
  },

  showGhostHand() {
    const target = this.expectedAction || this.currentTutorial?.targetAction;
    if (target?.from && target?.to) {
      console.log('👆 Showing ghost hand');
      GhostHand.startRepeat(
        target.from.x, target.from.y,
        target.to.x, target.to.y,
        this.config.ghostHandRepeat
      );
    }
  },

  startInactivityTimer() {
    this.inactivityTimer = setInterval(() => {
      if (!this.isActive) {
        clearInterval(this.inactivityTimer);
        this.inactivityTimer = null;
        return;
      }
      if (Date.now() - this.lastInteractionTime >= this.config.ghostHandDelay && !GhostHand.isShowing) {
        this.showGhostHand();
      }
    }, 1000);
  },

  clearAllTimers() {
    clearTimeout(this.hintTimer);
    clearTimeout(this.secondHintTimer);
    clearTimeout(this.ghostHandTimer);
    clearInterval(this.inactivityTimer);
    this.hintTimer = null;
    this.secondHintTimer = null;
    this.ghostHandTimer = null;
    this.inactivityTimer = null;
  },

  // ================= ТРИГГЕРЫ УРОВНЕЙ =================
  checkLevelTriggers() {
    // Сопоставление уровней и туториалов
    const levelTutorials = {
      1: 'basic_swipe',
      2: 'create_rocket',
      3: 'create_bomb',
      4: 'create_rainbow',
      5: 'rocket_rocket',
      6: 'rocket_bomb',
      7: 'rocket_rainbow',
      8: 'bomb_bomb',
      9: 'bomb_rainbow',
      10: 'rainbow_rainbow'
    };

    const tutorialId = levelTutorials[currentLevel];
    
    if (!tutorialId) {
      console.log(`🎓 No tutorial for level ${currentLevel}`);
      return false;
    }
    
    if (!TutorialStorage.shouldShow(tutorialId)) {
      console.log(`🎓 Tutorial "${tutorialId}" already completed — skipping`);
      return false;
    }

    console.log(`🎯 Level ${currentLevel} triggers tutorial: "${tutorialId}"`);
    
    // Запускаем туториал с задержкой
    setTimeout(() => {
      this.start(tutorialId);
    }, 300);
    
    return true;
  },

  // ================= МЕТОДЫ ДЛЯ МЕНЮ =================
  replay(tutorialId) {
    // Сбрасываем статус
    TutorialStorage.resetOne(tutorialId);
    
    // Скрываем меню если открыто
    if (typeof hidePopup === 'function') hidePopup();
    
    // Запускаем туториал
    setTimeout(() => this.start(tutorialId), 500);
  },

  resetAll() {
    TutorialStorage.resetAll();
    console.log('🔄 All tutorials reset');
    if (typeof hidePopup === 'function') hidePopup();
  },

  getAllTutorials() {
    return Object.values(this.tutorials).map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      icon: t.icon,
      completed: !TutorialStorage.shouldShow(t.id)
    }));
  },

  getStatus(tutorialId) {
    return {
      completed: TutorialStorage.getData().completed[tutorialId] || false,
      skipped: TutorialStorage.getData().skipped[tutorialId] || false,
      canReplay: true
    };
  }
};

// ================= БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ =================
window.addEventListener('load', () => {
  setTimeout(() => {
    if (typeof TutorialStorage === 'undefined') {
      console.error('❌ TutorialStorage not loaded');
      return;
    }
    if (typeof TutorialBoards === 'undefined') {
      console.error('❌ TutorialBoards not loaded');
      return;
    }
    if (typeof TutorialOverlay === 'undefined') {
      console.error('❌ TutorialOverlay not loaded');
      return;
    }
    if (typeof GhostHand === 'undefined') {
      console.error('❌ GhostHand not loaded');
      return;
    }
    
    TutorialManager.init();
  }, 300);
});

window.TutorialManager = TutorialManager;
console.log('🎓 TutorialManager: Module loaded');
