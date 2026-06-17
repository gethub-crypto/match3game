// tutorial/tutorialManager.js
// ================= TUTORIAL MANAGER (FIXED v4 — ПРАВИЛЬНЫЕ КЛЮЧИ) =================

const TutorialManager = {
  isActive: false,
  currentTutorial: null,
  currentStep: 0,
  
  originalGameLocked: false,
  originalIsAnimating: false,
  inputLocked: false,
  boardReady: false,
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
        targetAction: { type: 'swipe', from: { x: 4, y: 4 }, to: { x: 3, y: 4 }, description: 'Свайпни красную фишку вверх к другим красным' }
      },
      create_rocket: {
        id: 'create_rocket', type: 'create_special', title: 'Создание ракеты 🚀',
        description: 'Собери 4 фишки в ряд, чтобы создать ракету!',
        icon: '🚀', trigger: 'level_2', board: 'createRocket', reward: { coins: 50 },
        highlightCells: [{ x: 3, y: 4 }, { x: 3, y: 3 }],
        targetAction: { type: 'swipe', from: { x: 3, y: 4 }, to: { x: 3, y: 3 }, description: 'Свайпни красную фишку, чтобы создать 4 в ряд' },
        expectedSpecial: 'rocket'
      },
      create_bomb: {
        id: 'create_bomb', type: 'create_special', title: 'Создание бомбы 💣',
        description: 'Собери фишки в форме буквы L или T, чтобы создать бомбу!',
        icon: '💣', trigger: 'level_3', board: 'createBomb', reward: { coins: 50 },
        highlightCells: [{ x: 4, y: 4 }, { x: 3, y: 4 }],
        targetAction: { type: 'swipe', from: { x: 4, y: 4 }, to: { x: 3, y: 4 }, description: 'Свайпни зелёную фишку для создания L-формы' },
        expectedSpecial: 'bomb'
      },
      create_rainbow: {
        id: 'create_rainbow', type: 'create_special', title: 'Создание радуги 🌈',
        description: 'Собери 5 фишек в ряд, чтобы создать радугу!',
        icon: '🌈', trigger: 'level_4', board: 'createRainbow', reward: { coins: 75 },
        highlightCells: [{ x: 3, y: 4 }, { x: 3, y: 3 }],
        targetAction: { type: 'swipe', from: { x: 3, y: 4 }, to: { x: 3, y: 3 }, description: 'Свайпни жёлтую фишку, чтобы создать 5 в ряд' },
        expectedSpecial: 'color'
      },
      rocket_rocket: {
        id: 'rocket_rocket', type: 'combo', title: 'Ракета + Ракета ✨',
        description: 'Объедини две ракеты! Супер-крест очистит ряд и колонну.',
        icon: '🚀🚀', trigger: 'level_5', board: 'rocketRocket', reward: { coins: 100 },
        highlightCells: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
        targetAction: { type: 'swipe', from: { x: 3, y: 3 }, to: { x: 4, y: 3 }, description: 'Свайпни одну ракету к другой' },
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
        targetAction: { type: 'swipe', from: { x: 3, y: 3 }, to: { x: 4, y: 3 }, description: 'Свайпни одну бомбу к другой' },
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
        targetAction: { type: 'swipe', from: { x: 3, y: 3 }, to: { x: 4, y: 3 }, description: 'Свайпни одну радугу к другой' },
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
            if (x === target.from.x && y === target.from.y) {
              console.log('✅ Tutorial: Correct first cell');
            } else {
              console.log('❌ Tutorial: Wrong first cell');
              self.handleWrongMove(x, y);
              return;
            }
          } else {
            if (selected.x === target.from.x && selected.y === target.from.y &&
                x === target.to.x && y === target.to.y) {
              console.log('✅ Tutorial: Correct swipe!');
            } else {
              console.log('❌ Tutorial: Wrong swipe');
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

    console.log('🔗 TutorialManager: Hooks installed');
  },

  // ================= ЗАПУСК =================
  start(tutorialId) {
    const tutorial = this.tutorials[tutorialId];
    if (!tutorial) {
      console.error(`❌ Tutorial "${tutorialId}" not found`);
      return false;
    }

    if (!TutorialStorage.shouldShow(tutorialId)) {
      console.log(`📚 Tutorial "${tutorialId}" already done`);
      return false;
    }

    console.log(`🎓 Starting tutorial: "${tutorialId}"`);

    if (!cells || cells.length === 0) {
      console.warn('⚠️ Board not ready, retrying...');
      setTimeout(() => this.start(tutorialId), 300);
      return false;
    }

    this.saveGameState();
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
      console.error(`❌ No board data for "${tutorial.id}"`);
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
          ? boardData.board[y][x] : null;
        
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

    this.expectedAction = boardData.targetAction;
    this.expectedMatch = boardData.expectedMatch;
    this.expectedCombo = boardData.expectedCombo;
    this.expectedSpecial = boardData.expectedSpecial;

    window.shuffleBoard = function() {
      console.log('🚫 Tutorial: Shuffle blocked');
    };
    
    console.log('📋 Tutorial board loaded');
  },

  onPopupClosed() {
    console.log('🎓 Popup closed — waiting for correct move');
    this.waitingForCorrectMove = true;
    gameLocked = false;
    this.inputLocked = false;
    this.startHintTimers();
    this.scheduleGhostHand();
    this.lastInteractionTime = Date.now();
    this.startInactivityTimer();
  },

  handleWrongMove(x, y) {
    console.log('❌ Wrong move');
    if (this.currentTutorial) {
      TutorialStorage.recordFailedAttempt(this.currentTutorial.id);
      if (typeof TutorialAnalytics !== 'undefined') {
        TutorialAnalytics.track('wrong_move', { tutorialId: this.currentTutorial.id });
      }
    }
    const message = this.currentTutorial?.targetAction?.description || 'Попробуй другой ход!';
    TutorialOverlay.showWrongMove(message);
    this.lastInteractionTime = Date.now();
  },

  handleCorrectMove(x, y) {
    console.log('✅ Correct move!');
    if (this.currentTutorial && typeof TutorialAnalytics !== 'undefined') {
      TutorialAnalytics.track('correct_move', { tutorialId: this.currentTutorial.id });
    }
    this.lastInteractionTime = Date.now();
    setTimeout(() => {
      if (this.isActive) this.complete();
    }, 1500);
  },

  complete() {
    if (!this.isActive || !this.currentTutorial) return;

    const tutorialId = this.currentTutorial.id;
    console.log(`🎉 Tutorial "${tutorialId}" completed!`);

    TutorialStorage.updateTimeSpent(tutorialId);
    TutorialStorage.markCompleted(tutorialId);
    if (typeof TutorialAnalytics !== 'undefined') {
      TutorialAnalytics.track('tutorial_completed', { tutorialId });
    }

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
    console.log(`⏭️ Skipping "${this.currentTutorial.id}"`);
    TutorialStorage.markSkipped(this.currentTutorial.id);
    if (typeof TutorialAnalytics !== 'undefined') {
      TutorialAnalytics.track('tutorial_skipped', { tutorialId: this.currentTutorial.id });
    }
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
        <button class="tutorial-btn" onclick="this.closest('.tutorial-reward-popup').remove()">Отлично!</button>
      </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 5000);
  },

  cleanup() {
    console.log('🧹 Cleaning up...');

    TutorialOverlay.hide();
    GhostHand.hide();
    GhostHand.clearHighlights();
    this.clearAllTimers();

    this.waitingForCorrectMove = false;
    this.inputLocked = false;
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

    setTimeout(() => {
      gameLocked = false;
      isAnimating = false;
      selected = null;
      clearHighlight();
    }, 1000);

    if (!levelFinished && typeof initLevel === 'function') {
      setTimeout(() => {
        if (!this.isActive) initLevel();
      }, 400);
    }

    console.log('✅ Cleanup complete');
  },

  saveGameState() {
    this.originalGameLocked = gameLocked || false;
    this.originalIsAnimating = isAnimating || false;
  },

  startHintTimers() {
    this.clearAllTimers();

    this.hintTimer = setTimeout(() => {
      if (this.isActive) {
        const highlightedCells = TutorialOverlay.highlightCells;
        if (highlightedCells) {
          highlightedCells.forEach(c => { if (c) c.style.animation = 'tutorialPulseFast 1s ease-in-out infinite'; });
        }
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
        const target = this.expectedAction || this.currentTutorial?.targetAction;
        if (target?.from && target?.to) {
          GhostHand.startRepeat(
            target.from.x, target.from.y,
            target.to.x, target.to.y,
            this.config.ghostHandRepeat
          );
        }
      }
    }, this.config.ghostHandDelay);
  },

  startInactivityTimer() {
    this.inactivityTimer = setInterval(() => {
      if (!this.isActive) {
        clearInterval(this.inactivityTimer);
        this.inactivityTimer = null;
        return;
      }
      if (Date.now() - this.lastInteractionTime >= this.config.ghostHandDelay && !GhostHand.isShowing) {
        const target = this.expectedAction || this.currentTutorial?.targetAction;
        if (target?.from && target?.to) {
          GhostHand.startRepeat(
            target.from.x, target.from.y,
            target.to.x, target.to.y,
            this.config.ghostHandRepeat
          );
        }
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

  checkLevelTriggers() {
    const levelTutorials = {
      1: 'basic_swipe', 2: 'create_rocket', 3: 'create_bomb',
      4: 'create_rainbow', 5: 'rocket_rocket', 6: 'rocket_bomb',
      7: 'rocket_rainbow', 8: 'bomb_bomb', 9: 'bomb_rainbow',
      10: 'rainbow_rainbow'
    };

    const tutorialId = levelTutorials[currentLevel];
    if (!tutorialId) return false;
    if (!TutorialStorage.shouldShow(tutorialId)) return false;

    console.log(`🎯 Level ${currentLevel} triggers tutorial: "${tutorialId}"`);
    setTimeout(() => this.start(tutorialId), 300);
    return true;
  },

  replay(tutorialId) {
    TutorialStorage.resetOne(tutorialId);
    if (typeof hidePopup === 'function') hidePopup();
    setTimeout(() => this.start(tutorialId), 500);
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
  },

  getStatus(tutorialId) {
    return {
      completed: TutorialStorage.getData().completed[tutorialId] || false,
      skipped: TutorialStorage.getData().skipped[tutorialId] || false,
      canReplay: true
    };
  }
};

window.addEventListener('load', () => {
  setTimeout(() => {
    if (typeof TutorialStorage === 'undefined') {
      console.error('❌ TutorialStorage not loaded');
      return;
    }
    TutorialManager.init();
  }, 300);
});

window.TutorialManager = TutorialManager;
console.log('🎓 TutorialManager: Module loaded');
