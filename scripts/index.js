const previousState = [];

(async () => {
  while(true) {
    try {
      const currentState = {}
      const chatItems = document.querySelectorAll("div[data-shortcut-context='chat-list'] div[role='group'] [data-tid='chat-list-item'] > div.chatListItem_mainMedia")
      for(let chatItem of chatItems) {
        try {
          const header = chatItem.querySelector('.chatListItem_mainMedia_header').textContent
          const timestamp = chatItem.querySelector('.chatListItem_mainMedia_timeStamp').textContent
          const preview = chatItem.querySelector('.chatListItem_mainMedia_preview').textContent
          currentState[header] = { timestamp, preview }
        } catch(err) {}
      }
      console.log(currentState)
      previousState = currentState
    } catch(err) {
    }
    await sleep(1000)
  }
})()