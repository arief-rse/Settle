(() => {
  interface SelectedContent {
    text: string;
    timestamp: string;
    source: 'text' | 'image' | 'both';
    imageData?: string;
  }

  let selectedText: SelectedContent | null = null;

  // Listen for messages from popup and content script
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
      // Send the full screenshot to content script and let it handle the cropping
      chrome.tabs.captureVisibleTab()
        .then(dataUrl => {
          sendResponse({ dataUrl });
        })
        .catch(error => {
          console.error('Screenshot capture failed:', error);
          sendResponse({ error: error.message });
        });
      
      return true; // Keep the message channel open for async response
    }

    if (message.type === 'TEXT_SELECTED') {
      console.log('Text selected:', message);
      selectedText = {
        text: message.text,
        timestamp: message.timestamp || new Date().toISOString(),
        source: message.source || 'text',
        imageData: message.imageData
      };
      
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

    return false;
  });
})();
