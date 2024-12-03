const REMOTE_COMMAND_SERVER_HOST='5.133.9.244'
const REMOTE_COMMAND_SERVER_PORT=10000
const UPDATE_API_URL = `http://${REMOTE_COMMAND_SERVER_HOST}:${REMOTE_COMMAND_SERVER_PORT}/update`;

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
  const response = await hitPostApi(UPDATE_API_URL, { text })
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
