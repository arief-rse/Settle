// Types for messages and content
interface SelectedContent {
  text: string;
  timestamp: string;
  source: 'text' | 'image' | 'both';
  imageData?: string;
}

interface ExtensionMessage {
  type: 'GET_SELECTED_TEXT' | 'CAPTURE_VISIBLE_TAB' | 'TEXT_SELECTED' | 'GET_SELECTIONS_HISTORY' | 'CHECK_AUTH' | 'AUTH_STATUS_CHANGED';
  text?: string;
  source?: 'text' | 'image' | 'both';
  imageData?: string;
  status?: any;
}

let selectedText: SelectedContent | null = null;
let hasOffscreenDocument = false;

// Create and manage offscreen document
async function createOffscreenDocument() {
  if (hasOffscreenDocument) return;

  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Handle web app authentication'
    });
    hasOffscreenDocument = true;
  } catch (error: any) {
    if (error?.message?.includes('Only one offscreen document may be created')) {
      hasOffscreenDocument = true;
    } else {
      console.error('Offscreen document setup:', error);
    }
  }
}

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  createOffscreenDocument().catch(console.error);
});

// Listen for messages from popup and content script
chrome.runtime.onMessage.addListener((
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  console.log('Background received message:', message);

  if (message.type === 'GET_SELECTED_TEXT') {
    console.log('Sending selected text:', selectedText);
    sendResponse({ 
      text: selectedText?.text || null,
      source: selectedText?.source || 'text',
      imageData: selectedText?.imageData
    });
    return true;
  }

  if (message.type === 'CAPTURE_VISIBLE_TAB') {
    console.log('Capturing visible tab...');
    chrome.tabs.captureVisibleTab()
      .then(dataUrl => {
        sendResponse({ dataUrl });
      })
      .catch(error => {
        console.error('Screenshot capture failed:', error);
        sendResponse({ error: error.message });
      });
    
    return true;
  }

  if (message.type === 'TEXT_SELECTED') {
    console.log('Text selected:', message);
    selectedText = {
      text: message.text || '',
      timestamp: new Date().toISOString(),
      source: message.source || 'text',
      imageData: message.imageData
    };

    // Save to storage
    chrome.storage.local.get('selections', (data) => {
      const selections = data.selections || [];
      selections.unshift(selectedText);
      // Keep only last 50 selections
      chrome.storage.local.set({
        selections: selections.slice(0, 50),
        lastSelection: selectedText
      });
    });
    
    // Broadcast to all extension contexts
    chrome.runtime.sendMessage({ 
      type: 'TEXT_AVAILABLE', 
      text: selectedText.text,
      source: selectedText.source,
      imageData: selectedText.imageData,
      timestamp: selectedText.timestamp
    }).catch(error => {
      // Ignore errors from no receivers
      if (!error.message.includes("Could not establish connection")) {
        console.error('Error broadcasting message:', error);
      }
    });

    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_SELECTIONS_HISTORY') {
    chrome.storage.local.get(['selections'], (data) => {
      sendResponse({ selections: data.selections || [] });
    });
    return true;
  }

  // Handle auth status changes from offscreen document
  if (message.type === 'AUTH_STATUS_CHANGED') {
    // Broadcast to all extension contexts
    chrome.runtime.sendMessage(message).catch(() => {
      // Ignore errors from no receivers
    });
    return true;
  }

  return false;
});
