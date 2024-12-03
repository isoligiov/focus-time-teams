const BID_HOST = '5.133.9.244'
const BIDHUB_BASE_URL = `http://${BID_HOST}:9000`
const EXTSERVER_BASE_URL = `http://${BID_HOST}:9030`;

let urlHistoryBatch = []


function sleep(duration) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, duration)
  })
}

function setTabUrlsMap(tabUrlsMap) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({tabUrlsMap}, function() {
      if(chrome.runtime.lastError) {
        throw Error(chrome.runtime.lastError);
      } else {
        resolve(tabUrlsMap)
      }
    });
  })
}
function getTabUrlsMap() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['tabUrlsMap'], function(data) {
      let tabUrlsMap = null
      if(data?.tabUrlsMap === undefined) {
        tabUrlsMap = {}
      } else {
        tabUrlsMap = data.tabUrlsMap;
      }
      resolve(tabUrlsMap)
    })
  })
}


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

chrome.tabs.onCreated.addListener(async (tab) => {
  if(tab.pendingUrl && tab.pendingUrl.startsWith('chrome://')) {
    console.log('[tab]: opened intentionally')
  } else {
    console.log('[tab]: opened by external link or script')
    const tabUrlsMap = await getTabUrlsMap()
    if(tabUrlsMap[tab.openerTabId]) {
      tabUrlsMap[tab.id] = { ...tabUrlsMap[tab.openerTabId] }
      console.log('[tab]: copied idetification metadata', tabUrlsMap[tab.id])
      await setTabUrlsMap(tabUrlsMap)
    }
  }
})
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const tabUrlsMap = await getTabUrlsMap()
  if(tabUrlsMap[tabId]) {
    delete tabUrlsMap[tabId]
    await setTabUrlsMap(tabUrlsMap)
  }
})
chrome.webRequest.onBeforeRequest.addListener(
  async ({ url, tabId, frameId, method }) => {
    if(method !== 'GET')
      return
    const tabUrlsMap = await getTabUrlsMap()
    if(!url) return
    if(url.startsWith('https://www.ziprecruiter.com/jobseeker/home')) {
      chrome.tabs.remove(tabId)
      return
    }
    if(!tabUrlsMap[tabId]) {
      if(!url.startsWith('chrome://')) {
        tabUrlsMap[tabId] = { url }
        console.log('[tab]: entered url to blank tab', url)
        await setTabUrlsMap(tabUrlsMap)
      }
    }
    let jobId = tabUrlsMap[tabId].jobId
    if(jobId === undefined) {
      const { found, id: newJobId } = await getJobIDfromURL({ url })
      if(found) jobId = newJobId
    }
    if(jobId) {
      await setJobIDforTab({ jobId, tabId })
    }
  },
  {
    types: ['main_frame', 'sub_frame'],
    urls: ['https://*/*', 'https://*/']
  }
)

setInterval(async () => {
  if(urlHistoryBatch.length === 0) return
  try {
    await hitPostApi(`${EXTSERVER_BASE_URL}/log_url`, {
      history: urlHistoryBatch,
      profile: 'anonymous',
    })
    urlHistoryBatch = []
  } catch(err) {
  }
}, 5000)
chrome.tabs.onUpdated.addListener(function
  (tabId, changeInfo, tab) {
    if (changeInfo.url) {
      urlHistoryBatch.push({
        url: changeInfo.url,
        timestamp: new Date().getTime(),
      })
    }
  }
);

async function guessCompanyNameFromAI({jd}) {
  const response = await hitPostApi(`${EXTSERVER_BASE_URL}/guess_company_name`, {jd})
  const company = await response.text()
  return { company }
}


async function getJobIDfromURL({url}) {
  const response = await hitPostApi(`${BIDHUB_BASE_URL}/job/url2id`, { url })
  const json = await response.json()
  return json
}
async function registerNewJob({ platform, job, pageData, initialStatus }) {
  const response = await hitPostApi(`${BIDHUB_BASE_URL}/job/new`, {
    platform,
    job: {
      ...job,
      scannedDate: new Date(),
    },
    pageData,
    initialStatus,
    finder: 'anonymous',
  })
  const jobId = await response.text()
  return {
    jobId
  }
}
async function logJobStatus({currentJobId, status}) {
  if(!currentJobId) throw new Error('jobId not set')
  const response = await hitPostApi(`${BIDHUB_BASE_URL}/job/status_log`, {
    jobId: currentJobId,
    status
  })
}
async function setJobIDforTab({ jobId, tabId }) {
  const tabUrlsMap = await getTabUrlsMap()
  if(!tabUrlsMap[tabId]) {
    tabUrlsMap[tabId] = { jobId }
  } else {
    tabUrlsMap[tabId].jobId = jobId
  }
  await setTabUrlsMap(tabUrlsMap)
}

const messageHandlerMap = {
  getJobIDfromURL,
  registerNewJob,
  logJobStatus,
  setJobIDforTab,
  guessCompanyNameFromAI,
}

// Message handler for all incoming messages within the chrome extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const messageType = request.message_type
  if(messageHandlerMap[messageType]) {
    (async() => {
      try {
        const data = { ...request }
        if(sender.tab) {
          const identifier = sender.tab.id
          const tabUrlsMap = await getTabUrlsMap()
          if(tabUrlsMap[identifier]) {
            data.currentUrl = tabUrlsMap[identifier].url
            data.currentJobId = tabUrlsMap[identifier].jobId
          }
          data.tabId = sender.tab.id
        }
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
