// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_STATUS_CHANGED') {
    // Handle auth status changes
    console.log('Offscreen received auth status change:', message);
    sendResponse({ success: true });
    return true;
  }
  return false;
}); 