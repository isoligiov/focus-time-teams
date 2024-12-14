const SERVER_URL = 'wss://streamlineanalytics.net:10001'

let socket = null

function sleep(duration) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, duration)
  })
}

(async() => {
  while(true) {
    try {
      if(!socket) {
        socket = await yieldSocket()
      }
    } catch(err) {
      console.log(err)
    }
    await sleep(1000)
  }
})();

function yieldSocket() {
  return new Promise((resolve, reject) => {
    let skt = new WebSocket(SERVER_URL);
    skt.onopen = (event) => {
      console.log('websocket open');
      resolve(skt)
    };

    skt.onerror = (event) => {
      reject()
    }

    skt.onmessage = (event) => {
    };

    skt.onclose = (event) => {
      console.log('websocket connection closed');
      socket = null;
    };
  })
}

async function sendUpdate({text}) {
  if(socket) {
    socket.send(JSON.stringify({ type: 'notification', text: text }))
  }
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
