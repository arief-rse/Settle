import { extractTextFromSelection } from './services/textExtractor';

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  
  // Toggle selection mode in content script
  chrome.tabs.sendMessage(tab.id, {
    type: 'TOGGLE_SELECTION',
    payload: true
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === 'EXTRACT_TEXT' && sender.tab?.id) {
    try {
      const text = await extractTextFromSelection(
        message.payload.startPos,
        message.payload.endPos
      );
      
      // Send extracted text back to content script
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'EXTRACTION_COMPLETE',
        payload: text
      });
      
      // Turn off selection mode
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'TOGGLE_SELECTION',
        payload: false
      });
    } catch (error) {
      console.error('Text extraction failed:', error);
    }
  }
});
