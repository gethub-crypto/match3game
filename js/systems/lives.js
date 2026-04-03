const LivesSystem = {

  maxLives: 3,
  regenTime: 30 * 60 * 1000, // 30 минут

  data: null,
  popupInterval: null,

  // ===== INIT =====
  init() {

    let data = Storage.get('livesData', null)

    if (!data) {
      data = {
        lives: this.maxLives,
        lastUpdate: Date.now()
      }
    }

    this.data = data

    this.update()
    this.render()

    setInterval(() => {
      this.update()
      this.render()
    }, 1000)

  },


  // ===== ОБНОВЛЕНИЕ ЖИЗНЕЙ =====
  update() {

    const now = Date.now()

    let { lives, lastUpdate } = this.data

    if (lives < this.maxLives) {

      const diff = now - lastUpdate

      const gained = Math.floor(diff / this.regenTime)

      if (gained > 0) {

        lives = Math.min(this.maxLives, lives + gained)

        lastUpdate = now

      }

    }

    this.data.lives = lives
    this.data.lastUpdate = lastUpdate

    Storage.set('livesData', this.data)

  },


  // ===== ИСПОЛЬЗОВАНИЕ ЖИЗНИ =====
  useLife() {

    if (this.data.lives > 0) {

      this.data.lives--

      this.data.lastUpdate = Date.now()

      Storage.set('livesData', this.data)

      this.render()

      return true

    } else {

      this.showNoLivesPopup()

      return false

    }

  },


  // ===== ПРОВЕРКА ЖИЗНЕЙ =====
  hasLives() {

    return this.data.lives > 0

  },


  // ===== ТАЙМЕР ДО ВОССТАНОВЛЕНИЯ =====
  getTimeLeft() {

    const now = Date.now()

    const diff = now - this.data.lastUpdate

    const left = this.regenTime - diff

    if (left <= 0) return "00:00"

    const min = Math.floor(left / 60000)

    const sec = Math.floor((left % 60000) / 1000)

    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`

  },


  // ===== ОТОБРАЖЕНИЕ =====
  render() {

    const el = document.getElementById('livesDisplay')

    if (!el) return

    if (this.data.lives >= this.maxLives) {

      el.innerText = `❤️ ${this.data.lives}`

    } else {

      el.innerText = `❤️ ${this.data.lives} ⏳ ${this.getTimeLeft()}`

    }

  },


  // ===== POPUP НЕТ ЖИЗНЕЙ =====
  showNoLivesPopup() {

    showPopup(`
      <h3>Жизни закончились</h3>
      <p id="popupTimer"></p>

      <button onclick="LivesSystem.restoreAd()">🎬 Восстановить</button>

      <br><br>

      <button onclick="hidePopup()">Закрыть</button>
    `)

    this.startPopupTimer()

  },


  // ===== ОБНОВЛЕНИЕ ТАЙМЕРА В POPUP =====
  startPopupTimer() {

    if (this.popupInterval) {
      clearInterval(this.popupInterval)
    }

    this.popupInterval = setInterval(() => {

      const el = document.getElementById('popupTimer')

      if (!el) return

      el.innerText = "Следующая жизнь через: " + this.getTimeLeft()

    }, 1000)

  },


  // ===== РЕКЛАМА (ЗАГЛУШКА) =====
  restoreAd() {

    alert("Реклама просмотрена")

    this.data.lives = Math.min(this.maxLives, this.data.lives + 1)

    this.data.lastUpdate = Date.now()

    Storage.set('livesData', this.data)

    hidePopup()

    this.render()

  }

  }
