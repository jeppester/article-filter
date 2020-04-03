const settingsKeys = [
  'keywords',
  'maxLength',
  'removalStrategy',
  'enabled',
]

chrome.storage.sync.get(settingsKeys, settings => {
  for (let [setting, value] of Object.entries(settings)) {
    const field = document.querySelector(`[name="${setting}"]`)

    if (field.type === 'checkbox') {
      field.checked = value
    }
    else {
      field.value = value
    }
  }

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

      chrome.storage.sync.set({ [name]: value })
    })
  }
});
