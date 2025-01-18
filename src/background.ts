(() => {
  let selectedText: { text: string; timestamp: string } | null = null;

  // Listen for messages from popup and content script
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('Background received message:', message);

    if (message.type === 'GET_SELECTED_TEXT') {
      console.log('Sending selected text:', selectedText);
      sendResponse({ text: selectedText?.text || null });
      return true;
    }

    if (message.type === 'TEXT_SELECTED') {
      console.log('Text selected:', message);
      selectedText = {
        text: message.text,
        timestamp: message.timestamp || new Date().toISOString()
      };
      
      // Broadcast to all extension contexts
      chrome.runtime.sendMessage({ 
        type: 'TEXT_AVAILABLE', 
        text: selectedText.text,
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
