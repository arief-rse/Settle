import { checkAuth } from './lib/supabase'

// Store selected text
let selectedText: { text: string; timestamp: string } | null = null

// Listen for messages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TEXT_SELECTED') {
    selectedText = {
      text: message.text,
      timestamp: message.timestamp
    }
    sendResponse({ success: true })
    return true
  }

  if (message.type === 'GET_SELECTED_TEXT') {
    sendResponse({ text: selectedText?.text || null })
    return true
  }

  if (message.type === 'CHECK_AUTH') {
    checkAuth().then(sendResponse)
    return true
  }

  if (message.type === 'OPEN_AUTH') {
    chrome.tabs.create({ url: chrome.runtime.getURL('auth.html') })
    return true
  }

  return false
})

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  const isAuthenticated = await checkAuth()
  
  if (!isAuthenticated) {
    chrome.tabs.create({ url: chrome.runtime.getURL('auth.html') })
    return
  }

  if (tab.id) {
    // Inject the content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    })

    // Start the selection process
    chrome.tabs.sendMessage(tab.id, { type: 'START_SELECTION' })
  }
})
