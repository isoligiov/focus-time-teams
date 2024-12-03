const NOTIFICATION_POST_SLACK_API = 'https://hooks.slack.com/services/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';

async function hitPostApi(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: new Headers({'content-type': 'application/json'}),
  })
  if(response.status != 200)
    throw new Error('api request failed')
  return response
}

async function sendUpdate({text}) {
  const response = await hitPostApi(NOTIFICATION_POST_SLACK_API, { text })
}

const messageHandlerMap = {
  sendUpdate,
}

// Message handler for all incoming messages within the chrome extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const messageType = request.message_type
  if(messageHandlerMap[messageType]) {
    (async() => {
      try {
        const data = { ...request }
        const response = await messageHandlerMap[messageType](data)
        sendResponse({
          success: true,
          ...response
        })
      } catch(error) {
        sendResponse({
          success: false,
          error: JSON.stringify(error)
        })
      }
    })()
    return true
  }
})
