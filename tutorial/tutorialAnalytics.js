// tutorial/tutorialAnalytics.js
// ================= TUTORIAL ANALYTICS =================
// Отслеживает все действия игрока в туториалах

const TutorialAnalytics = {
  events: [],

  track(eventName, data = {}) {
    const event = {
      event: eventName,
      timestamp: Date.now(),
      ...data
    };

    this.events.push(event);
    
    // Сохраняем в localStorage каждые 10 событий
    if (this.events.length % 10 === 0) {
      this.save();
    }

    // Логируем в консоль для отладки
    console.log(`📊 Tutorial: ${eventName}`, data);
  },

  save() {
    try {
      const existing = JSON.parse(localStorage.getItem('tutorial_analytics') || '[]');
      const combined = [...existing, ...this.events];
      
      // Ограничиваем размер — храним последние 1000 событий
      if (combined.length > 1000) {
        combined.splice(0, combined.length - 1000);
      }
      
      localStorage.setItem('tutorial_analytics', JSON.stringify(combined));
      this.events = [];
    } catch (e) {
      console.error('❌ TutorialAnalytics: Failed to save', e);
    }
  },

  getStats(tutorialId) {
    try {
      const all = JSON.parse(localStorage.getItem('tutorial_analytics') || '[]');
      const tutorialEvents = all.filter(e => e.tutorialId === tutorialId);
      
      return {
        total: tutorialEvents.length,
        started: tutorialEvents.some(e => e.event === 'tutorial_started'),
        completed: tutorialEvents.some(e => e.event === 'tutorial_completed'),
        skipped: tutorialEvents.some(e => e.event === 'tutorial_skipped'),
        failedAttempts: tutorialEvents.filter(e => e.event === 'wrong_move').length,
        timeSpent: this.calculateTimeSpent(tutorialEvents)
      };
    } catch (e) {
      return {};
    }
  },

  calculateTimeSpent(events) {
    const start = events.find(e => e.event === 'tutorial_started');
    const end = events.find(e => 
      e.event === 'tutorial_completed' || e.event === 'tutorial_skipped'
    );
    
    if (start && end) {
      return Math.floor((end.timestamp - start.timestamp) / 1000);
    }
    return 0;
  },

  // Экспорт для отладки
  exportAll() {
    try {
      return JSON.parse(localStorage.getItem('tutorial_analytics') || '[]');
    } catch (e) {
      return [];
    }
  },

  // Очистить аналитику
  clear() {
    localStorage.removeItem('tutorial_analytics');
    this.events = [];
  }
};

window.TutorialAnalytics = TutorialAnalytics;
console.log('📊 TutorialAnalytics initialized');
