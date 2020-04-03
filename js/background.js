const defaultSettings = {
  keywords: [
    'terror',
    'bombemand',
    'frygt',
    'død',
    'angreb',
    'soldat',
  ].join('\n'),
  selectors: [
    'article',
    '[class*=article]:not([class*=articles])',
    '[class*=breaking]',
    '[class*=teasers]>*',
    'header',
  ].join('\n'),
  maxLength: 300,
  removalStrategy: 'hide',
  enabled: true,
}

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set(defaultSettings);
});
