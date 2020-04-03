const keywords = ['terror', 'bombemand', 'frygt', 'død', 'angreb', 'soldat']

const selectors = [
  'article',
  '[class*=article]:not([class*=articles])',
  '[class*=breaking]',
  '[class*=teasers]>*',
  'header',
]

const maxLength = 300

const blockKeywords = element => {
  var innerText = element.innerText.toLowerCase()
  for (var i = 0; i < keywords.length; i++) {
    var keyword = keywords[i]
    if (innerText.length > 300) {
      continue
    }
    if (innerText.indexOf(keyword) !== -1) {
      element.style.display = "none"
      break
    }
  }
}

const checkSelector = selector => {
  elements = document.body.querySelectorAll(selector)
  elements.forEach(blockKeywords)
}

const update = () => {
  selectors.forEach(checkSelector)
}

observer = new MutationObserver(update)
observer.observe(document.body, { childList: true })
update()
