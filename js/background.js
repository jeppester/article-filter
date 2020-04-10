const defaultSettings = {
  keywords: [
    'terror',
    'bombemand',
    'frygt',
    'død',
    'angreb',
    'soldat',
    'corona',
    'covid',
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

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set(defaultSettings);
});
