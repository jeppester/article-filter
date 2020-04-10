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

  init() {
    chrome.storage.sync.get(settingsKeys, settings => {
      this.settings = settings
      this.settings.keywords = settings.keywords.trim().split(/\s*\n\s*/)
      this.settings.selectors = settings.selectors.trim().split(/\s*\n\s*/)

      if (!this.settings.enabled) return

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
        if (innerText.indexOf(keyword) !== -1) {
          this.updateElementVisible(element, false)
          return
        }
      }
    }
  },

  updateElementVisible(element, shouldBeVisible) {
    const isCurrentlyVisible = !this.hiddenElements.includes(element)

    if (isCurrentlyVisible) {
      if (!shouldBeVisible) this.hideElement(element)
    }
    else {
      if (shouldBeVisible) this.showElement(element)
    }
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
    chrome.runtime.sendMessage({ hiddenElementsLength: this.hiddenElements.length })
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
