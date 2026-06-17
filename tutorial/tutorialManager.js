// tutorial/tutorialManager.js
// ================= TUTORIAL MANAGER v6 — ИСПРАВЛЕНИЕ ВСЕХ 12 ПРОБЛЕМ =================

const TutorialManager = {
  isActive: false,
  currentTutorial: null,
  waitingForCorrectMove: false,
  tutorialCompleted: false,  // ← флаг успешного результата

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
    console.log('🎓 TutorialManager v6: Initializing...');
    this.loadTutorialConfig();
    this.installHooks();
    console.log('✅ TutorialManager v6: Ready');
  },

  // ================= КОНФИГУРАЦИЯ (expectedOutcome вместо expectedSpecial/Combo) =================
  loadTutorialConfig() {
    this.tutorials = {
      basic_swipe: {
        id: 'basic_swipe',
        title: 'Базовый свайп',
        description: 'Свайпни красную фишку ВВЕРХ, чтобы собрать 3 красных в ряд!',
        icon: '👆',
        trigger: 'level_1',
        board: 'basicSwipe',
        reward: { coins: 25 },
        targetAction: {
          from: { x: 4, y: 4 },
          to: { x: 4, y: 3 },        // ← ИСПРАВЛЕНО: свайп ВВЕРХ
          description: 'Свайпни красную фишку ВВЕРХ'
        },
        expectedOutcome: {
          type: 'match',              // ожидаем обычный матч
          minMatchLength: 3,
          color: 'red'
        }
      },

      create_rocket: {
        id: 'create_rocket',
        title: 'Создание ракеты 🚀',
        description: 'Собери 4 фишки в ряд, чтобы создать ракету!',
        icon: '🚀',
        trigger: 'level_2',
        board: 'createRocket',
        reward: { coins: 50 },
        targetAction: {
          from: { x: 3, y: 4 },
          to: { x: 3, y: 3 },        // свайп вверх
          description: 'Свайпни красную фишку ВВЕРХ для 4 в ряд'
        },
        expectedOutcome: {
          type: 'special_created',    // ← проверяем создание спец-фишки
          specialType: 'rocket'
        }
      },

      create_bomb: {
        id: 'create_bomb',
        title: 'Создание бомбы 💣',
        description: 'Собери фишки L-формой, чтобы создать бомбу!',
        icon: '💣',
        trigger: 'level_3',
        board: 'createBomb',
        reward: { coins: 50 },
        targetAction: {
          from: { x: 4, y: 4 },
          to: { x: 3, y: 4 },        // свайп влево
          description: 'Свайпни зелёную фишку ВЛЕВО для L-формы'
        },
        expectedOutcome: {
          type: 'special_created',
          specialType: 'bomb'
        }
      },

      create_rainbow: {
        id: 'create_rainbow',
        title: 'Создание радуги 🌈',
        description: 'Собери 5 фишек в ряд, чтобы создать радугу!',
        icon: '🌈',
        trigger: 'level_4',
        board: 'createRainbow',
        reward: { coins: 75 },
        targetAction: {
          from: { x: 3, y: 4 },
          to: { x: 3, y: 3 },        // свайп вверх
          description: 'Свайпни жёлтую фишку ВВЕРХ для 5 в ряд'
        },
        expectedOutcome: {
          type: 'special_created',
          specialType: 'color'        // радуга = 'color' special
        }
      },

      rocket_rocket: {
        id: 'rocket_rocket',
        title: 'Ракета + Ракета ✨',
        description: 'Объедини две ракеты! Супер-крест очистит ряд и колонну.',
        icon: '🚀🚀',
        trigger: 'level_5',
        board: 'rocketRocket',
        reward: { coins: 100 },
        targetAction: {
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 },        // свайп вправо
          description: 'Свайпни ракету ВПРАВО к другой ракете'
        },
        expectedOutcome: {
          type: 'combo_activated',    // ← проверяем активацию комбо
          comboTypes: ['rocket', 'rocket']
        }
      },

      rocket_bomb: {
        id: 'rocket_bomb',
        title: 'Ракета + Бомба 💥',
        description: 'Объедини ракету и бомбу! Мощный взрыв.',
        icon: '🚀💣',
        trigger: 'level_6',
        board: 'rocketBomb',
        reward: { coins: 100 },
        targetAction: {
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 },
          description: 'Свайпни ракету ВПРАВО к бомбе'
        },
        expectedOutcome: {
          type: 'combo_activated',
          comboTypes: ['rocket', 'bomb']
        }
      },

      rocket_rainbow: {
        id: 'rocket_rainbow',
        title: 'Ракета + Радуга 🎆',
        description: 'Объедини ракету и радугу! Фишки одного цвета станут ракетами.',
        icon: '🚀🌈',
        trigger: 'level_7',
        board: 'rocketRainbow',
        reward: { coins: 150 },
        targetAction: {
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 },
          description: 'Свайпни ракету ВПРАВО к радуге'
        },
        expectedOutcome: {
          type: 'combo_activated',
          comboTypes: ['rocket', 'color']
        }
      },

      bomb_bomb: {
        id: 'bomb_bomb',
        title: 'Бомба + Бомба 💣💣',
        description: 'Объедини две бомбы! Мега-взрыв!',
        icon: '💣💣',
        trigger: 'level_8',
        board: 'bombBomb',
        reward: { coins: 150 },
        targetAction: {
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 },
          description: 'Свайпни бомбу ВПРАВО к другой бомбе'
        },
        expectedOutcome: {
          type: 'combo_activated',
          comboTypes: ['bomb', 'bomb']
        }
      },

      bomb_rainbow: {
        id: 'bomb_rainbow',
        title: 'Бомба + Радуга 🌈💣',
        description: 'Объедини бомбу и радугу! Фишки одного цвета станут бомбами.',
        icon: '💣🌈',
        trigger: 'level_9',
        board: 'bombRainbow',
        reward: { coins: 150 },
        targetAction: {
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 },
          description: 'Свайпни бомбу ВПРАВО к радуге'
        },
        expectedOutcome: {
          type: 'combo_activated',
          comboTypes: ['bomb', 'color']
        }
      },

      rainbow_rainbow: {
        id: 'rainbow_rainbow',
        title: 'Радуга + Радуга 🌈🌈',
        description: 'Объедини две радуги! Очистка всего поля!',
        icon: '🌈🌈',
        trigger: 'level_10',
        board: 'rainbowRainbow',
        reward: { coins: 200 },
        targetAction: {
          from: { x: 3, y: 3 },
          to: { x: 4, y: 3 },
          description: 'Свайпни радугу ВПРАВО к другой радуге'
        },
        expectedOutcome: {
          type: 'combo_activated',
          comboTypes: ['color', 'color']
        }
      }
    };
  },

  // ================= ХУКИ — ПРОВЕРКА РЕЗУЛЬТАТА ПОСЛЕ СВАЙПА =================
  installHooks() {
    const self = this;
    const originalOnCellClick = window.onCellClick;

    window.onCellClick = async function(x, y) {
      // Блокируем неправильные свайпы во время туториала
      if (self.isActive && self.waitingForCorrectMove) {
        const target = self.currentTutorial?.targetAction;
        if (target?.from && target?.to) {
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
            // Правильный свайп — разрешаем, но НЕ завершаем сразу
            // Ждём результата в checkOutcome()
          }
        }
      }

      // Выполняем оригинальный свайп
      if (originalOnCellClick) {
        await originalOnCellClick.call(this, x, y);
      }

      // После свайпа (если туториал активен) — проверяем результат
      if (self.isActive && self.waitingForCorrectMove) {
        setTimeout(() => self.checkOutcome(), 800);
      }
    };

    // Хукаем SpecialComboManager.handleSpecialSwap для отслеживания комбо
    if (typeof SpecialComboManager !== 'undefined') {
      const originalHandleSpecialSwap = SpecialComboManager.handleSpecialSwap;
      SpecialComboManager.handleSpecialSwap = async function(cellA, cellB, posA, posB, swipeDir) {
        const result = await originalHandleSpecialSwap.call(this, cellA, cellB, posA, posB, swipeDir);

        if (self.isActive && self.waitingForCorrectMove) {
          const types = [
            SpecialComboManager.getSpecialType(cellA),
            SpecialComboManager.getSpecialType(cellB)
          ].sort();
          self.lastComboActivated = types;
        }

        return result;
      };
    }

    console.log('🔗 TutorialManager v6: Hooks installed');
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

    const boardEl = document.getElementById("board");
    if (!boardEl || !cells || cells.length === 0) {
      console.warn('⚠️ Not on game screen');
      return false;
    }

    console.log(`🎓 Starting: "${tutorialId}"`);

    this.isActive = true;
    this.currentTutorial = tutorial;
    this.waitingForCorrectMove = false;
    this.tutorialCompleted = false;
    this.lastComboActivated = null;

    gameLocked = true;
    isAnimating = false;
    clearTimeout(hintTimer);
    clearHints();

    this.loadTutorialBoard(tutorial);

    // Подсветка клеток
    const cells = tutorial.targetAction
      ? [tutorial.targetAction.from, tutorial.targetAction.to]
      : [];
    TutorialOverlay.show(cells);

    TutorialOverlay.showPopup(
      tutorial.title,
      tutorial.description,
      tutorial.icon,
      () => this.onPopupClosed()
    );

    TutorialStorage.startAnalytics(tutorialId);
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
          ? boardData.board[y][x]
          : COLORS[Math.floor(Math.random() * COLORS.length)];

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

    // Блокируем shuffle на время туториала
    window.shuffleBoard = function() {
      console.log('🚫 Tutorial: shuffle blocked');
      // Проверяем, есть ли возможные ходы
      if (typeof hasPossibleMoves === 'function' && !hasPossibleMoves()) {
        console.warn('⚠️ No moves available! Player may be stuck.');
        // Даём подсказку вместо зависания
        TutorialOverlay.showWrongMove('Нет доступных ходов. Нажми "Пропустить".');
      }
    };

    console.log('📋 Board loaded');
  },

  onPopupClosed() {
    console.log('🎓 Waiting for correct move...');
    this.waitingForCorrectMove = true;
    gameLocked = false;
    this.startHintTimers();
    this.scheduleGhostHand();
    this.lastInteractionTime = Date.now();
    this.startInactivityTimer();
  },

  // ================= ПРОВЕРКА РЕЗУЛЬТАТА (ГЛАВНОЕ ИСПРАВЛЕНИЕ) =================
  checkOutcome() {
    if (!this.isActive || !this.waitingForCorrectMove) return;
    if (this.tutorialCompleted) return;

    const expected = this.currentTutorial?.expectedOutcome;
    if (!expected) {
      // Нет ожидаемого результата — завершаем по факту свайпа
      this.complete();
      return;
    }

    let outcomeAchieved = false;

    switch (expected.type) {
      case 'match':
        // Проверяем что был матч (isAnimating сброшен после processMatches)
        outcomeAchieved = !isAnimating && !gameLocked;
        break;

      case 'special_created':
        // Ищем спец-фишку нужного типа на доске
        outcomeAchieved = this.findSpecialOnBoard(expected.specialType);
        break;

      case 'combo_activated':
        // Проверяем что комбо активировалось
        if (this.lastComboActivated) {
          const expectedCombo = [...expected.comboTypes].sort();
          outcomeAchieved = arraysEqual(this.lastComboActivated, expectedCombo);
        }
        break;

      default:
        outcomeAchieved = true;
    }

    if (outcomeAchieved) {
      console.log('✅ Expected outcome achieved!');
      this.complete();
    } else {
      console.log('⏳ Outcome not yet achieved, waiting...');
      // Даём ещё время и проверяем снова
      setTimeout(() => {
        if (this.isActive && !this.tutorialCompleted) {
          this.checkOutcome();
        }
      }, 1000);
    }
  },

  findSpecialOnBoard(specialType) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = board[y]?.[x];
        if (cell && typeof cell === 'object' && cell.special === specialType) {
          return true;
        }
      }
    }
    return false;
  },

  // ================= ОБРАБОТЧИКИ =================
  handleWrongMove(x, y) {
    if (this.currentTutorial) {
      TutorialStorage.recordFailedAttempt(this.currentTutorial.id);
    }
    TutorialOverlay.showWrongMove(
      this.currentTutorial?.targetAction?.description || 'Попробуй другой ход!'
    );
    this.lastInteractionTime = Date.now();
  },

  complete() {
    if (!this.isActive || !this.currentTutorial || this.tutorialCompleted) return;
    this.tutorialCompleted = true;

    const tutorialId = this.currentTutorial.id;
    console.log(`🎉 Tutorial "${tutorialId}" COMPLETED!`);

    TutorialStorage.markCompleted(tutorialId);

    const reward = TutorialStorage.claimReward(tutorialId);
    if (reward?.coins) {
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
    this.tutorialCompleted = false;
    this.lastComboActivated = null;
    gameLocked = false;
    isAnimating = false;
    selected = null;
    clearHighlight();

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = cells[y]?.[x];
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

    if (typeof currentLevel !== 'undefined' && !levelFinished && typeof initLevel === 'function') {
      setTimeout(() => initLevel(), 400);
    }

    console.log('✅ Cleanup done');
  },

  // ================= ТАЙМЕРЫ =================
  startHintTimers() {
    this.clearAllTimers();
    this.hintTimer = setTimeout(() => {
      if (this.isActive) {
        const hc = TutorialOverlay.highlightCells;
        if (hc) hc.forEach(c => { if (c) c.style.animation = 'tutorialPulseFast 1s ease-in-out infinite'; });
      }
    }, this.config.hintDelay);
  },

  scheduleGhostHand() {
    this.ghostHandTimer = setTimeout(() => {
      if (this.isActive && this.waitingForCorrectMove) {
        const t = this.currentTutorial?.targetAction;
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
        const t = this.currentTutorial?.targetAction;
        if (t?.from && t?.to) {
          GhostHand.startRepeat(t.from.x, t.from.y, t.to.x, t.to.y, this.config.ghostHandRepeat);
        }
      }
    }, 1000);
  },

  clearAllTimers() {
    clearTimeout(this.hintTimer);
    clearTimeout(this.ghostHandTimer);
    clearInterval(this.inactivityTimer);
    this.hintTimer = this.ghostHandTimer = this.inactivityTimer = null;
  },

  // ================= ТРИГГЕРЫ УРОВНЕЙ =================
  checkLevelTriggers() {
    if (!document.getElementById("board") || !cells || cells.length === 0) return false;

    const levelTutorials = {
      1: 'basic_swipe', 2: 'create_rocket', 3: 'create_bomb',
      4: 'create_rainbow', 5: 'rocket_rocket', 6: 'rocket_bomb',
      7: 'rocket_rainbow', 8: 'bomb_bomb', 9: 'bomb_rainbow',
      10: 'rainbow_rainbow'
    };

    const tutorialId = levelTutorials[currentLevel];
    if (!tutorialId || !TutorialStorage.shouldShow(tutorialId)) return false;

    console.log(`🎯 Level ${currentLevel} → "${tutorialId}"`);
    setTimeout(() => this.start(tutorialId), 500);
    return true;
  },

  // ================= КНОПКИ МЕНЮ =================
  replay(tutorialId) {
    if (!document.getElementById("board") || !cells || cells.length === 0) {
      if (typeof goTo === 'function') goTo('game');
      setTimeout(() => {
        if (typeof initLevel === 'function') initLevel();
        setTimeout(() => {
          TutorialStorage.resetOne(tutorialId);
          this.start(tutorialId);
        }, 600);
      }, 300);
      return;
    }

    TutorialStorage.resetOne(tutorialId);
    if (typeof hidePopup === 'function') hidePopup();
    setTimeout(() => this.start(tutorialId), 300);
  },

  resetAll() {
    TutorialStorage.resetAll();
    if (typeof hidePopup === 'function') hidePopup();
  },

  getAllTutorials() {
    return Object.values(this.tutorials).map(t => ({
      id: t.id, title: t.title, description: t.description,
      icon: t.icon, completed: !TutorialStorage.shouldShow(t.id)
    }));
  }
};

// ================= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =================
function arraysEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

// ================= ИНИЦИАЛИЗАЦИЯ =================
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
console.log('🎓 TutorialManager v6 FINAL loaded');
