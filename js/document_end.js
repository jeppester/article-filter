const settingsKeys = [
  'keywords',
  'selectors',
  'exclusionSelectors',
  'maxLength',
  'removalStrategy',
  'maxAreaPx',
  'allowedOrigins',
]

const newsFilter = {
  settings: null,
  hiddenElements: [],
  checkedNodes: 0,
  letterMatcher: /[^\u0000-\u007F]|\w/,
  tabOrigin: null,

  init() {
    chrome.storage.sync.get(settingsKeys, settings => {
      this.settings = settings
      this.settings.keywords = settings.keywords.trim().split(/\s*\n\s*/)
      this.settings.selectors = settings.selectors.trim().split(/\s*\n\s*/)
      this.settings.exclusionSelectors = settings.exclusionSelectors.trim().split(/\s*\n\s*/)
      this.settings.allowedOrigins = settings.allowedOrigins.trim().split(/\s*\n\s*/)

      if (this.settings.allowedOrigins.includes(this.tabOrigin)) {
        chrome.runtime.sendMessage({ command: 'disableCounter' })
        return
      }

      this.observer = new MutationObserver(this.handleMutation)
      this.observer.observe(document.body, { subtree: true, childList: true })
      this.updateNode(document.body)
      this.updateCounter(this.hiddenElements.length)
    })
  },

  blockKeywords(element) {
    this.checkedNodes++

    var innerText = element.innerText.toLowerCase()

    const elementIsFullLengthArticle = (
      innerText.length > this.settings.maxLength &&
      this.getAreaIsTooLarge(element)
    )

    if (elementIsFullLengthArticle) return

    for (let keyword of this.settings.keywords) {
      if (this.getKeywordMatchesText(keyword, innerText)) this.hideElement(element)
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
    return area > this.settings.maxAreaPx
  },

  eleminateNodesInNodes(nodes) {
    const remainingToCheck = nodes.slice()
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
    const joinedSelectors = this.settings.selectors.join(',')
    const joinedExclusionSelectors = this.settings.exclusionSelectors.join(',')

    let matchingNodes = Array.from(node.querySelectorAll(joinedSelectors))
    matchingNodes = matchingNodes.filter(node => !node.matches(joinedExclusionSelectors))
    matchingNodes = this.eleminateNodesInNodes(matchingNodes)

    matchingNodes.forEach(this.blockKeywords)
  },

  updateNode(node) {
    this.checkContainer(node)
  },

  updateCounter(hiddenElementsLength) {
    chrome.runtime.sendMessage({ command: 'updateCounter', options: { hiddenElementsLength, href: location.href } })
  },

  handleMutation(mutationRecords) {
    const previousCount = this.hiddenElements.length

    mutationRecords.forEach(({ target }) => this.updateNode(target))

    const updatedCount = this.hiddenElements.length
    if (previousCount !== updatedCount) this.updateCounter(updatedCount)
  },

  handleSettingsChange() {
    this.reset()
    this.init()
  }
}

Object.getOwnPropertyNames(newsFilter).forEach(name => {
  if (typeof newsFilter[name] === 'function') newsFilter[name] = newsFilter[name].bind(newsFilter)
})

chrome.runtime.onMessage.addListener(({ command, options }) => {
  switch (command) {
    case 'setTabOrigin': {
      newsFilter.tabOrigin = options.tabOrigin
      newsFilter.init()
    }
  }
})

chrome.runtime.sendMessage({ command: 'getTabOrigin' })

chrome.storage.onChanged.addListener(newsFilter.handleSettingsChange)
