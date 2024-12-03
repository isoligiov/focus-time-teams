const previousState = [];

(async () => {
  while(true) {
    try {
      const currentState = []
      const chatItems = document.querySelectorAll("div[data-shortcut-context='chat-list'] div[role='group'] [data-tid='chat-list-item'] > div[class*='chatListItem']")
      for(let chatItem of chatItems) {
        const itemTexts = []
        for(let child of chatItem.children)
          itemTexts.push(child.textContent)
        currentState.push(itemTexts)
      }
      console.log(currentState)
    } catch(err) {
    }
    await sleep(1000)
  }
})()