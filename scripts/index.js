const PROJECT_NAME = 'BD';
const SENSITIVE_CHANNELS = [
];

let previousState = {};
let initialState = true;

(async () => {
  while(true) {
    try {
      const currentState = {}
      const chatItems = document.querySelectorAll("div[data-shortcut-context='chat-list'] div[role='group'] [data-testid='list-item']")
      for(let chatItem of chatItems) {
        try {
          const headerElement = chatItem.querySelector('[id*="title-chat-list-item"]')
          if(window.getComputedStyle(headerElement).fontWeight != 700)
            continue
          const header = headerElement.textContent
          const timestamp = chatItem.querySelector('[id*="time-chat-list-item"]').textContent
          const preview = chatItem.querySelector('[id*="message-preview-chat-list-item"]').textContent
          currentState[header] = { timestamp, preview }
        } catch(err) {}
      }
      let text = ''
      for(let header in currentState) {
        const preview = currentState[header].preview
        if(preview !== previousState[header]?.preview) {
          const previewText = (preview || "").replace('`', '"').split(/[\r\n]/g).filter(line => line.length > 0).map(line => `\`${line}\``).join("\n")
          text += `*${header} @ ${PROJECT_NAME}* sent message!
${previewText}`
        }
      }
      if(text.length > 0) {
        await chrome.runtime.sendMessage({
          message_type: 'sendUpdate',
          text,
        })
      }
      previousState = currentState
    } catch(err) {
    }
    await sleep(1000)
  }
})()