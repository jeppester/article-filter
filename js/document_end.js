const settingsKeys = [
  'keywords',
  'selectors',
  'maxLength',
  'removalStrategy',
  'enabled',
  'maxAreaPx',
]

const articleFilter = {
  settings: null,
  hiddenElements: [],
  checkedNodes: 0,
  letterMatcher: /[^\u0000-\u007F]|\w/,

  init() {
    chrome.storage.sync.get(settingsKeys, settings => {
      this.settings = settings
      this.settings.keywords = settings.keywords.trim().split(/\s*\n\s*/)
      this.settings.selectors = settings.selectors.trim().split(/\s*\n\s*/)

      if (!this.settings.enabled) {
        chrome.runtime.sendMessage({ command: 'disableCounter' })
        return
      }

      this.observer = new MutationObserver(this.handleMutation)
      this.observer.observe(document.body, { subtree: true, childList: true })
      this.updateNode(document.body)
      this.updateCounter()
    })
  },

  blockKeywords(element) {
    this.checkedNodes++

    var innerText = element.innerText.toLowerCase()
    if (innerText.length < this.settings.maxLength || !this.getAreaIsTooLarge(element)) {
      for (let keyword of this.settings.keywords) {
        if (this.getKeywordMatchesText(keyword, innerText)) this.hideElement(element)
      }
    }
  },

  getKeywordMatchesText(keyword, text) {
    let allowLettersBefore = false
    let allowLettersAfter = false

    if (keyword[0] === '*') {
      keyword = keyword.substr(1)
      allowLettersBefore = true
    }

    if (keyword[keyword.length - 1] === '*') {
      keyword = keyword.slice(0, -1)
      allowLettersAfter = true
    }

    const index = text.indexOf(keyword)
    if (index !== -1) {
      if (!allowLettersBefore) {
        const characterBefore = text[index - 1]
        if (characterBefore && this.letterMatcher.test(characterBefore)) return false
      }

      if (!allowLettersAfter) {
        const characterAfter = text[index + keyword.length]
        if (characterAfter && this.letterMatcher.test(characterAfter)) return false
      }

      return true
    }

    return false
  },

  hideElement(element) {
    this.hiddenElements.push(element)

    switch (this.settings.removalStrategy) {
      case 'hide': {
        element._previousDisplay = element.style.display
        element.style.display = "none"
        break;
      }
      case 'makeInvisible': {
        element._previousVisibility = element.style.visibility
        element.style.visibility = 'hidden'
        break;
      }
    }
  },

  reset() {
    switch (this.settings.removalStrategy) {
      case 'hide': {
        this.hiddenElements.forEach(element => {
          element.style.display = element._previousDisplay
        })
        break;
      }
      case 'makeInvisible': {
        this.hiddenElements.forEach(element => {
          element.style.visibility = element._previousVisibility
        })
        break;
      }
    }

    this.observer?.disconnect()
    this.checkedNodes = 0
    this.hiddenElements = []
  },

  getAreaIsTooLarge(element) {
    const area = element.offsetWidth * element.offsetHeight
    return this.settings.maxAreaPx < area
  },

  eleminateNodesInNodes(nodes) {
    const remainingToCheck = Array.from(nodes)
    const accepted = []

    let node
    while (node = remainingToCheck.pop()) {
      if (accepted.some(otherNode => otherNode.contains(node))) continue
      if (remainingToCheck.some(otherNode => otherNode.contains(node))) continue
      if (this.hiddenElements.some(otherNode => otherNode.contains(node))) continue
      accepted.push(node)
    }

    return accepted
  },

  checkContainer(node) {
    const matchingNodes = node.querySelectorAll(this.settings.selectors.join(','))
    const sanitizedMatchingNodes = this.eleminateNodesInNodes(matchingNodes)

    sanitizedMatchingNodes.forEach(this.blockKeywords)
  },

  updateNode(node) {
    this.checkContainer(node)
    this.updateCounter()
  },

  updateCounter() {
    chrome.runtime.sendMessage({ command: 'updateCounter', options: { hiddenElementsLength: this.hiddenElements.length, href: location.href } })
  },

  handleMutation(mutationRecords) {
    mutationRecords.forEach(({ target }) => this.updateNode(target))
  },

  handleSettingsChange() {
    this.reset()
    this.init()
  }
}

Object.getOwnPropertyNames(articleFilter).forEach(name => {
  if (typeof articleFilter[name] === 'function') articleFilter[name] = articleFilter[name].bind(articleFilter)
})

articleFilter.init()

chrome.storage.onChanged.addListener(articleFilter.handleSettingsChange)
