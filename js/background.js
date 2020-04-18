const defaultSettings = {
  keywords: [
    'terror',
    'bombemand',
    'frygt',
    'død',
    'angreb',
    'soldat',
    'corona*',
    'covid*',
    'udgangsforbud',
  ].join('\n'),
  selectors: [
    'article',
    'li',
    'header',
    '[class*=breaking]',
    '[class*=teaser]>*',
    '[role="article"]',
    '[class*=article]',
    '[class*=post]',
    '[class*=item]',
    '[class*=spot]',
  ].join('\n'),
  exclusionSelectors: [
    'ul',
    '[class*=container]',
    '[class*=articles]',
    '[class*=posts]',
    '[class*=items]',
    '[class*=spots]',
  ].join('\n'),
  maxLength: 300,
  maxAreaPx: 500000,
  removalStrategy: 'hide',
  advancedOptions: false,
  allowedOrigins: [
    'http://localhost',
  ].join('\n')
}

const getIconDictionary = name => ({
  "16": `img/${name}16.png`,
  "48": `img/${name}48.png`,
  "128": `img/${name}128.png`
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set(defaultSettings);
});

const totals = {}

const updateBatchCount = tab => {
  const totalForTab = totals[tab.id] || {}
  const sumOfAllFrames = Object.values(totalForTab).reduce((total, value) => total + value, 0)

  chrome.browserAction.setIcon({ path: getIconDictionary('icon'), tabId: tab.id })
  chrome.browserAction.setBadgeBackgroundColor({ color: '#140' })
  chrome.browserAction.setBadgeText({ text: sumOfAllFrames.toString(), "tabId": tab.id })
}

const commands = {
  getTabOrigin(sender) {
    const tabOrigin = new URL(sender.tab.url).origin
    chrome.tabs.sendMessage(sender.tab.id, { command: 'setTabOrigin', options: { tabOrigin } })
  },

  disableCounter(sender) {
    chrome.browserAction.setIcon({ path: getIconDictionary('icon-disabled'), tabId: sender.tab.id })
    chrome.browserAction.setBadgeText({ text: '', "tabId": sender.tab.id })
  },

  resetCounter(sender) {
    totals[sender.tab.id] = {}
    updateBatchCount(sender.tab)
  },

  updateCounter(sender, options) {
    if (!totals[sender.tab.id]) totals[sender.tab.id] = {}

    const totalForTab = totals[sender.tab.id]

    totalForTab[options.href] = options.hiddenElementsLength
    updateBatchCount(sender.tab)
  },
}

chrome.runtime.onMessage.addListener(({ command, options }, sender) => {
  commands[command]?.(sender, options)
});
