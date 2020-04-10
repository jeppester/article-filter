const settingsKeys = [
  'keywords',
  'maxLength',
  'removalStrategy',
  'enabled',
  'advancedOptions',
  'selectors',
  'maxAreaPx',
]

const articleFilterSettings = {
  settings: null,

  init() {
    chrome.storage.sync.get(settingsKeys, settings => {
      this.settings = settings

      this.updateFieldValues()
      this.addFieldListeners()
      this.intializeAutoSize()
      this.updateAdvancedOptionsVisible()
    });
  },

  updateFieldValues() {
    for (let [setting, value] of Object.entries(this.settings)) {
      const field = document.querySelector(`[name="${setting}"]`)

      if (field.type === 'checkbox') {
        field.checked = value
      }
      else {
        field.value = value
      }
    }
  },

  addFieldListeners() {
    for (let element of document.querySelectorAll('[name]')) {
      element.addEventListener('input', ({ target }) => {
        const { name } = target
        let value

        if (target.type === 'checkbox') {
          value = target.checked
        }
        else {
          value = target.value
        }

        this.settings[name] = value

        chrome.storage.sync.set(this.settings, () => this.updateAdvancedOptionsVisible())
      })
    }
  },

  updateAdvancedOptionsVisible() {
    const advancedOptions = document.querySelector('.advanced-options')
    advancedOptions.style.display = this.settings.advancedOptions ? 'block' : 'none'
  },

  intializeAutoSize() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      this.autoSize(textarea)
      textarea.addEventListener('keydown', ({ target }) => {
        setTimeout(() => this.autoSize(target), 0)
      })
    })
  },

  autoSize(element) {
    element.style.cssText = 'height:auto; padding:0';
    element.style.cssText = 'height:' + element.scrollHeight + 'px';
  }
}

articleFilterSettings.init()
