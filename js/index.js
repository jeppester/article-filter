const settingsKeys = [
  'keywords',
  'selectors',
  'maxLength',
  'removalStrategy',
  'enabled',
]

const articleFilter = {
  settings: null,

  init() {
    ['blockKeywords', 'checkSelector', 'update'].forEach(fn => this[fn] = this[fn].bind(this))

    chrome.storage.sync.get(settingsKeys, settings => {
      if (!settings.enabled) return

      this.settings = settings
      this.settings.keywords = settings.keywords.split('\n')
      this.settings.selectors = settings.selectors.split('\n')

      this.observer = new MutationObserver(this.update)
      this.observer.observe(document.body, { childList: true })
      this.update()
    })
  },

  blockKeywords(element) {
    var innerText = element.innerText.toLowerCase()
    for (let keyword of this.settings.keywords) {
      if (innerText.length > 300) {
        continue
      }
      if (innerText.indexOf(keyword) !== -1) {
        switch (this.settings.removalStrategy) {
          case 'hide': {
            element.style.display = "none"
            break;
          }
          case 'makeInvisible': {
            element.style.visibility = 'hidden'
          }
        }
        break
      }
    }
  },

  checkSelector(selector) {
    elements = document.body.querySelectorAll(selector)
    elements.forEach(this.blockKeywords)
  },

  update() {
    this.settings.selectors.forEach(this.checkSelector)
  }
}

articleFilter.init()
