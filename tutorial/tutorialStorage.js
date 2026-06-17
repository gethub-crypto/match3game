// tutorial/tutorialStorage.js
// ================= TUTORIAL STORAGE SYSTEM =================
// Сохраняет прогресс туториалов в localStorage
// Никогда не мешает основному Storage модулю игры

const TutorialStorage = {
  STORAGE_KEY: 'match3_tutorials',

  // Стандартная структура данных
  getData() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      
      // Гарантируем структуру
      return {
        completed: data.completed || {},    // { tutorialId: true }
        skipped: data.skipped || {},        // { tutorialId: true }
        shown: data.shown || {},            // { tutorialId: timestamp }
        failedAttempts: data.failedAttempts || {}, // { tutorialId: count }
        analytics: data.analytics || {},    // { tutorialId: { started, completed, skipped, timeSpent } }
        rewards: data.rewards || {},        // { tutorialId: { claimed: false } }
        ...data
      };
    } catch (e) {
      console.error('❌ TutorialStorage: Failed to read localStorage', e);
      return {
        completed: {},
        skipped: {},
        shown: {},
        failedAttempts: {},
        analytics: {},
        rewards: {}
      };
    }
  },

  saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('❌ TutorialStorage: Failed to save to localStorage', e);
    }
  },

  // Проверка: нужно ли показывать туториал
  shouldShow(tutorialId) {
    const data = this.getData();
    return !data.completed[tutorialId] && !data.skipped[tutorialId];
  },

  // Отметить как завершённый
  markCompleted(tutorialId) {
    const data = this.getData();
    data.completed[tutorialId] = true;
    data.shown[tutorialId] = Date.now();
    
    if (data.analytics[tutorialId]) {
      data.analytics[tutorialId].completed = true;
      data.analytics[tutorialId].completedAt = Date.now();
    }
    
    this.saveData(data);
  },

  // Отметить как пропущенный
  markSkipped(tutorialId) {
    const data = this.getData();
    data.skipped[tutorialId] = true;
    data.shown[tutorialId] = Date.now();
    
    if (data.analytics[tutorialId]) {
      data.analytics[tutorialId].skipped = true;
      data.analytics[tutorialId].skippedAt = Date.now();
    }
    
    this.saveData(data);
  },

  // Записать неудачную попытку
  recordFailedAttempt(tutorialId) {
    const data = this.getData();
    data.failedAttempts[tutorialId] = (data.failedAttempts[tutorialId] || 0) + 1;
    
    if (data.analytics[tutorialId]) {
      data.analytics[tutorialId].failedAttempts = data.failedAttempts[tutorialId];
    }
    
    this.saveData(data);
  },

  // Начать отслеживание времени
  startAnalytics(tutorialId) {
    const data = this.getData();
    if (!data.analytics[tutorialId]) {
      data.analytics[tutorialId] = {};
    }
    data.analytics[tutorialId].started = true;
    data.analytics[tutorialId].startedAt = Date.now();
    data.analytics[tutorialId].timeSpent = 0;
    this.saveData(data);
  },

  // Обновить время прохождения
  updateTimeSpent(tutorialId) {
    const data = this.getData();
    if (data.analytics[tutorialId] && data.analytics[tutorialId].startedAt) {
      const elapsed = Date.now() - data.analytics[tutorialId].startedAt;
      data.analytics[tutorialId].timeSpent = Math.floor(elapsed / 1000);
      this.saveData(data);
    }
  },

  // Получить все завершённые туториалы
  getCompleted() {
    return Object.keys(this.getData().completed);
  },

  // Сбросить всё (для отладки или настроек)
  resetAll() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  // Сбросить конкретный туториал
  resetOne(tutorialId) {
    const data = this.getData();
    delete data.completed[tutorialId];
    delete data.skipped[tutorialId];
    delete data.shown[tutorialId];
    delete data.failedAttempts[tutorialId];
    delete data.analytics[tutorialId];
    this.saveData(data);
  },

  // Получить награду (монеты, бустеры)
  claimReward(tutorialId) {
    const data = this.getData();
    if (!data.rewards[tutorialId]) {
      data.rewards[tutorialId] = {};
    }
    
    if (data.rewards[tutorialId].claimed) {
      return null; // уже получена
    }
    
    data.rewards[tutorialId].claimed = true;
    this.saveData(data);
    
    // Возвращаем награду
    const rewards = {
      coins: 50  // базовая награда
    };
    
    return rewards;
  }
};

// Для обратной совместимости — глобальный доступ
window.TutorialStorage = TutorialStorage;
console.log('📚 TutorialStorage initialized');
