// ================= TUTORIAL OVERLAY =================
const TutorialOverlay = {
  overlay: null,
  popup: null,
  dimOverlay: null,
  
  init() {
    // Затемняющий слой
    this.dimOverlay = document.createElement('div');
    this.dimOverlay.className = 'tutorial-dim';
    this.dimOverlay.style.display = 'none';
    document.getElementById('game').appendChild(this.dimOverlay);
    
    // Оверлей для попапов
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
  },
  
  showDim() {
    if (!this.dimOverlay) this.init();
    this.dimOverlay.style.display = 'block';
  },
  
  hideDim() {
    if (this.dimOverlay) this.dimOverlay.style.display = 'none';
  },
  
  showPopup(config) {
    if (!this.overlay) this.init();
    
    this.overlay.innerHTML = `
      <div class="tutorial-popup animate-slide-in">
        <div class="tutorial-popup-icon">${config.icon || '📚'}</div>
        <h2 class="tutorial-popup-title">${config.title || ''}</h2>
        <p class="tutorial-popup-description">${config.description || ''}</p>
        ${config.preview ? `<div class="tutorial-popup-preview">${config.preview}</div>` : ''}
        <div class="tutorial-popup-buttons">
          <button class="tutorial-btn tutorial-btn-primary" id="tutorialStartBtn">
            ${config.startText || 'Продолжить'}
          </button>
          ${config.showSkip !== false ? `
            <button class="tutorial-btn tutorial-btn-secondary" id="tutorialSkipBtn">
              Пропустить
            </button>
          ` : ''}
        </div>
        ${config.reward ? `
          <div class="tutorial-reward">
            🎁 Награда: ${config.reward.coins || 0} монет
          </div>
        ` : ''}
      </div>
    `;
    
    this.overlay.style.display = 'flex';
    
    return new Promise((resolve) => {
      document.getElementById('tutorialStartBtn').addEventListener('click', () => {
        this.hidePopup();
        resolve('start');
      });
      
      const skipBtn = document.getElementById('tutorialSkipBtn');
      if (skipBtn) {
        skipBtn.addEventListener('click', () => {
          this.hidePopup();
          resolve('skip');
        });
      }
    });
  },
  
  showWrongMovePopup(message) {
    if (!this.overlay) this.init();
    
    const existing = document.querySelector('.tutorial-wrong-move');
    if (existing) existing.remove();
    
    const popup = document.createElement('div');
    popup.className = 'tutorial-wrong-move';
    popup.innerHTML = `
      <div class="tutorial-wrong-content">
        <span class="tutorial-wrong-icon">⚠️</span>
        <p>${message}</p>
      </div>
    `;
    
    document.getElementById('board').appendChild(popup);
    
    setTimeout(() => popup.remove(), 2000);
  },
  
  showCompletionPopup(config) {
    if (!this.overlay) this.init();
    
    this.overlay.innerHTML = `
      <div class="tutorial-popup animate-slide-in tutorial-complete">
        <div class="tutorial-popup-icon">🎉</div>
        <h2 class="tutorial-popup-title">Отлично!</h2>
        <p class="tutorial-popup-description">${config.completionMessage || 'Вы успешно прошли обучение!'}</p>
        ${config.reward ? `
          <div class="tutorial-reward earned">
            🎁 Получено: ${config.reward.coins || 0} монет
          </div>
        ` : ''}
        <button class="tutorial-btn tutorial-btn-primary" id="tutorialCompleteBtn">
          Продолжить
        </button>
      </div>
    `;
    
    this.overlay.style.display = 'flex';
    
    return new Promise((resolve) => {
      document.getElementById('tutorialCompleteBtn').addEventListener('click', () => {
        this.hidePopup();
        resolve();
      });
    });
  },
  
  hidePopup() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
      this.overlay.innerHTML = '';
    }
  },
  
  highlightCells(positions) {
    positions.forEach(pos => {
      const cell = cells[pos.y]?.[pos.x];
      if (cell) {
        cell.classList.add('tutorial-highlight-cell');
      }
    });
  },
  
  clearHighlights() {
    document.querySelectorAll('.tutorial-highlight-cell').forEach(cell => {
      cell.classList.remove('tutorial-highlight-cell');
    });
  },
  
  dimAllExcept(positions) {
    const posSet = new Set(positions.map(p => `${p.x},${p.y}`));
    
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = cells[y]?.[x];
        if (cell) {
          if (!posSet.has(`${x},${y}`)) {
            cell.classList.add('tutorial-dimmed');
          } else {
            cell.classList.remove('tutorial-dimmed');
          }
        }
      }
    }
  },
  
  clearDimAll() {
    document.querySelectorAll('.tutorial-dimmed').forEach(cell => {
      cell.classList.remove('tutorial-dimmed');
    });
  },
  
  shakeCell(x, y) {
    const cell = cells[y]?.[x];
    if (!cell) return;
    
    cell.classList.add('tutorial-shake');
    setTimeout(() => cell.classList.remove('tutorial-shake'), 500);
  }
};
