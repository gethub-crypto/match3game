// ================= GHOST HAND SYSTEM =================
const GhostHand = {
  element: null,
  animationTimeout: null,
  isActive: false,
  
  init() {
    this.element = document.createElement('div');
    this.element.className = 'ghost-hand';
    this.element.innerHTML = '👆';
    this.element.style.display = 'none';
    document.getElementById('board').appendChild(this.element);
  },
  
  show(fromX, fromY, toX, toY) {
    if (!this.element) this.init();
    
    const fromCell = cells[fromY]?.[fromX];
    const toCell = cells[toY]?.[toX];
    
    if (!fromCell || !toCell) return;
    
    const fromRect = fromCell.getBoundingClientRect();
    const toRect = toCell.getBoundingClientRect();
    const boardRect = document.getElementById('board').getBoundingClientRect();
    
    // Начальная позиция
    const startLeft = fromRect.left + fromRect.width / 2 - boardRect.left;
    const startTop = fromRect.top + fromRect.height / 2 - boardRect.top;
    
    this.element.style.display = 'block';
    this.element.style.left = startLeft + 'px';
    this.element.style.top = startTop + 'px';
    this.element.style.animation = 'none';
    
    this.isActive = true;
    
    // Запускаем анимацию
    this.animateSwipe(fromX, fromY, toX, toY, boardRect);
  },
  
  animateSwipe(fromX, fromY, toX, toY, boardRect) {
    const fromCell = cells[fromY]?.[fromX];
    const toCell = cells[toY]?.[toX];
    
    if (!fromCell || !toCell) return;
    
    const fromRect = fromCell.getBoundingClientRect();
    const toRect = toCell.getBoundingClientRect();
    
    const dx = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
    const dy = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);
    
    this.element.style.transition = 'all 0.8s ease-in-out';
    this.element.style.transform = `translate(${dx}px, ${dy}px) scale(1.2)`;
    this.element.style.opacity = '0.8';
    
    // Возврат через 1.5 секунды
    setTimeout(() => {
      if (this.isActive) {
        this.element.style.transition = 'all 0.3s ease-in-out';
        this.element.style.transform = 'translate(0, 0) scale(1)';
        this.element.style.opacity = '0.6';
      }
    }, 1500);
  },
  
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
      this.element.style.transform = '';
      this.element.style.opacity = '';
      this.element.style.transition = '';
    }
    this.isActive = false;
  },
  
  startLoop(fromX, fromY, toX, toY) {
    this.stopLoop();
    
    const loop = () => {
      if (!this.isActive) return;
      this.show(fromX, fromY, toX, toY);
      this.animationTimeout = setTimeout(loop, 3000);
    };
    
    this.show(fromX, fromY, toX, toY);
    this.animationTimeout = setTimeout(loop, 3000);
  },
  
  stopLoop() {
    clearTimeout(this.animationTimeout);
    this.hide();
  }
};
