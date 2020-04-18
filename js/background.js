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
    '[class*=article]:not([class*=articles])',
    '[role="article"]',
    '[class*=breaking]',
    '[class*=teaser]>*',
    '[class*=post]:not([class*=posts])',
    '[class*=item]:not([class*=items])',
    '[class*=spot]:not([class*=spots])',
    'li',
    'header',
  ].join('\n'),
  maxLength: 300,
  maxAreaPx: 500000,
  removalStrategy: 'hide',
  enabled: true,
  advancedOptions: false,
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set(defaultSettings);
});

chrome.browserAction.setBadgeBackgroundColor({ color: '#140' })

const totals = {}

const updateBatchCount = tab => {
  const totalForTab = totals[tab.id] || {}
  const sumOfAllFrames = Object.values(totalForTab).reduce((total, value) => total + value, 0)
  chrome.browserAction.setBadgeText({ text: sumOfAllFrames.toString(), "tabId": tab.id })
}

const commands = {
  disableCounter(sender) {
    chrome.browserAction.setBadgeText({ text: '', "tabId": sender.tab.id })
  },

  resetCounter(sender) {
    totals[sender.tab.id] = {}
    chrome.browserAction.setBadgeText({ text: '', "tabId": sender.tab.id })
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
