// tutorial/tutorialManager.js
// ================= TUTORIAL MANAGER (FIXED v5) =================

const TutorialManager = {
  isActive: false,
  currentTutorial: null,
  waitingForCorrectMove: false,
  
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

  init() {
    console.log('🎓 TutorialManager: Initializing...');
    this.loadTutorialConfig();
    this.installHooks();
    console.log('✅ TutorialManager: Ready');
  },

  loadTutorialConfig() {
    this.tutorials = {
      basic_swipe: {
        id: 'basic_swipe', type: 'swipe', title: 'Базовый свайп',
        description: 'Свайпай соседние фишки, чтобы собрать 3 одинаковых в ряд!',
        icon: '👆', trigger: 'level_1', board: 'basicSwipe', reward: { coins: 25 },
        highlightCells: [{ x: 4, y: 4 }, { x: 3, y: 4 }],
        targetAction: { type: 'swipe', from: { x: 4, y: 4 }, to: { x: 3, y: 4 }, description: 'Свайпни красную фишку вверх' }
      },
      create_rocket: {
        id: 'create_rocket', type: 'create_special', title: 'Создание ракеты 🚀',
        description: 'Собери 4 фишки в ряд, чтобы создать ракету!',
        icon: '🚀', trigger: 'level_2', board: 'createRocket', reward: { coins: 50 },
        highlightCells: [{ x: 3, y: 4 }, { x: 3, y: 3 }],
        targetAction: { type: 'swipe', from: { x: 3, y: 4 }, to: { x: 3, y: 3 }, description: 'Свайпни красную фишку вверх' },
        expectedSpecial: 'rocket'
      },
      create_bomb: {
        id: 'create_bomb', type: 'create_special', title: 'Создание бомбы 💣',
        description: 'Собери фишки L или T формы, чтобы создать бомбу!',
        icon: '💣', trigger: 'level_3', board: 'createBomb', reward: { coins: 50 },
        highlightCells: [{ x: 4, y: 4 }, { x: 3, y: 4 }],
        targetAction: { type: 'swipe', from: { x: 4, y: 4 }, to: { x: 3, y: 4 }, description: 'Свайпни зелёную фишку влево' },
        expectedSpecial: 'bomb'
      },
      create_rainbow: {
        id: 'create_rainbow', type: 'create_special', title: 'Создание радуги 🌈',
        description: 'Собери 5 фишек в ряд, чтобы создать радугу!',
        icon: '🌈', trigger: 'level_4', board: 'createRainbow', reward: { coins: 75 },
        highlightCells: [{ x: 3, y: 4 }, { x: 3, y: 3 }],
        targetAction: { type: 'swipe', from: { x: 3, y: 4 }, to: { x: 3, y: 3 }, description: 'Свайпни жёлтую фишку вверх' },
        expectedSpecial: 'color'
      },
      rocket_rocket: {
        id: 'rocket_rocket', type: 'combo', title: 'Ракета + Ракета ✨',
        description: 'Объедини две ракеты! Супер-крест очистит ряд и колонну.',
        icon: '🚀🚀', trigger: 'level_5', board: 'rocketRocket', reward: { coins: 100 },
        highlightCells: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
        targetAction: { type: 'swipe', from: { x: 3, y: 3 }, to: { x: 4, y: 3 }, description: 'Свайпни ракету к ракете' },
        expectedCombo: 'rocket_rocket', specialA: 'rocket', specialB: 'rocket'
      },
      rocket_bomb: {
        id: 'rocket_bomb', type: 'combo', title: 'Ракета + Бомба 💥',
        description: 'Объедини ракету и бомбу! Мощный взрыв.',
        icon: '🚀💣', trigger: 'level_6', board: 'rocketBomb', reward: { coins: 100 },
        highlightCells: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
        targetAction: { type: 'swipe', from: { x: 3, y: 3 }, to: { x: 4, y: 3 }, description: 'Свайпни ракету к бомбе' },
        expectedCombo: 'rocket_bomb', specialA: 'rocket', specialB: 'bomb'
      },
      rocket_rainbow: {
        id: 'rocket_rainbow', type: 'combo', title: 'Ракета + Радуга 🎆',
        description: 'Все фишки одного цвета станут ракетами!',
        icon: '🚀🌈', trigger: 'level_7', board: 'rocketRainbow', reward: { coins: 150 },
        highlightCells: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
        targetAction: { type: 'swipe', from: { x: 3, y: 3 }, to: { x: 4, y: 3 }, description: 'Свайпни ракету к радуге' },
        expectedCombo: 'rocket_rainbow', specialA: 'rocket', specialB: 'color'
      },
      bomb_bomb: {
        id: 'bomb_bomb', type: 'combo', title: 'Бомба + Бомба 💣💣',
        description: 'Мега-взрыв очистит огромную область!',
        icon: '💣💣', trigger: 'level_8', board: 'bombBomb', reward: { coins: 150 },
        highlightCells: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
        targetAction: { type: 'swipe', from: { x: 3, y: 3 }, to: { x: 4, y: 3 }, description: 'Свайпни бомбу к бомбе' },
        expectedCombo: 'bomb_bomb', specialA: 'bomb', specialB: 'bomb'
      },
      bomb_rainbow: {
        id: 'bomb_rainbow', type: 'combo', title: 'Бомба + Радуга 🌈💣',
        description: 'Все фишки одного цвета станут бомбами!',
        icon: '💣🌈', trigger: 'level_9', board: 'bombRainbow', reward: { coins: 150 },
        highlightCells: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
        targetAction: { type: 'swipe', from: { x: 3, y: 3 }, to: { x: 4, y: 3 }, description: 'Свайпни бомбу к радуге' },
        expectedCombo: 'bomb_rainbow', specialA: 'bomb', specialB: 'color'
      },
      rainbow_rainbow: {
        id: 'rainbow_rainbow', type: 'combo', title: 'Радуга + Радуга 🌈🌈',
        description: 'Очищает ВСЁ поле! Самая мощная комбинация!',
        icon: '🌈🌈', trigger: 'level_10', board: 'rainbowRainbow', reward: { coins: 200 },
        highlightCells: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
        targetAction: { type: 'swipe', from: { x: 3, y: 3 }, to: { x: 4, y: 3 }, description: 'Свайпни радугу к радуге' },
        expectedCombo: 'rainbow_rainbow', specialA: 'color', specialB: 'color'
      }
    };
  },

  // ================= ХУКИ =================
  installHooks() {
    const self = this;
    const originalOnCellClick = window.onCellClick;
    
    window.onCellClick = async function(x, y) {
      if (self.isActive && self.waitingForCorrectMove) {
        const target = self.expectedAction || self.currentTutorial?.targetAction;
        
        if (target && target.from && target.to) {
          if (!selected) {
            if (x !== target.from.x || y !== target.from.y) {
              self.handleWrongMove(x, y);
              return;
            }
          } else {
            if (selected.x !== target.from.x || selected.y !== target.from.y ||
                x !== target.to.x || y !== target.to.y) {
              clearHighlight();
              selected = null;
              self.handleWrongMove(x, y);
              return;
            }
          }
        }
      }

      if (originalOnCellClick) {
        await originalOnCellClick.call(this, x, y);
      }
    };

    console.log('🔗 Hooks installed');
  },

  // ================= ЗАПУСК =================
  start(tutorialId) {
    const tutorial = this.tutorials[tutorialId];
    if (!tutorial) {
      console.error(`❌ Tutorial "${tutorialId}" not found`);
      return false;
    }

    if (!TutorialStorage.shouldShow(tutorialId)) {
      console.log(`📚 "${tutorialId}" already done`);
      return false;
    }

    // Проверяем что мы на игровом экране и доска существует
    const boardEl = document.getElementById("board");
    if (!boardEl || !cells || cells.length === 0) {
      console.warn('⚠️ Not on game screen — cannot start tutorial');
      return false;
    }

    console.log(`🎓 Starting: "${tutorialId}"`);

    this.isActive = true;
    this.currentTutorial = tutorial;
    this.waitingForCorrectMove = false;
    
    gameLocked = true;
    isAnimating = false;
    clearTimeout(hintTimer);
    clearHints();

    this.loadTutorialBoard(tutorial);
    TutorialOverlay.show(tutorial.highlightCells || []);

    TutorialOverlay.showPopup(
      tutorial.title,
      tutorial.description,
      tutorial.icon,
      () => this.onPopupClosed()
    );

    TutorialStorage.startAnalytics(tutorialId);
    if (typeof TutorialAnalytics !== 'undefined') {
      TutorialAnalytics.track('tutorial_started', { tutorialId });
    }
    
    return true;
  },

  loadTutorialBoard(tutorial) {
    if (!tutorial.board) return;

    const boardData = TutorialBoards.getBoard(tutorial.id);
    if (!boardData || !boardData.board) {
      console.error(`❌ No board for "${tutorial.id}"`);
      return;
    }

    const boardEl = document.getElementById("board");
    if (!boardEl) return;
    
    boardEl.innerHTML = "";
    board = [];
    cells = [];
    selected = null;
    clearHighlight();
    
    for (let y = 0; y < SIZE; y++) {
      board[y] = [];
      cells[y] = [];
      
      for (let x = 0; x < SIZE; x++) {
        const cellData = (boardData.board[y] && boardData.board[y][x] !== undefined) 
          ? boardData.board[y][x] : COLORS[Math.floor(Math.random() * COLORS.length)];
        
        board[y][x] = cellData;
        
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.x = x;
        cell.dataset.y = y;
        
        setColor(cell, cellData);
        setupCrossPlatformInput(cell, x, y);
        
        boardEl.appendChild(cell);
        cells[y][x] = cell;
      }
    }

    this.expectedAction = boardData.targetAction || tutorial.targetAction;
    this.expectedMatch = boardData.expectedMatch;
    this.expectedCombo = boardData.expectedCombo || tutorial.expectedCombo;
    this.expectedSpecial = boardData.expectedSpecial || tutorial.expectedSpecial;

    window.shuffleBoard = function() {
      console.log('🚫 Shuffle blocked');
    };
    
    console.log('📋 Board loaded');
  },

  onPopupClosed() {
    console.log('🎓 Waiting for correct move');
    this.waitingForCorrectMove = true;
    gameLocked = false;
    this.startHintTimers();
    this.scheduleGhostHand();
    this.lastInteractionTime = Date.now();
    this.startInactivityTimer();
  },

  handleWrongMove(x, y) {
    if (this.currentTutorial) {
      TutorialStorage.recordFailedAttempt(this.currentTutorial.id);
    }
    TutorialOverlay.showWrongMove(
      this.currentTutorial?.targetAction?.description || 'Попробуй другой ход!'
    );
    this.lastInteractionTime = Date.now();
  },

  handleCorrectMove(x, y) {
    this.lastInteractionTime = Date.now();
    setTimeout(() => {
      if (this.isActive) this.complete();
    }, 1500);
  },

  complete() {
    if (!this.isActive || !this.currentTutorial) return;

    const tutorialId = this.currentTutorial.id;
    console.log(`🎉 Completed: "${tutorialId}"`);

    TutorialStorage.updateTimeSpent(tutorialId);
    TutorialStorage.markCompleted(tutorialId);

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
    TutorialStorage.markSkipped(this.currentTutorial.id);
    this.cleanup();
  },

  showRewardPopup(reward) {
    const popup = document.createElement('div');
    popup.className = 'tutorial-reward-popup';
    popup.innerHTML = `
      <div class="reward-content">
        <div class="reward-icon">🎁</div>
        <h3>Обучение пройдено!</h3>
        <p>+${reward.coins} 💰</p>
        <button class="tutorial-btn" onclick="this.closest('.tutorial-reward-popup').remove()">Отлично!</button>
      </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 5000);
  },

  cleanup() {
    console.log('🧹 Cleanup');

    TutorialOverlay.hide();
    GhostHand.hide();
    GhostHand.clearHighlights();
    this.clearAllTimers();

    this.waitingForCorrectMove = false;
    this.isActive = false;
    gameLocked = false;
    isAnimating = false;
    selected = null;
    clearHighlight();

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

    this.currentTutorial = null;
    this.expectedAction = null;
    this.expectedMatch = null;
    this.expectedCombo = null;
    this.expectedSpecial = null;

    // Перезапускаем уровень
    if (typeof currentLevel !== 'undefined' && !levelFinished && typeof initLevel === 'function') {
      setTimeout(() => initLevel(), 400);
    }

    console.log('✅ Cleanup done');
  },

  startHintTimers() {
    this.clearAllTimers();
    this.hintTimer = setTimeout(() => {
      if (this.isActive) {
        const hc = TutorialOverlay.highlightCells;
        if (hc) hc.forEach(c => { if (c) c.style.animation = 'tutorialPulseFast 1s ease-in-out infinite'; });
      }
    }, this.config.hintDelay);
    this.secondHintTimer = setTimeout(() => {
      if (this.isActive && this.currentTutorial?.targetAction?.description) {
        TutorialOverlay.showWrongMove(this.currentTutorial.targetAction.description);
      }
    }, this.config.secondHintDelay);
  },

  scheduleGhostHand() {
    this.ghostHandTimer = setTimeout(() => {
      if (this.isActive && this.waitingForCorrectMove) {
        const t = this.expectedAction || this.currentTutorial?.targetAction;
        if (t?.from && t?.to) {
          GhostHand.startRepeat(t.from.x, t.from.y, t.to.x, t.to.y, this.config.ghostHandRepeat);
        }
      }
    }, this.config.ghostHandDelay);
  },

  startInactivityTimer() {
    this.inactivityTimer = setInterval(() => {
      if (!this.isActive) { clearInterval(this.inactivityTimer); return; }
      if (Date.now() - this.lastInteractionTime >= this.config.ghostHandDelay && !GhostHand.isShowing) {
        const t = this.expectedAction || this.currentTutorial?.targetAction;
        if (t?.from && t?.to) {
          GhostHand.startRepeat(t.from.x, t.from.y, t.to.x, t.to.y, this.config.ghostHandRepeat);
        }
      }
    }, 1000);
  },

  clearAllTimers() {
    clearTimeout(this.hintTimer);
    clearTimeout(this.secondHintTimer);
    clearTimeout(this.ghostHandTimer);
    clearInterval(this.inactivityTimer);
    this.hintTimer = this.secondHintTimer = this.ghostHandTimer = this.inactivityTimer = null;
  },

  // ================= ТРИГГЕР УРОВНЯ =================
  checkLevelTriggers() {
    // Не запускаем если не на игровом экране
    if (!document.getElementById("board") || !cells || cells.length === 0) {
      console.log('🎓 Not on game screen — skipping level trigger');
      return false;
    }

    const levelTutorials = {
      1: 'basic_swipe', 2: 'create_rocket', 3: 'create_bomb',
      4: 'create_rainbow', 5: 'rocket_rocket', 6: 'rocket_bomb',
      7: 'rocket_rainbow', 8: 'bomb_bomb', 9: 'bomb_rainbow',
      10: 'rainbow_rainbow'
    };

    const tutorialId = levelTutorials[currentLevel];
    if (!tutorialId) return false;
    if (!TutorialStorage.shouldShow(tutorialId)) {
      console.log(`🎓 "${tutorialId}" already completed`);
      return false;
    }

    console.log(`🎯 Level ${currentLevel} → "${tutorialId}"`);
    setTimeout(() => this.start(tutorialId), 500);
    return true;
  },

  // ================= КНОПКИ МЕНЮ =================
  replay(tutorialId) {
    // Если мы в меню — сначала переходим на игровой экран
    if (!document.getElementById("board") || !cells || cells.length === 0) {
      console.log('🎓 In menu — navigating to game first');
      if (typeof goTo === 'function') {
        goTo('game');
      }
      // Запускаем туториал после загрузки уровня
      setTimeout(() => {
        if (typeof initLevel === 'function') {
          initLevel();
        }
        setTimeout(() => {
          TutorialStorage.resetOne(tutorialId);
          this.start(tutorialId);
        }, 600);
      }, 300);
      return;
    }

    // Мы на игровом экране
    TutorialStorage.resetOne(tutorialId);
    if (typeof hidePopup === 'function') hidePopup();
    setTimeout(() => this.start(tutorialId), 300);
  },

  resetAll() {
    TutorialStorage.resetAll();
    console.log('🔄 All tutorials reset');
    if (typeof hidePopup === 'function') hidePopup();
  },

  getAllTutorials() {
    return Object.values(this.tutorials).map(t => ({
      id: t.id, title: t.title, description: t.description,
      icon: t.icon, completed: !TutorialStorage.shouldShow(t.id)
    }));
  }
};

// Инициализация
window.addEventListener('load', () => {
  setTimeout(() => {
    if (typeof TutorialStorage === 'undefined') {
      console.error('❌ TutorialStorage missing');
      return;
    }
    TutorialManager.init();
  }, 300);
});

window.TutorialManager = TutorialManager;
console.log('🎓 TutorialManager v5 loaded');
