const PROJECT_NAME = 'Calendly'

let previousState = {};
let initialState = true

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
      if(!initialState) {
        let text = ''
        for(let header in currentState) {
          if(currentState[header].preview !== previousState[header].preview) {
            text += `*${header} @ ${PROJECT_NAME}* sent message!
  \`${currentState[header].preview}\`\n`
          }
        }
        if(text.length > 0) {
          await chrome.runtime.sendMessage({
            message_type: 'sendUpdate',
            text,
          })
        }
      }
      previousState = currentState
      initialState = false
    } catch(err) {
    }
    await sleep(1000)
  }
})()