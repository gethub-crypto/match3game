// tutorial/tutorialManager.js
// ================= TUTORIAL MANAGER =================
// Главный контроллер всей системы туториалов
// Интегрируется с существующим кодом через хуки

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
  ghostHandTimer: null,
  inactivityTimer: null,
  lastInteractionTime: 0,
  
  // Настройки
  config: {
    hintDelay: 5000,        // Первая подсказка через 5 сек
    secondHintDelay: 10000, // Вторая подсказка через 10 сек
    ghostHandDelay: 15000,  // Рука-призрак через 15 сек
    ghostHandRepeat: 10000  // Повтор руки каждые 10 сек
  },

  // ================= ИНИЦИАЛИЗАЦИЯ =================
  init() {
    console.log('🎓 TutorialManager: Initializing...');
    
    // Загружаем конфигурацию туториалов
    this.loadTutorialConfig();
    
    // Вешаем глобальные хуки
    this.installHooks();
    
    // Проверяем, нужно ли показать туториал при старте уровня
    this.checkLevelTriggers();
    
    console.log('✅ TutorialManager: Ready');
  },

  // ================= КОНФИГУРАЦИЯ ТУТОРИАЛОВ =================
  loadTutorialConfig() {
    // Data-driven конфигурация всех туториалов
    this.tutorials = {
      // Уровень 1: Базовый свайп
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
          to: { x: 3, y: 4 }
        },
        onComplete: null
      },

      // Создание ракеты
      create_rocket: {
        id: 'create_rocket',
        type: 'create_special',
        title: 'Создание ракеты 🚀',
        description: 'Собери 4 фишки в ряд, чтобы создать ракету! Ракета очищает целую линию.',
        icon: '🚀',
        trigger: 'first_create_rocket',
        board: 'createRocket',
        reward: { coins: 50 },
        highlightCells: [
          { x: 3, y: 4 },
          { x: 3, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 4 },
          to: { x: 3, y: 3 }
        },
        expectedSpecial: 'rocket',
        onComplete: null
      },

      // Создание бомбы
      create_bomb: {
        id: 'create_bomb',
        type: 'create_special',
        title: 'Создание бомбы 💣',
        description: 'Собери фишки в форме буквы L или T, чтобы создать бомбу! Бомба взрывает область 3×3.',
        icon: '💣',
        trigger: 'first_create_bomb',
        board: 'createBomb',
        reward: { coins: 50 },
        highlightCells: [
          { x: 4, y: 4 },
          { x: 3, y: 4 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 4, y: 4 },
          to: { x: 3, y: 4 }
        },
        expectedSpecial: 'bomb',
        onComplete: null
      },

      // Создание радуги
      create_rainbow: {
        id: 'create_rainbow',
        type: 'create_special',
        title: 'Создание радуги 🌈',
        description: 'Собери 5 фишек в ряд, чтобы создать радугу! Радуга убирает все фишки одного цвета.',
        icon: '🌈',
        trigger: 'first_create_rainbow',
        board: 'createRainbow',
        reward: { coins: 75 },
        highlightCells: [
          { x: 3, y: 4 },
          { x: 3, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 4 },
          to: { x: 3, y: 3 }
        },
        expectedSpecial: 'color',
        onComplete: null
      },

      // Комбо: Ракета + Ракета
      rocket_rocket: {
        id: 'rocket_rocket',
        type: 'combo',
        title: 'Ракета + Ракета ✨',
        description: 'Объедини две ракеты! Они создадут супер-крест, очищающий ряд и колонну одновременно.',
        icon: '🚀🚀',
        trigger: 'first_combo_rocket_rocket',
        board: 'rocketRocket',
        reward: { coins: 100 },
        highlightCells: [
          { x: 3, y: 3 },
          { x: 4, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 }
        },
        expectedCombo: 'rocket_rocket',
        specialA: 'rocket',
        specialB: 'rocket',
        onComplete: null
      },

      // Комбо: Ракета + Бомба
      rocket_bomb: {
        id: 'rocket_bomb',
        type: 'combo',
        title: 'Ракета + Бомба 💥',
        description: 'Объедини ракету и бомбу! Ракета запустит бомбу, создав мощный взрыв.',
        icon: '🚀💣',
        trigger: 'first_combo_rocket_bomb',
        board: 'rocketBomb',
        reward: { coins: 100 },
        highlightCells: [
          { x: 3, y: 3 },
          { x: 4, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 }
        },
        expectedCombo: 'rocket_bomb',
        specialA: 'rocket',
        specialB: 'bomb',
        onComplete: null
      },

      // Комбо: Ракета + Радуга
      rocket_rainbow: {
        id: 'rocket_rainbow',
        type: 'combo',
        title: 'Ракета + Радуга 🎆',
        description: 'Объедини ракету и радугу! Все фишки одного цвета превратятся в ракеты и запустятся!',
        icon: '🚀🌈',
        trigger: 'first_combo_rocket_rainbow',
        board: 'rocketRainbow',
        reward: { coins: 150 },
        highlightCells: [
          { x: 3, y: 3 },
          { x: 4, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 }
        },
        expectedCombo: 'rocket_color',
        specialA: 'rocket',
        specialB: 'color',
        onComplete: null
      },

      // Комбо: Бомба + Бомба
      bomb_bomb: {
        id: 'bomb_bomb',
        type: 'combo',
        title: 'Бомба + Бомба 💣💣',
        description: 'Объедини две бомбы! Мега-взрыв очистит огромную область и запустит дополнительные ракеты!',
        icon: '💣💣',
        trigger: 'first_combo_bomb_bomb',
        board: 'bombBomb',
        reward: { coins: 150 },
        highlightCells: [
          { x: 3, y: 3 },
          { x: 4, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 }
        },
        expectedCombo: 'bomb_bomb',
        specialA: 'bomb',
        specialB: 'bomb',
        onComplete: null
      },

      // Комбо: Бомба + Радуга
      bomb_rainbow: {
        id: 'bomb_rainbow',
        type: 'combo',
        title: 'Бомба + Радуга 🌈💣',
        description: 'Объедини бомбу и радугу! Все фишки одного цвета превратятся в бомбы и взорвутся!',
        icon: '💣🌈',
        trigger: 'first_combo_bomb_rainbow',
        board: 'bombRainbow',
        reward: { coins: 150 },
        highlightCells: [
          { x: 3, y: 3 },
          { x: 4, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 }
        },
        expectedCombo: 'bomb_color',
        specialA: 'bomb',
        specialB: 'color',
        onComplete: null
      },

      // Комбо: Радуга + Радуга
      rainbow_rainbow: {
        id: 'rainbow_rainbow',
        type: 'combo',
        title: 'Радуга + Радуга 🌈🌈',
        description: 'Объедини две радуги! Это очистит ВСЁ поле! Самая мощная комбинация в игре!',
        icon: '🌈🌈',
        trigger: 'first_combo_rainbow_rainbow',
        board: 'rainbowRainbow',
        reward: { coins: 200 },
        highlightCells: [
          { x: 3, y: 3 },
          { x: 4, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 }
        },
        expectedCombo: 'color_color',
        specialA: 'color',
        specialB: 'color',
        onComplete: null
      }
    };
  },

  // ================= ХУКИ В СУЩЕСТВУЮЩИЙ КОД =================
  installHooks() {
    // Хукаем onCellClick для перехвата действий игрока
    const originalOnCellClick = window.onCellClick;
    const self = this;

    window.onCellClick = async function(x, y) {
      // Если туториал активен — проверяем действие
      if (self.isActive) {
        const result = self.validateAction(x, y);
        if (result === 'wrong') {
          self.handleWrongMove(x, y);
          return;
        }
        if (result === 'correct') {
          self.handleCorrectMove(x, y);
          // Продолжаем выполнение — разрешаем оригинальный свайп
        }
      }

      // Вызываем оригинальный обработчик
      if (originalOnCellClick) {
        await originalOnCellClick.call(this, x, y);
      }
    };

    // Хукаем создание спец-фишек
    const originalProcessMatches = window.processMatchesAsync;
    if (originalProcessMatches) {
      window.processMatchesAsync = async function() {
        const result = await originalProcessMatches.call(this);
        
        // Проверяем, создалась ли спец-фишка во время туториала
        if (self.isActive && self.currentTutorial) {
          self.checkSpecialCreated();
        }
        
        return result;
      };
    }

    console.log('🔗 TutorialManager: Hooks installed');
  },

  // ================= ЗАПУСК ТУТОРИАЛА =================
  start(tutorialId) {
    const tutorial = this.tutorials[tutorialId];
    if (!tutorial) {
      console.error(`❌ TutorialManager: Tutorial "${tutorialId}" not found`);
      return;
    }

    // Проверяем, нужно ли показывать
    if (!TutorialStorage.shouldShow(tutorialId)) {
      console.log(`📚 TutorialManager: Tutorial "${tutorialId}" already completed/skipped`);
      return;
    }

    console.log(`🎓 TutorialManager: Starting tutorial "${tutorialId}"`);

    // Сохраняем оригинальное состояние игры
    this.saveGameState();

    // Устанавливаем состояние туториала
    this.isActive = true;
    this.currentTutorial = tutorial;
    this.currentStep = 0;
    
    // Блокируем игровые системы
    this.lockGameSystems();

    // Загружаем обучающую доску
    this.loadTutorialBoard(tutorial);

    // Показываем оверлей и подсветку
    TutorialOverlay.show(tutorial.highlightCells || []);

    // Показываем попап
    TutorialOverlay.showPopup(
      tutorial.title,
      tutorial.description,
      tutorial.icon,
      () => {
        // После нажатия "Продолжить"
        this.onPopupClosed();
      }
    );

    // Аналитика
    TutorialStorage.startAnalytics(tutorialId);
    TutorialAnalytics.track('tutorial_started', { tutorialId });
  },

  // Загрузка обучающей доски
  loadTutorialBoard(tutorial) {
    if (!tutorial.board) return;

    const boardData = TutorialBoards.getBoard(tutorial.id);
    if (!boardData) {
      console.error(`❌ TutorialManager: Failed to load board for "${tutorial.id}"`);
      return;
    }

    // Заменяем текущую доску
    board = JSON.parse(JSON.stringify(boardData.board));
    
    // Сохраняем ожидаемое действие
    this.expectedAction = boardData.targetAction;
    this.expectedMatch = boardData.expectedMatch;
    this.expectedCombo = boardData.expectedCombo;
    this.expectedSpecial = boardData.expectedSpecial;

    // Перерисовываем доску
    renderBoard();
    
    // Отключаем рандомизацию
    this.disableRandomization();
  },

  // После закрытия попапа
  onPopupClosed() {
    // Запускаем таймеры подсказок
    this.startHintTimers();
    
    // Запускаем руку-призрака
    this.scheduleGhostHand();
    
    // Отслеживаем бездействие
    this.lastInteractionTime = Date.now();
    this.startInactivityTimer();
  },

  // ================= ПРОВЕРКА ДЕЙСТВИЙ ИГРОКА =================
  validateAction(x, y) {
    if (!this.isActive || !this.currentTutorial) return 'neutral';

    const target = this.expectedAction || this.currentTutorial.targetAction;
    if (!target) return 'neutral';

    const { from, to } = target;

    // Проверяем, выбрал ли игрок правильную начальную клетку
    if (selected === null) {
      // Игрок только выбирает первую клетку
      if (x === from.x && y === from.y) {
        return 'correct_selection';
      }
      // Проверяем, может это вторая клетка (если первая уже выбрана)
      return 'neutral';
    }

    // Игрок делает свайп
    if (selected.x === from.x && selected.y === from.y && 
        x === to.x && y === to.y) {
      return 'correct';
    }

    // Неправильный свайп
    return 'wrong';
  },

  handleWrongMove(x, y) {
    console.log('❌ TutorialManager: Wrong move');
    
    TutorialStorage.recordFailedAttempt(this.currentTutorial.id);
    TutorialAnalytics.track('wrong_move', { 
      tutorialId: this.currentTutorial.id,
      attemptedX: x,
      attemptedY: y
    });

    // Отменяем выбор
    clearHighlight();
    selected = null;

    // Показываем сообщение
    TutorialOverlay.showWrongMove('Попробуй другой ход! Следуй подсказке.');
    
    // Трясём целевые клетки
    const targetCells = this.currentTutorial.highlightCells || [];
    targetCells.forEach(pos => {
      const cell = cells[pos.y] && cells[pos.y][pos.x];
      if (cell) {
        cell.style.animation = 'none';
        cell.offsetHeight;
        cell.style.animation = 'shakeWrong 0.5s ease';
        setTimeout(() => {
          cell.style.animation = 'tutorialPulse 1.5s ease-in-out infinite';
        }, 500);
      }
    });

    // Сбрасываем таймер бездействия
    this.lastInteractionTime = Date.now();
  },

  async handleCorrectMove(x, y) {
    console.log('✅ TutorialManager: Correct move!');
    
    TutorialAnalytics.track('correct_move', { 
      tutorialId: this.currentTutorial.id 
    });

    // Даём оригинальному коду выполнить свайп...
    // Ждём завершения анимаций
    await delay(1000);

    // Проверяем, выполнен ли туториал
    if (this.checkCompletion()) {
      this.complete();
    }
  },

  checkSpecialCreated() {
    if (!this.isActive || !this.currentTutorial) return;

    // Проверяем, создалась ли ожидаемая спец-фишка
    if (this.currentTutorial.expectedSpecial) {
      const specialType = this.currentTutorial.expectedSpecial;
      
      // Ищем спец-фишку на доске
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const cell = board[y][x];
          if (cell && cell.special === specialType) {
            this.complete();
            return;
          }
        }
      }
    }
  },

  checkCompletion() {
    // Базовая проверка — туториал считается выполненным после правильного свайпа
    return true;
  },

  // ================= ЗАВЕРШЕНИЕ ТУТОРИАЛА =================
  complete() {
    if (!this.isActive || !this.currentTutorial) return;

    const tutorialId = this.currentTutorial.id;
    console.log(`🎉 TutorialManager: Tutorial "${tutorialId}" completed!`);

    // Сохраняем
    TutorialStorage.updateTimeSpent(tutorialId);
    TutorialStorage.markCompleted(tutorialId);
    TutorialAnalytics.track('tutorial_completed', { tutorialId });

    // Выдаём награду
    const reward = TutorialStorage.claimReward(tutorialId);
    if (reward && reward.coins) {
      addCoins(reward.coins);
      updateCoinsUI();
      
      // Показываем награду
      this.showRewardPopup(reward);
    }

    // Очищаем туториал
    this.cleanup();
  },

  skipCurrent() {
    if (!this.currentTutorial) return;

    const tutorialId = this.currentTutorial.id;
    console.log(`⏭️ TutorialManager: Skipping "${tutorialId}"`);

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
        <h3>Туториал пройден!</h3>
        <p>Награда: +${reward.coins} 💰</p>
        <button class="tutorial-btn" onclick="this.parentElement.parentElement.remove()">
          Отлично!
        </button>
      </div>
    `;
    document.body.appendChild(popup);
    
    setTimeout(() => popup.remove(), 5000);
  },

  // ================= ОЧИСТКА И ВОССТАНОВЛЕНИЕ =================
  cleanup() {
    console.log('🧹 TutorialManager: Cleaning up...');

    // Скрываем оверлей
    TutorialOverlay.hide();
    
    // Скрываем руку-призрака
    GhostHand.hide();
    GhostHand.clearHighlights();

    // Очищаем таймеры
    this.clearAllTimers();

    // Разблокируем игровые системы
    this.unlockGameSystems();
    this.restoreGameState();

    // Сбрасываем состояние
    this.isActive = false;
    this.currentTutorial = null;
    this.currentStep = 0;
    this.expectedAction = null;
    this.expectedMatch = null;
    this.expectedCombo = null;
    this.expectedSpecial = null;

    // Failsafe: гарантированно разблокируем ввод
    setTimeout(() => {
      if (this.inputLocked) {
        console.warn('⚠️ TutorialManager: Failsafe unlock triggered');
        this.forceUnlockInput();
      }
    }, 1000);

    console.log('✅ TutorialManager: Cleanup complete');
  },

  forceUnlockInput() {
    this.inputLocked = false;
    gameLocked = false;
    isAnimating = false;
    
    // Восстанавливаем все обработчики
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = cells[y] && cells[y][x];
        if (cell) {
          cell.style.pointerEvents = '';
          cell.style.filter = '';
        }
      }
    }
    
    console.log('🔓 TutorialManager: Input forcefully unlocked');
  },

  // ================= УПРАВЛЕНИЕ БЛОКИРОВКАМИ =================
  saveGameState() {
    this.originalGameLocked = gameLocked;
    this.originalIsAnimating = isAnimating;
  },

  restoreGameState() {
    gameLocked = this.originalGameLocked;
    isAnimating = this.originalIsAnimating;
    this.inputLocked = false;
  },

  lockGameSystems() {
    gameLocked = true;
    this.inputLocked = true;
    
    // Отключаем решаффл
    this.disableRandomization();
    
    // Отключаем обычные подсказки
    clearTimeout(hintTimer);
    clearHints();
  },

  unlockGameSystems() {
    gameLocked = false;
    isAnimating = false;
    this.inputLocked = false;
    
    // Перезапускаем подсказки если нужно
    if (!levelFinished) {
      startHintTimer();
    }
  },

  disableRandomization() {
    // Переопределяем shuffleBoard временно
    window.shuffleBoard = function() {
      console.log('🚫 TutorialManager: Shuffle blocked');
    };
  },

  // ================= ТАЙМЕРЫ ПОДСКАЗОК =================
  startHintTimers() {
    this.clearAllTimers();

    // Первая подсказка через 5 секунд
    this.hintTimer = setTimeout(() => {
      if (this.isActive) {
        this.showFirstHint();
      }
    }, this.config.hintDelay);

    // Вторая подсказка через 10 секунд
    this.secondHintTimer = setTimeout(() => {
      if (this.isActive) {
        this.showSecondHint();
      }
    }, this.config.secondHintDelay);
  },

  showFirstHint() {
    console.log('💡 TutorialManager: First hint');
    // Усиливаем подсветку
    const cells = TutorialOverlay.highlightCells;
    cells.forEach(cell => {
      cell.style.animation = 'tutorialPulseFast 1s ease-in-out infinite';
    });
  },

  showSecondHint() {
    console.log('💡 TutorialManager: Second hint');
    // Показываем текстовую подсказку
    if (this.currentTutorial && this.currentTutorial.targetAction) {
      TutorialOverlay.showWrongMove(
        this.currentTutorial.targetAction.description || 'Сделай этот ход!'
      );
    }
  },

  scheduleGhostHand() {
    this.ghostHandTimer = setTimeout(() => {
      if (this.isActive && this.currentTutorial) {
        this.showGhostHand();
      }
    }, this.config.ghostHandDelay);
  },

  showGhostHand() {
    if (!this.isActive || !this.currentTutorial) return;

    const target = this.expectedAction || this.currentTutorial.targetAction;
    if (!target || !target.from || !target.to) return;

    console.log('👆 TutorialManager: Showing ghost hand');
    
    GhostHand.startRepeat(
      target.from.x, target.from.y,
      target.to.x, target.to.y,
      this.config.ghostHandRepeat
    );
  },

  startInactivityTimer() {
    this.inactivityTimer = setInterval(() => {
      if (!this.isActive) {
        clearInterval(this.inactivityTimer);
        return;
      }

      const now = Date.now();
      const inactiveTime = now - this.lastInteractionTime;

      // Если игрок не действует 15 секунд — показываем руку
      if (inactiveTime >= this.config.ghostHandDelay && !GhostHand.isShowing) {
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

  // ================= ТРИГГЕРЫ =================
  checkLevelTriggers() {
    // Проверяем, нужно ли запустить туториал на этом уровне
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
    if (tutorialId && TutorialStorage.shouldShow(tutorialId)) {
      console.log(`🎯 TutorialManager: Trigger found for level ${currentLevel}`);
      // Запускаем с небольшой задержкой, чтобы уровень успел загрузиться
      setTimeout(() => this.start(tutorialId), 500);
    }
  },

  // ================= ПУБЛИЧНЫЕ МЕТОДЫ =================
  // Перезапустить конкретный туториал (из меню настроек)
  replay(tutorialId) {
    TutorialStorage.resetOne(tutorialId);
    this.start(tutorialId);
  },

  // Сбросить все туториалы
  resetAll() {
    TutorialStorage.resetAll();
    console.log('🔄 TutorialManager: All tutorials reset');
  },

  // Получить список всех туториалов для меню
  getAllTutorials() {
    return Object.values(this.tutorials).map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      icon: t.icon,
      completed: !TutorialStorage.shouldShow(t.id)
    }));
  },

  // Получить статус туториала
  getStatus(tutorialId) {
    return {
      completed: TutorialStorage.getData().completed[tutorialId] || false,
      skipped: TutorialStorage.getData().skipped[tutorialId] || false,
      canReplay: true
    };
  }
};

// ================= ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =================
window.addEventListener('load', () => {
  setTimeout(() => {
    TutorialManager.init();
  }, 100);
});

window.TutorialManager = TutorialManager;
console.log('🎓 TutorialManager: Module loaded');
