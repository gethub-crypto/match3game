// ==================== tutorial/ghostHand.js ====================

const GhostHand = {
  element: null,
  isVisible: false,
  animationTimer: null,
  repeatTimer: null,
  
  init() {
    this.createGhostHand();
  },
  
  createGhostHand() {
    this.element = document.createElement('div');
    this.element.id = 'ghostHand';
    this.element.className = 'ghost-hand';
    this.element.innerHTML = '👆';
    this.element.style.display = 'none';
    document.body.appendChild(this.element);
    
    // Добавляем стили
    const style = document.createElement('style');
    style.textContent = `
      .ghost-hand {
        position: fixed;
        pointer-events: none;
        z-index: 10000;
        font-size: 48px;
        transition: none;
        animation: handPulse 1.5s ease-in-out infinite;
      }
      
      @keyframes handPulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.2); opacity: 1; }
      }
      
      .ghost-hand-dragging {
        animation: handDrag 1s ease-in-out;
      }
      
      @keyframes handDrag {
        0% { transform: translate(0, 0) scale(1); }
        30% { transform: translate(0, -10px) scale(1.1); }
        100% { transform: translate(var(--drag-x), var(--drag-y)) scale(1); }
      }
    `;
    document.head.appendChild(style);
  },
  
  show(fromCell, toCell) {
    if (!this.element || !fromCell) return;
    
    this.hide();
    this.isVisible = true;
    
    const fromRect = fromCell.getBoundingClientRect();
    const toRect = toCell ? toCell.getBoundingClientRect() : null;
    
    this.element.style.display = 'block';
    this.element.style.left = (fromRect.left + fromRect.width / 2 - 24) + 'px';
    this.element.style.top = (fromRect.top + fromRect.height / 2 - 24) + 'px';
    
    if (toRect) {
      setTimeout(() => {
        if (!this.isVisible) return;
        
        const dragX = (toRect.left - fromRect.left);
        const dragY = (toRect.top - fromRect.top);
        
        this.element.style.setProperty('--drag-x', dragX + 'px');
        this.element.style.setProperty('--drag-y', dragY + 'px');
        this.element.style.transition = 'transform 0.8s ease-in-out';
        this.element.style.transform = `translate(${dragX}px, ${dragY}px)`;
        
        setTimeout(() => {
          if (!this.isVisible) return;
          this.element.style.transition = 'transform 0.2s ease-in-out';
          this.element.style.transform = 'translate(0, 0)';
        }, 800);
      }, 300);
    }
  },
  
  hide() {
    this.isVisible = false;
    if (this.element) {
      this.element.style.display = 'none';
      this.element.style.transition = 'none';
      this.element.style.transform = 'translate(0, 0)';
    }
    this.clearTimers();
  },
  
  startRepeatAnimation(fromCell, toCell, interval = 10000) {
    this.show(fromCell, toCell);
    
    this.repeatTimer = setInterval(() => {
      if (this.isVisible && fromCell && toCell) {
        this.show(fromCell, toCell);
      }
    }, interval);
  },
  
  clearTimers() {
    if (this.repeatTimer) {
      clearInterval(this.repeatTimer);
      this.repeatTimer = null;
    }
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
    }
  },
  
  destroy() {
    this.hide();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
};
