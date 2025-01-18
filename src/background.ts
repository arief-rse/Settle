// Store the last extracted text
let lastExtractedText: string | null = null

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return

  // Toggle selection mode
  await chrome.tabs.sendMessage(tab.id, {
    type: 'TOGGLE_SELECTION',
    payload: true
  })
})

// Handle messages from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'EXTRACTED_TEXT') {
    // Store the text
    lastExtractedText = message.payload
    // Forward to popup if it's open
    chrome.runtime.sendMessage(message)
  }
  // Always return true for async response
  return true
})

// Listen for messages from popup
chrome.runtime.onMessage.addListener((_message, _sender, sendResponse) => {
  if (_message.type === 'GET_LAST_TEXT') {
    sendResponse({ text: lastExtractedText })
  }
  return true
})
