

function sleep(duration) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, duration)
  })
}
function sleepAbout(durationAbout) {
  return new Promise((resolve, reject) => {
    const duration = durationAbout * (Math.random() * 0.5 + 1)
    setTimeout(resolve, duration)
  })
}

const waitForElement = async (query, timeout) => {
  if(timeout === undefined)
    timeout = Number.MAX_VALUE
  while(timeout >= 0) {
    const element = document.querySelector(query)
    if(element) return element
    await sleep(1000)
    timeout -= 1000
  }
  return null
}

const findElementByText = (query, pattern) => {
  const elements = document.querySelectorAll(query)
  for(let element of elements) {
    const content = element.textContent.trim()
    if(pattern instanceof RegExp) {
      if(pattern.exec(content)) return element
    } else {
      if(content === pattern) return element
    }
  }
  return null
}

const waitForPositiveResult = async (callback, timeout) => {
  if(timeout === undefined)
    timeout = Number.MAX_VALUE
  while(timeout >= 0) {
    const result = callback()
    if(result) return result
    await sleep(1000)
    timeout -= 1000
  }
  return null
}