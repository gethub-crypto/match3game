// tutorial/tutorialManager.js
// ================= TUTORIAL MANAGER (ПОЛНЫЙ ФАЙЛ) =================
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
  secondHintTimer: null,
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
    
    // НЕ запускаем туториалы сразу — доска ещё не готова
    // Туториалы запускаются через checkLevelTriggers() при старте уровня
    
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
          to: { x: 3, y: 4 },
          description: 'Свайпни красную фишку вверх к другим красным'
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
          to: { x: 3, y: 3 },
          description: 'Свайпни красную фишку, чтобы создать 4 в ряд'
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
          to: { x: 3, y: 4 },
          description: 'Свайпни зелёную фишку для создания L-формы'
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
          to: { x: 3, y: 3 },
          description: 'Свайпни жёлтую фишку, чтобы создать 5 в ряд'
        },
        expectedSpecial: 'color',
        onComplete: null
      },

      // Активация ракеты
      activate_rocket: {
        id: 'activate_rocket',
        type: 'activate_special',
        title: 'Активация ракеты 🚀',
        description: 'Свайпни ракету с любой соседней фишкой, чтобы запустить её! Ракета очистит ряд или колонну.',
        icon: '🚀',
        trigger: 'first_activate_rocket',
        board: 'activateRocket',
        reward: { coins: 30 },
        highlightCells: [
          { x: 3, y: 3 },
          { x: 4, y: 3 }
        ],
        targetAction: {
          type: 'swipe',
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 },
          description: 'Свайпни ракету к соседней фишке чтобы активировать'
        },
        expectedSpecial: 'rocket',
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
          to: { x: 4, y: 3 },
          description: 'Свайпни одну ракету к другой'
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
          to: { x: 4, y: 3 },
          description: 'Свайпни ракету к бомбе'
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
          to: { x: 4, y: 3 },
          description: 'Свайпни ракету к радуге'
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
          to: { x: 4, y: 3 },
          description: 'Свайпни одну бомбу к другой'
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
          to: { x: 4, y: 3 },
          description: 'Свайпни бомбу к радуге'
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
          to: { x: 4, y: 3 },
          description: 'Свайпни одну радугу к другой'
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
    const self = this;

    // Хукаем onCellClick для перехвата действий игрока
    const originalOnCellClick = window.onCellClick;
    
    window.onCellClick = async function(x, y) {
      // Если туториал активен — проверяем действие
      if (self.isActive && self.inputLocked) {
        const targetAction = self.expectedAction || (self.currentTutorial && self.currentTutorial.targetAction);
        
        if (targetAction && targetAction.from && targetAction.to) {
          // Игрок выбирает первую клетку или завершает свайп
          if (selected) {
            // Проверяем правильность свайпа
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
              return;
            }
            // Правильный свайп — продолжаем
          } else {
            // Игрок выбирает первую клетку
            const isStartCell = x === targetAction.from.x && y === targetAction.from.y;
            if (!isStartCell) {
              // Не та стартовая клетка
              self.handleWrongMove(x, y);
              return;
            }
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
      console.log(`📚 TutorialManager: Tutorial "${tutorialId}" already completed/skipped`);
      return false;
    }

    console.log(`🎓 TutorialManager: Starting tutorial "${tutorialId}"`);

    // Проверяем готовность доски
    if (!board || !cells || board.length === 0 || cells.length === 0) {
      console.warn('⚠️ TutorialManager: Board not ready, retrying in 500ms...');
      setTimeout(() => this.start(tutorialId), 500);
      return false;
    }

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
    
    return true;
  },

  // Загрузка обучающей доски
  loadTutorialBoard(tutorial) {
    if (!tutorial.board) return;

    const boardData = TutorialBoards.getBoard(tutorial.id);
    if (!boardData) {
      console.error(`❌ TutorialManager: Failed to load board for "${tutorial.id}"`);
      return;
    }

    // Очищаем текущую доску
    const boardEl = document.getElementById("board");
    if (!boardEl) {
      console.error('❌ TutorialManager: Board element not found');
      return;
    }
    
    boardEl.innerHTML = "";
    
    // Создаём новую доску
    board = [];
    cells = [];
    
    for (let y = 0; y < SIZE; y++) {
      board[y] = [];
      cells[y] = [];
      
      for (let x = 0; x < SIZE; x++) {
        // Копируем значение с обучающей доски
        board[y][x] = boardData.board[y] ? boardData.board[y][x] : null;
        
        // Создаём DOM-элемент
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.x = x;
        cell.dataset.y = y;
        
        // Устанавливаем цвет/спец-фишку
        setColor(cell, board[y][x]);
        
        // Настраиваем ввод
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

    // Отключаем рандомизацию
    this.disableRandomization();
    
    console.log('📋 Tutorial board loaded');
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

  // ================= ОБРАБОТКА ДЕЙСТВИЙ ИГРОКА =================
  handleWrongMove(x, y) {
    console.log('❌ TutorialManager: Wrong move');
    
    TutorialStorage.recordFailedAttempt(this.currentTutorial.id);
    TutorialAnalytics.track('wrong_move', { 
      tutorialId: this.currentTutorial.id,
      attemptedX: x,
      attemptedY: y
    });

    // Показываем сообщение
    const message = this.currentTutorial?.targetAction?.description || 'Попробуй другой ход! Следуй подсказке.';
    TutorialOverlay.showWrongMove(message);
    
    // Трясём целевые клетки
    const targetCells = this.currentTutorial?.highlightCells || [];
    targetCells.forEach(pos => {
      const cell = cells[pos.y] && cells[pos.y][pos.x];
      if (cell) {
        cell.style.animation = 'none';
        cell.offsetHeight; // reflow
        cell.style.animation = 'shakeWrong 0.5s ease';
        setTimeout(() => {
          if (cell) {
            cell.style.animation = 'tutorialPulse 1.5s ease-in-out infinite';
          }
        }, 500);
      }
    });

    // Сбрасываем таймер бездействия
    this.lastInteractionTime = Date.now();
  },

  handleCorrectMove(x, y) {
    console.log('✅ TutorialManager: Correct move!');
    
    TutorialAnalytics.track('correct_move', { 
      tutorialId: this.currentTutorial.id 
    });

    this.lastInteractionTime = Date.now();

    // Завершаем туториал после небольшой задержки
    // чтобы игрок увидел результат
    setTimeout(() => {
      if (this.isActive) {
        this.complete();
      }
    }, 1500);
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
      if (typeof addCoins === 'function') {
        addCoins(reward.coins);
      }
      if (typeof updateCoinsUI === 'function') {
        updateCoinsUI();
      }
      
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
        <h3>Обучение пройдено!</h3>
        <p>Награда: +${reward.coins} 💰</p>
        <button class="tutorial-btn" onclick="this.parentElement.parentElement.remove()">
          Отлично!
        </button>
      </div>
    `;
    document.body.appendChild(popup);
    
    setTimeout(() => {
      if (popup.parentNode) {
        popup.remove();
      }
    }, 5000);
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

    // Failsafe: гарантированно разблокируем ввод через 1 секунду
    setTimeout(() => {
      if (this.inputLocked) {
        console.warn('⚠️ TutorialManager: Failsafe unlock triggered');
        this.forceUnlockInput();
      }
    }, 1000);

    // Перезапускаем обычный уровень
    if (!levelFinished) {
      setTimeout(() => {
        if (!this.isActive && typeof initLevel === 'function') {
          initLevel();
        }
      }, 300);
    }

    console.log('✅ TutorialManager: Cleanup complete');
  },

  forceUnlockInput() {
    this.inputLocked = false;
    gameLocked = false;
    isAnimating = false;
    selected = null;
    clearHighlight();
    
    // Восстанавливаем все обработчики на клетках
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
    
    console.log('🔓 TutorialManager: Input forcefully unlocked');
  },

  // ================= УПРАВЛЕНИЕ БЛОКИРОВКАМИ =================
  saveGameState() {
    this.originalGameLocked = gameLocked || false;
    this.originalIsAnimating = isAnimating || false;
  },

  restoreGameState() {
    gameLocked = this.originalGameLocked;
    isAnimating = this.originalIsAnimating;
    this.inputLocked = false;
  },

  lockGameSystems() {
    gameLocked = true;
    isAnimating = false;
    this.inputLocked = true;
    
    // Отключаем обычные подсказки
    clearTimeout(hintTimer);
    clearHints();
  },

  unlockGameSystems() {
    gameLocked = false;
    isAnimating = false;
    this.inputLocked = false;
    
    // Перезапускаем подсказки если нужно
    if (!levelFinished && typeof startHintTimer === 'function') {
      startHintTimer();
    }
  },

  disableRandomization() {
    // Переопределяем shuffleBoard временно
    window.shuffleBoard = function() {
      console.log('🚫 TutorialManager: Shuffle blocked');
    };
    
    // Сохраняем оригинал если ещё не сохранён
    if (!this.originalShuffleBoard) {
      this.originalShuffleBoard = window.shuffleBoard;
    }
  },

  restoreRandomization() {
    if (this.originalShuffleBoard) {
      window.shuffleBoard = this.originalShuffleBoard;
    }
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
    const highlightedCells = TutorialOverlay.highlightCells;
    if (highlightedCells) {
      highlightedCells.forEach(cell => {
        if (cell) {
          cell.style.animation = 'tutorialPulseFast 1s ease-in-out infinite';
        }
      });
    }
  },

  showSecondHint() {
    console.log('💡 TutorialManager: Second hint');
    // Показываем текстовую подсказку
    if (this.currentTutorial && this.currentTutorial.targetAction) {
      const message = this.currentTutorial.targetAction.description || 'Сделай этот ход!';
      TutorialOverlay.showWrongMove(message);
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
        this.inactivityTimer = null;
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
    if (this.hintTimer) clearTimeout(this.hintTimer);
    if (this.secondHintTimer) clearTimeout(this.secondHintTimer);
    if (this.ghostHandTimer) clearTimeout(this.ghostHandTimer);
    if (this.inactivityTimer) clearInterval(this.inactivityTimer);
    
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
      console.log(`🎯 TutorialManager: Trigger found for level ${currentLevel} — "${tutorialId}"`);
      // Запускаем с задержкой, чтобы уровень успел загрузиться
      setTimeout(() => {
        if (typeof initLevel === 'function') {
          // Сначала инициализируем уровень
          initLevel();
        }
        // Затем запускаем туториал
        setTimeout(() => this.start(tutorialId), 300);
      }, 500);
      return true;
    }
    return false;
  },

  // ================= ПУБЛИЧНЫЕ МЕТОДЫ =================
  // Перезапустить конкретный туториал (из меню настроек)
  replay(tutorialId) {
    TutorialStorage.resetOne(tutorialId);
    
    // Если мы в игре, перезапускаем уровень для туториала
    if (currentLevel && typeof startLevel === 'function') {
      hidePopup();
      // Запускаем туториал после загрузки уровня
      setTimeout(() => this.start(tutorialId), 600);
    } else {
      this.start(tutorialId);
    }
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
    // Проверяем что все нужные модули загружены
    if (typeof TutorialStorage === 'undefined') {
      console.error('❌ TutorialManager: TutorialStorage not loaded!');
      return;
    }
    if (typeof TutorialBoards === 'undefined') {
      console.error('❌ TutorialManager: TutorialBoards not loaded!');
      return;
    }
    if (typeof TutorialOverlay === 'undefined') {
      console.error('❌ TutorialManager: TutorialOverlay not loaded!');
      return;
    }
    if (typeof GhostHand === 'undefined') {
      console.error('❌ TutorialManager: GhostHand not loaded!');
      return;
    }
    if (typeof TutorialAnalytics === 'undefined') {
      console.warn('⚠️ TutorialManager: TutorialAnalytics not loaded (optional)');
    }
    
    TutorialManager.init();
  }, 200);
});

// Экспорт в глобальную область
window.TutorialManager = TutorialManager;
console.log('🎓 TutorialManager: Full module loaded and ready');
