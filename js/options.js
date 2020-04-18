const settingsKeys = [
  'keywords',
  'maxLength',
  'removalStrategy',
  'advancedOptions',
  'selectors',
  'maxAreaPx',
  'allowedOrigins',
]

const newsFilterSettings = {
  settings: null,
  tabOrigin: null,

  init() {
    chrome.storage.sync.get(settingsKeys, settings => {
      this.settings = settings

      this.updateView()
      this.addFieldListeners()
      this.intializeAutoSize()

      chrome.storage.onChanged.addListener((changes) => {
        for (let [key, { newValue }] of Object.entries(changes)) {
          this.settings[key] = newValue
        }
        this.updateView()
      })
    });
  },

  updateView() {
    for (let [setting, value] of Object.entries(this.settings)) {
      const field = document.querySelector(`[name="${setting}"]`)

      if (field.type === 'checkbox') {
        field.checked = value
      }
      else {
        field.value = value
      }
    }

    const disabledForSiteField = document.querySelector('[name="disabledForOrigin"]')
    const allowedOriginsArray = this.settings.allowedOrigins.trim().split(/\s*\n\s*/)
    disabledForSiteField.checked = allowedOriginsArray.includes(this.tabOrigin)

    const originOptions = document.querySelector('.origin-options')
    const showOriginOptions = !/^chrome/.test(this.tabOrigin)
    originOptions.style.display = showOriginOptions ? '' : 'none'

    const advancedOptions = document.querySelector('.advanced-options')
    advancedOptions.style.display = this.settings.advancedOptions ? '' : 'none'

    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(this.autoSize, this)
  },

  addFieldListeners() {
    for (let element of document.querySelectorAll('[name]')) {
      element.addEventListener('input', ({ target }) => {
        const { name } = target
        let value

        if (name === 'disabledForOrigin') {
          this.toggleOrigin()
          return
        }

        if (target.type === 'checkbox') {
          value = target.checked
        }
        else {
          value = target.value
        }

        this.settings[name] = value

        chrome.storage.sync.set(this.settings)
      })
    }
  },

  toggleOrigin() {
    const allowedOriginsArray = this.settings.allowedOrigins.trim().split(/\s*\n\s*/)

    if (allowedOriginsArray.includes(this.tabOrigin)) {
      allowedOriginsArray.splice(allowedOriginsArray.indexOf(this.tabOrigin), 1)
    }
    else {
      allowedOriginsArray.push(this.tabOrigin)
    }

    chrome.storage.sync.set({
      ...this.settings,
      allowedOrigins: allowedOriginsArray.join('\n')
    })
  },

  intializeAutoSize() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
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

chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
  const tabUrl = new URL(tabs[0].url)

  newsFilterSettings.tabOrigin = tabUrl.origin
  document.querySelector('.origin-text').innerHTML = tabUrl.host
  newsFilterSettings.init()
});
