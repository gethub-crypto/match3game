// ==================== tutorial/tutorialOverlay.js ====================

const TutorialOverlay = {
  overlay: null,
  popup: null,
  highlightElements: [],
  
  init() {
    this.createOverlay();
    this.createPopup();
  },
  
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'tutorialOverlay';
    this.overlay.className = 'tutorial-overlay';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
    
    const style = document.createElement('style');
    style.textContent = `
      .tutorial-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9998;
        pointer-events: all;
      }
      
      .tutorial-highlight {
        position: absolute;
        border: 3px solid #FFD700;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.6),
                    0 0 40px rgba(255, 215, 0, 0.3),
                    inset 0 0 20px rgba(255, 215, 0, 0.2);
        animation: tutorialGlow 1.5s ease-in-out infinite;
        z-index: 9999;
        pointer-events: none;
      }
      
      @keyframes tutorialGlow {
        0%, 100% { 
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.6),
                      0 0 40px rgba(255, 215, 0, 0.3),
                      inset 0 0 20px rgba(255, 215, 0, 0.2);
        }
        50% { 
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.8),
                      0 0 60px rgba(255, 215, 0, 0.5),
                      inset 0 0 30px rgba(255, 215, 0, 0.4);
        }
      }
      
      .tutorial-highlight-pulse {
        animation: tutorialPulse 1s ease-in-out infinite;
      }
      
      @keyframes tutorialPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      .tutorial-dimmed {
        filter: brightness(0.3);
        transition: filter 0.3s ease;
      }
      
      .tutorial-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        padding: 30px;
        z-index: 10001;
        min-width: 320px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: popupSlideIn 0.3s ease-out;
      }
      
      @keyframes popupSlideIn {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.8);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }
      
      .tutorial-popup-icon {
        font-size: 64px;
        margin-bottom: 15px;
        animation: iconBounce 1s ease-in-out infinite;
      }
      
      @keyframes iconBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      .tutorial-popup-title {
        font-size: 24px;
        font-weight: bold;
        color: #fff;
        margin-bottom: 10px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .tutorial-popup-description {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 20px;
        line-height: 1.5;
      }
      
      .tutorial-popup-btn {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        border: none;
        padding: 12px 40px;
        border-radius: 25px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      }
      
      .tutorial-popup-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      }
      
      .tutorial-skip-btn {
        background: transparent;
        border: 2px solid rgba(255, 255, 255, 0.5);
        color: rgba(255, 255, 255, 0.7);
        padding: 8px 25px;
        border-radius: 25px;
        font-size: 14px;
        cursor: pointer;
        margin-top: 15px;
        transition: all 0.2s;
      }
      
      .tutorial-skip-btn:hover {
        border-color: rgba(255, 255, 255, 0.8);
        color: rgba(255, 255, 255, 0.9);
      }
      
      .tutorial-arrow {
        position: absolute;
        color: #FFD700;
        font-size: 36px;
        animation: arrowBounce 1s ease-in-out infinite;
        z-index: 9999;
        pointer-events: none;
      }
      
      @keyframes arrowBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-15px); }
      }
    `;
    document.head.appendChild(style);
  },
  
  createPopup() {
    this.popup = document.createElement('div');
    this.popup.id = 'tutorialPopup';
    this.popup.className = 'tutorial-popup';
    this.popup.style.display = 'none';
    document.body.appendChild(this.popup);
  },
  
  showOverlay() {
    if (this.overlay) {
      this.overlay.style.display = 'block';
    }
  },
  
  hideOverlay() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
    this.clearHighlights();
  },
  
  highlightCells(cells, animate = true) {
    this.clearHighlights();
    
    cells.forEach(cellElement => {
      if (!cellElement) return;
      
      const rect = cellElement.getBoundingClientRect();
      const highlight = document.createElement('div');
      highlight.className = 'tutorial-highlight' + (animate ? ' tutorial-highlight-pulse' : '');
      highlight.style.left = (rect.left - 5) + 'px';
      highlight.style.top = (rect.top - 5) + 'px';
      highlight.style.width = (rect.width + 10) + 'px';
      highlight.style.height = (rect.height + 10) + 'px';
      
      document.body.appendChild(highlight);
      this.highlightElements.push(highlight);
    });
  },
  
  dimOtherCells(keepCells) {
    const allCells = document.querySelectorAll('.cell');
    allCells.forEach(cell => {
      if (!keepCells.includes(cell)) {
        cell.classList.add('tutorial-dimmed');
      } else {
        cell.classList.remove('tutorial-dimmed');
      }
    });
  },
  
  showPopup(config) {
    if (!this.popup) return;
    
    const { title, description, icon, onContinue, onSkip } = config;
    
    this.popup.innerHTML = `
      ${icon ? `<div class="tutorial-popup-icon">${icon}</div>` : ''}
      <div class="tutorial-popup-title">${title || ''}</div>
      <div class="tutorial-popup-description">${description || ''}</div>
      <button class="tutorial-popup-btn" id="tutorialContinueBtn">
        ${config.continueText || 'Continue'}
      </button>
      ${config.showSkip !== false ? `
        <br>
        <button class="tutorial-skip-btn" id="tutorialSkipBtn">Skip Tutorial</button>
      ` : ''}
    `;
    
    this.popup.style.display = 'block';
    
    document.getElementById('tutorialContinueBtn')?.addEventListener('click', () => {
      this.hidePopup();
      if (onContinue) onContinue();
    });
    
    document.getElementById('tutorialSkipBtn')?.addEventListener('click', () => {
      this.hidePopup();
      if (onSkip) onSkip();
    });
  },
  
  hidePopup() {
    if (this.popup) {
      this.popup.style.display = 'none';
    }
  },
  
  clearHighlights() {
    this.highlightElements.forEach(el => el.remove());
    this.highlightElements = [];
    
    const allCells = document.querySelectorAll('.cell');
    allCells.forEach(cell => cell.classList.remove('tutorial-dimmed'));
  },
  
  showWrongMoveEffect(cells) {
    cells.forEach(cell => {
      if (!cell) return;
      cell.style.animation = 'none';
      cell.offsetHeight; // Trigger reflow
      cell.style.animation = 'shake 0.5s ease-in-out';
    });
    
    setTimeout(() => {
      cells.forEach(cell => {
        if (cell) cell.style.animation = '';
      });
    }, 500);
    
    // Добавляем стиль shake если его нет
    if (!document.getElementById('tutorialShakeStyle')) {
      const style = document.createElement('style');
      style.id = 'tutorialShakeStyle';
      style.textContent = `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `;
      document.head.appendChild(style);
    }
  },
  
  destroy() {
    this.hideOverlay();
    this.hidePopup();
    this.clearHighlights();
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }
    this.overlay = null;
    this.popup = null;
  }
};
