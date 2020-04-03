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
    '[class*=breaking]',
    '[class*=teaser]>*',
    '[class*=post]>*',
    '[class*=item]>*',
    '[class*=spot]',
    'li',
    'header',
  ].join('\n'),
  maxLength: 300,
  maxAreaPx: 500000,
  removalStrategy: 'hide',
  enabled: true,
}

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set(defaultSettings);
});
