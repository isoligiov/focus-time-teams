const SERVER_URL = 'http://localhost:5030'

async function sendUpdate({text}) {
  const response = await fetch(SERVER_URL, {
    method: 'POST',
    body: JSON.stringify({ type: 'notification', text }),
    headers: new Headers({'content-type': 'text/plain'}),
  })
  if(response.status != 200)
    throw new Error('api request failed')
  return response
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
