// tutorial/tutorialOverlay.js
// ================= TUTORIAL OVERLAY SYSTEM =================
// Управляет затемнением, подсветкой клеток, попапами

const TutorialOverlay = {
  overlay: null,
  highlightCells: [],
  dimmedCells: [],
  popupElement: null,
  isActive: false,

  // Создать затемняющий слой
  create() {
    if (this.overlay) return;

    // Основной оверлей
    this.overlay = document.createElement('div');
    this.overlay.id = 'tutorialOverlay';
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: '9990',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.4s ease'
    });

    // Контейнер для "окон" в оверлее
    const holes = document.createElement('div');
    holes.id = 'tutorialHoles';
    holes.style.cssText = 'position:relative;width:100%;height:100%;';
    this.overlay.appendChild(holes);

    document.body.appendChild(this.overlay);
    this.holesContainer = holes;
  },

  // Показать оверлей с подсветкой конкретных клеток
  show(highlightPositions = []) {
    if (!this.overlay) this.create();

    this.isActive = true;
    this.clearHighlights();

    // Показываем оверлей
    this.overlay.style.display = 'block';
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
    });

    // Создаём "окна" для подсвеченных клеток
    highlightPositions.forEach(pos => {
      this.createHole(pos.x, pos.y);
    });

    // Добавляем свечение на клетки
    highlightPositions.forEach(pos => {
      const cell = cells[pos.y] && cells[pos.y][pos.x];
      if (cell) {
        cell.classList.add('tutorial-highlight');
        cell.style.zIndex = '9995';
        
        // Анимированная рамка
        cell.style.boxShadow = `
          0 0 15px rgba(255, 255, 255, 0.8),
          0 0 30px rgba(255, 215, 0, 0.6),
          inset 0 0 15px rgba(255, 255, 255, 0.3)
        `;
        cell.style.animation = 'tutorialPulse 1.5s ease-in-out infinite';
        
        this.highlightCells.push(cell);
      }
    });

    // Затемняем все остальные клетки
    this.dimOtherCells(highlightPositions);
  },

  // Создать "окно" в оверлее над клеткой
  createHole(x, y) {
    const cell = cells[y] && cells[y][x];
    if (!cell) return;

    const cellRect = cell.getBoundingClientRect();
    const overlayRect = this.overlay.getBoundingClientRect();

    const hole = document.createElement('div');
    hole.className = 'tutorial-hole';
    
    // Позиционируем "окно"
    const left = cellRect.left - overlayRect.left - 5;
    const top = cellRect.top - overlayRect.top - 5;
    const width = cellRect.width + 10;
    const height = cellRect.height + 10;

    Object.assign(hole.style, {
      position: 'absolute',
      left: left + 'px',
      top: top + 'px',
      width: width + 'px',
      height: height + 'px',
      backgroundColor: 'transparent',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
      borderRadius: '8px',
      zIndex: '9991',
      pointerEvents: 'none'
    });

    this.holesContainer.appendChild(hole);
    this.dimmedCells.push(hole);
  },

  // Затемнить неиспользуемые клетки
  dimOtherCells(exceptPositions) {
    const exceptSet = new Set(exceptPositions.map(p => `${p.x},${p.y}`));
    
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (exceptSet.has(`${x},${y}`)) continue;
        
        const cell = cells[y] && cells[y][x];
        if (cell) {
          cell.style.filter = 'brightness(0.4) saturate(0.3)';
          cell.style.pointerEvents = 'none';
          this.dimmedCells.push(cell);
        }
      }
    }
  },

  // Показать обучающий попап
  showPopup(title, description, icon = '📚', onContinue = null) {
    // Убираем старый попап
    this.hidePopup();

    this.popupElement = document.createElement('div');
    this.popupElement.id = 'tutorialPopup';
    this.popupElement.innerHTML = `
      <div class="tutorial-popup-overlay">
        <div class="tutorial-popup-container">
          <div class="tutorial-popup-icon">${icon}</div>
          <h2 class="tutorial-popup-title">${title}</h2>
          <p class="tutorial-popup-description">${description}</p>
          <div class="tutorial-popup-buttons">
            <button class="tutorial-btn tutorial-btn-skip" id="tutorialSkipBtn">
              Пропустить
            </button>
            <button class="tutorial-btn tutorial-btn-continue" id="tutorialContinueBtn">
              Продолжить ✨
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.popupElement);

    // Обработчики кнопок
    document.getElementById('tutorialContinueBtn').addEventListener('click', () => {
      this.hidePopup();
      if (onContinue) onContinue();
    });

    document.getElementById('tutorialSkipBtn').addEventListener('click', () => {
      this.hidePopup();
      // Будет обработано в TutorialManager
      if (window.TutorialManager) {
        window.TutorialManager.skipCurrent();
      }
    });
  },

  // Скрыть попап
  hidePopup() {
    if (this.popupElement) {
      this.popupElement.remove();
      this.popupElement = null;
    }
  },

  // Очистить все подсветки
  clearHighlights() {
    // Убираем классы с клеток
    this.highlightCells.forEach(cell => {
      cell.classList.remove('tutorial-highlight');
      cell.style.boxShadow = '';
      cell.style.animation = '';
      cell.style.zIndex = '';
    });
    this.highlightCells = [];

    // Убираем затемнение
    this.dimmedCells.forEach(el => {
      if (el.classList && el.classList.contains('tutorial-hole')) {
        el.remove();
      } else {
        el.style.filter = '';
        el.style.pointerEvents = '';
      }
    });
    this.dimmedCells = [];

    // Очищаем контейнер с окнами
    if (this.holesContainer) {
      this.holesContainer.innerHTML = '';
    }
  },

  // Полностью скрыть оверлей
  hide() {
    this.isActive = false;
    this.clearHighlights();
    this.hidePopup();

    if (this.overlay) {
      this.overlay.style.opacity = '0';
      setTimeout(() => {
        if (!this.isActive) {
          this.overlay.style.display = 'none';
        }
      }, 400);
    }

    // Восстанавливаем все клетки
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = cells[y] && cells[y][x];
        if (cell) {
          cell.style.filter = '';
          cell.style.pointerEvents = '';
          cell.style.zIndex = '';
          cell.style.boxShadow = '';
          cell.style.animation = '';
        }
      }
    }
  },

  // Показать сообщение о неправильном действии
  showWrongMove(message = 'Попробуй другой ход!') {
    const toast = document.createElement('div');
    toast.className = 'tutorial-wrong-move';
    toast.textContent = message;
    
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20%',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(255, 59, 48, 0.9)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '25px',
      fontSize: '16px',
      fontWeight: 'bold',
      zIndex: '10001',
      animation: 'shakeWrong 0.5s ease',
      pointerEvents: 'none'
    });

    document.body.appendChild(toast);

    // Трясём клетки
    this.shakeTargetCells();

    setTimeout(() => {
      toast.remove();
    }, 2000);
  },

  shakeTargetCells() {
    this.highlightCells.forEach(cell => {
      cell.style.animation = 'shakeWrong 0.5s ease';
      setTimeout(() => {
        cell.style.animation = 'tutorialPulse 1.5s ease-in-out infinite';
      }, 500);
    });
  }
};

window.TutorialOverlay = TutorialOverlay;
console.log('🖼️ TutorialOverlay initialized');
