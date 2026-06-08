// ================= TUTORIAL STORAGE =================
const TutorialStorage = {
  STORAGE_KEY: 'match3_tutorials',
  
  defaults: {
    completedTutorials: {},
    skippedTutorials: {},
    shownTutorials: {},
    failedAttempts: {},
    tutorialTimeSpent: {},
    analytics: {
      tutorial_started: {},
      tutorial_completed: {},
      tutorial_skipped: {},
      tutorial_failed_attempts: {},
      tutorial_time_spent: {}
    }
  },
  
  init() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      this.save(this.defaults);
    }
  },
  
  getData() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? { ...this.defaults, ...JSON.parse(stored) } : this.defaults;
  },
  
  save(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },
  
  isCompleted(tutorialId) {
    const data = this.getData();
    return data.completedTutorials[tutorialId] === true;
  },
  
  isSkipped(tutorialId) {
    const data = this.getData();
    return data.skippedTutorials[tutorialId] === true;
  },
  
  isShown(tutorialId) {
    const data = this.getData();
    return data.shownTutorials[tutorialId] === true;
  },
  
  markCompleted(tutorialId) {
    const data = this.getData();
    data.completedTutorials[tutorialId] = true;
    this.save(data);
    this.trackEvent('tutorial_completed', tutorialId);
  },
  
  markSkipped(tutorialId) {
    const data = this.getData();
    data.skippedTutorials[tutorialId] = true;
    this.save(data);
    this.trackEvent('tutorial_skipped', tutorialId);
  },
  
  markShown(tutorialId) {
    const data = this.getData();
    data.shownTutorials[tutorialId] = true;
    this.save(data);
  },
  
  addFailedAttempt(tutorialId) {
    const data = this.getData();
    data.failedAttempts[tutorialId] = (data.failedAttempts[tutorialId] || 0) + 1;
    this.save(data);
    this.trackEvent('tutorial_failed_attempts', tutorialId);
  },
  
  addTimeSpent(tutorialId, seconds) {
    const data = this.getData();
    data.tutorialTimeSpent[tutorialId] = (data.tutorialTimeSpent[tutorialId] || 0) + seconds;
    this.save(data);
  },
  
  trackEvent(eventName, tutorialId) {
    const data = this.getData();
    data.analytics[eventName][tutorialId] = (data.analytics[eventName][tutorialId] || 0) + 1;
    this.save(data);
  },
  
  resetAll() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.init();
  },
  
  resetTutorial(tutorialId) {
    const data = this.getData();
    delete data.completedTutorials[tutorialId];
    delete data.skippedTutorials[tutorialId];
    delete data.shownTutorials[tutorialId];
    delete data.failedAttempts[tutorialId];
    delete data.tutorialTimeSpent[tutorialId];
    this.save(data);
  }
};
