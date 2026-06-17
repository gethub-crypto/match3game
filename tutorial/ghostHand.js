// tutorial/ghostHand.js
// ================= GHOST HAND SYSTEM =================
// Полноценная анимированная рука, показывающая свайпы
// Как в Candy Crush, Royal Match, Homescapes

const GhostHand = {
  element: null,
  fingerElement: null,
  animationTimer: null,
  isShowing: false,
  repeatInterval: null,

  // Создать DOM-элемент руки
  create() {
    if (this.element) return;

    // Контейнер
    this.element = document.createElement('div');
    this.element.id = 'ghostHand';
    this.element.innerHTML = `
      <div class="ghost-hand-container">
        <div class="ghost-finger">👆</div>
        <div class="ghost-trail"></div>
      </div>
    `;
    
    // Стили инлайном для быстрой загрузки
    Object.assign(this.element.style, {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: '10000',
      opacity: '0',
      transition: 'opacity 0.3s ease',
      display: 'none'
    });

    document.body.appendChild(this.element);
    this.fingerElement = this.element.querySelector('.ghost-finger');
    this.trailElement = this.element.querySelector('.ghost-trail');
  },

  // Показать руку
  show() {
    if (!this.element) this.create();
    
    this.element.style.display = 'block';
    requestAnimationFrame(() => {
      this.element.style.opacity = '0.85';
    });
    this.isShowing = true;
  },

  // Спрятать руку
  hide() {
    if (!this.element) return;
    
    this.element.style.opacity = '0';
    setTimeout(() => {
      if (!this.isShowing) {
        this.element.style.display = 'none';
      }
    }, 300);
    
    this.isShowing = false;
    this.stopRepeat();
  },

  // Получить координаты центра клетки
  getCellCenter(x, y) {
    const cell = cells[y] && cells[y][x];
    if (!cell) return { x: 0, y: 0 };

    const rect = cell.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  },

  // Анимировать свайп
  async animateSwipe(fromX, fromY, toX, toY, duration = 800) {
    if (!this.element) this.create();
    
    this.show();
    this.stopRepeat();

    const start = this.getCellCenter(fromX, fromY);
    const end = this.getCellCenter(toX, toY);

    // Начальная позиция
    this.element.style.transition = 'none';
    this.element.style.left = (start.x - 25) + 'px';
    this.element.style.top = (start.y - 25) + 'px';
    this.element.style.transform = 'scale(1)';
    
    // Небольшая пауза перед свайпом
    await this.delay(300);

    // Анимация свайпа
    this.element.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    this.element.style.left = (end.x - 25) + 'px';
    this.element.style.top = (end.y - 25) + 'px';
    
    // Лёгкое увеличение в середине
    setTimeout(() => {
      if (this.isShowing) {
        this.element.style.transform = 'scale(1.2)';
      }
    }, duration * 0.3);
    
    setTimeout(() => {
      if (this.isShowing) {
        this.element.style.transform = 'scale(1)';
      }
    }, duration * 0.7);

    await this.delay(duration);
    
    // Эффект "отскока" в конце
    this.element.style.transition = 'transform 150ms ease-out';
    this.element.style.transform = 'scale(1.3)';
    await this.delay(150);
    this.element.style.transform = 'scale(0)';
    await this.delay(200);
    
    this.hide();
  },

  // Зациклить показ руки
  startRepeat(fromX, fromY, toX, toY, intervalMs = 4000) {
    this.stopRepeat();
    
    const doAnimation = async () => {
      if (!this.isShowing) return;
      await this.animateSwipe(fromX, fromY, toX, toY);
    };

    // Первый показ сразу
    doAnimation();
    
    // Повторять с интервалом
    this.repeatInterval = setInterval(() => {
      if (this.isShowing) {
        doAnimation();
      } else {
        this.stopRepeat();
      }
    }, intervalMs);
  },

  stopRepeat() {
    if (this.repeatInterval) {
      clearInterval(this.repeatInterval);
      this.repeatInterval = null;
    }
  },

  // Показать руку с подсветкой клеток
  async demonstrateAction(targetAction) {
    if (!targetAction) return;

    const { from, to } = targetAction;
    if (!from || !to) return;

    // Подсвечиваем начальную и конечную клетки
    this.highlightTargetCells(from, to);

    // Показываем свайп
    await this.animateSwipe(from.x, from.y, to.x, to.y);
    
    // Убираем подсветку
    this.clearHighlights();
  },

  // Временная подсветка клеток
  highlightTargetCells(from, to) {
    // Убираем старые подсветки
    this.clearHighlights();

    // Добавляем подсветку
    [from, to].forEach(pos => {
      const cell = cells[pos.y] && cells[pos.y][pos.x];
      if (cell) {
        cell.classList.add('ghost-target');
        cell.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4)';
        cell.style.zIndex = '9999';
      }
    });
  },

  clearHighlights() {
    document.querySelectorAll('.ghost-target').forEach(cell => {
      cell.classList.remove('ghost-target');
      cell.style.boxShadow = '';
      cell.style.zIndex = '';
    });
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Уничтожить руку полностью
  destroy() {
    this.stopRepeat();
    this.hide();
    this.clearHighlights();
    
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.fingerElement = null;
    this.trailElement = null;
  }
};

window.GhostHand = GhostHand;
console.log('👆 GhostHand initialized');
