// ==================== tutorial/tutorialStorage.js ====================

const TutorialStorage = {
  STORAGE_KEY: 'match3_tutorial_data',
  
  defaultData: {
    completedTutorials: {},
    skippedTutorials: {},
    shownTutorials: {},
    failedAttempts: {},
    analytics: {},
    firstDiscoveries: {
      rocket: false,
      bomb: false,
      rainbow: false
    },
    tutorialProgress: {
      currentTutorial: null,
      currentStep: 0
    }
  },
  
  init() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      this.saveData(this.defaultData);
    }
  },
  
  getData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : { ...this.defaultData };
    } catch (e) {
      console.error('TutorialStorage: Error reading data', e);
      return { ...this.defaultData };
    }
  },
  
  saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('TutorialStorage: Error saving data', e);
    }
  },
  
  isCompleted(tutorialId) {
    const data = this.getData();
    return !!data.completedTutorials[tutorialId];
  },
  
  isSkipped(tutorialId) {
    const data = this.getData();
    return !!data.skippedTutorials[tutorialId];
  },
  
  isShown(tutorialId) {
    const data = this.getData();
    return !!data.shownTutorials[tutorialId];
  },
  
  markCompleted(tutorialId) {
    const data = this.getData();
    data.completedTutorials[tutorialId] = Date.now();
    data.shownTutorials[tutorialId] = true;
    this.saveData(data);
    this.trackAnalytics(tutorialId, 'completed');
  },
  
  markSkipped(tutorialId) {
    const data = this.getData();
    data.skippedTutorials[tutorialId] = Date.now();
    data.shownTutorials[tutorialId] = true;
    this.saveData(data);
    this.trackAnalytics(tutorialId, 'skipped');
  },
  
  markShown(tutorialId) {
    const data = this.getData();
    data.shownTutorials[tutorialId] = true;
    this.saveData(data);
  },
  
  addFailedAttempt(tutorialId) {
    const data = this.getData();
    data.failedAttempts[tutorialId] = (data.failedAttempts[tutorialId] || 0) + 1;
    this.saveData(data);
    this.trackAnalytics(tutorialId, 'failed_attempt');
  },
  
  setFirstDiscovery(type) {
    const data = this.getData();
    if (data.firstDiscoveries[type] !== undefined) {
      data.firstDiscoveries[type] = true;
      this.saveData(data);
    }
  },
  
  hasFirstDiscovery(type) {
    const data = this.getData();
    return !!data.firstDiscoveries[type];
  },
  
  trackAnalytics(tutorialId, event) {
    const data = this.getData();
    if (!data.analytics[tutorialId]) {
      data.analytics[tutorialId] = {
        started: null,
        completed: null,
        skipped: null,
        failedAttempts: 0,
        totalTime: 0,
        events: []
      };
    }
    
    data.analytics[tutorialId].events.push({
      event,
      timestamp: Date.now()
    });
    
    if (event === 'started') {
      data.analytics[tutorialId].started = Date.now();
    } else if (event === 'completed') {
      data.analytics[tutorialId].completed = Date.now();
      if (data.analytics[tutorialId].started) {
        data.analytics[tutorialId].totalTime += 
          Date.now() - data.analytics[tutorialId].started;
      }
    } else if (event === 'skipped') {
      data.analytics[tutorialId].skipped = Date.now();
    } else if (event === 'failed_attempt') {
      data.analytics[tutorialId].failedAttempts++;
    }
    
    this.saveData(data);
  },
  
  getAnalytics(tutorialId) {
    const data = this.getData();
    return data.analytics[tutorialId] || null;
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
    delete data.analytics[tutorialId];
    this.saveData(data);
  }
};
