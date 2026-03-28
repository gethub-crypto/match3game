const LivesSystem = { maxLives: 3, regenTime: 30 * 60 * 1000, // 30 минут

init() { let data = Storage.get('livesData', null);

if (!data) {
  data = {
    lives: this.maxLives,
    lastUpdate: Date.now()
  };
}

this.data = data;
this.update();
setInterval(() => this.update(), 1000);

},

update() { const now = Date.now(); let { lives, lastUpdate } = this.data;

if (lives < this.maxLives) {
  const diff = now - lastUpdate;
  const gained = Math.floor(diff / this.regenTime);

  if (gained > 0) {
    lives = Math.min(this.maxLives, lives + gained);
    lastUpdate = now;
  }
}

this.data.lives = lives;
this.data.lastUpdate = lastUpdate;
Storage.set('livesData', this.data);

this.render();

},

useLife() { if (this.data.lives > 0) { this.data.lives--; this.data.lastUpdate = Date.now(); Storage.set('livesData', this.data); this.render(); return true; } else { this.showNoLivesPopup(); return false; } },

getTimeLeft() { const now = Date.now(); const diff = now - this.data.lastUpdate; const left = this.regenTime - diff;

if (left <= 0) return 0;

const min = Math.floor(left / 60000);
const sec = Math.floor((left % 60000) / 1000);

return `${min}:${sec.toString().padStart(2, '0')}`;

},

render() { let el = document.getElementById('livesDisplay'); if (!el) return;

if (this.data.lives >= this.maxLives) {
  el.innerText = `❤️ ${this.data.lives}`;
} else {
  el.innerText = `❤️ ${this.data.lives} (${this.getTimeLeft()})`;
}

},

showNoLivesPopup() { showPopup(<h3>Жизни закончились</h3> 
  <p>Следующая жизнь через: ${this.getTimeLeft()}</p>
  <button onclick="hidePopup()">OK</button>); } };
