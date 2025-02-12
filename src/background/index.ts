// Listen for messages from the website
chrome.runtime.onMessageExternal.addListener(
  async (request, sender, sendResponse) => {
    if (sender.url?.startsWith('https://settle.bangmil.io')) {
      switch (request.type) {
        case 'SET_USER_DATA':
          // Store user data in extension storage
          chrome.storage.local.set({
            userData: request.userData,
            subscriptionStatus: request.userData.isSubscribed
          });
          sendResponse({ success: true });
          break;

        case 'CLEAR_USER_DATA':
          // Clear user data from extension storage
          chrome.storage.local.remove(['userData', 'subscriptionStatus']);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    }
    return true; // Required for async response
  }
); 