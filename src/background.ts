(() => {
  let selectedText: { text: string; timestamp: string } | null = null;

  // Function to open auth page
  const openAuthPage = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('auth.html'),
      active: true
    });
  };

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

    if (message.type === 'OPEN_AUTH') {
      openAuthPage();
      sendResponse({ success: true });
      return true;
    }

    if (message.type === 'AUTH_SUCCESS') {
      // Notify all extension contexts about successful authentication
      chrome.runtime.sendMessage({ 
        type: 'AUTH_STATE_CHANGED',
        authenticated: true
      }).catch(error => {
        if (!error.message.includes("Could not establish connection")) {
          console.error('Error broadcasting auth state:', error);
        }
      });
      return true;
    }

    return false;
  });
})();
