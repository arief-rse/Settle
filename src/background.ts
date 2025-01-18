let lastExtractedText: string | null = null;
let selectedText: { text: string; timestamp: string } | null = null;

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      css: `
        .selection-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          cursor: crosshair;
          z-index: 2147483647;
        }
      `
    });
  } catch (error) {
    console.error('Failed to inject CSS:', error);
  }
  return true;
});

// Listen for messages from popup and content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_LAST_TEXT') {
    sendResponse({ text: lastExtractedText });
  }

  if (message.type === 'TEXT_SELECTED') {
    selectedText = {
      text: message.text,
      timestamp: message.timestamp
    };
    // Notify the popup if it's open
    chrome.runtime.sendMessage({ 
      type: 'TEXT_AVAILABLE', 
      text: message.text,
      timestamp: message.timestamp
    });
  }
  
  if (message.type === 'GET_SELECTED_TEXT') {
    sendResponse(selectedText);
    selectedText = null; // Clear after sending
  }
  return true;
});
