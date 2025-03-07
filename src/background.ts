// Background script - handles authentication and API calls
let authToken: string | null = null;
let activeAccounts: Array<{
  token: string;
  userInfo: {
    email: string;
    name: string;
    picture: string;
  };
}> = [];

let selectedText: { text: string; timestamp: string } | null = null;

// Listen for messages from popup and content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Background received message:', message);

  // Handle both message.type and message.action
  const action = message.type || message.action;

  switch (action) {
    case 'GET_SELECTED_TEXT':
      console.log('Sending selected text:', selectedText);
      sendResponse({ text: selectedText?.text || null });
      return true;

    case 'TEXT_SELECTED':
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

    case 'GET_AUTH_TOKEN':
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          console.error('Auth error:', chrome.runtime.lastError);
          sendResponse({
            type: 'ERROR',
            error: chrome.runtime.lastError.message || 'Unknown error occurred',
          });
        } else {
          console.log('Auth successful');
          sendResponse({
            type: 'AUTH_TOKEN_RESPONSE',
            token,
          });
        }
      });
      return true; // Will respond asynchronously

    case 'SIGN_IN':
      console.log('Signing in');
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError) {
          console.error('Auth error:', chrome.runtime.lastError);
          const errorMessage = chrome.runtime.lastError.message || 'Unknown error occurred';

          // If token was revoked or not granted, try to remove it and request again
          if (errorMessage.includes('OAuth2 not granted or revoked')) {
            try {
              // Trying to remove the token if it exists
              if (authToken) {
                await new Promise<void>((resolve) => {
                  chrome.identity.removeCachedAuthToken(
                    { token: authToken as string },
                    () => {
                      authToken = null;
                      resolve();
                    }
                  );
                });
              }

              // Try to get a new token
              chrome.identity.getAuthToken(
                { interactive: true },
                async (newToken) => {
                  if (chrome.runtime.lastError || !newToken) {
                    sendResponse({
                      error: 'Failed to get new token after revocation',
                    });
                    return;
                  }
                  // Continue with the new token
                  authToken = newToken;
                  handleAuthSuccess(newToken, sendResponse);
                }
              );
            } catch (error) {
              sendResponse({ error: 'Failed to handle token revocation' });
            }
          } else {
            sendResponse({ error: errorMessage });
          }
          return;
        }

        if (!token) {
          sendResponse({ error: 'No token received' });
          return;
        }

        authToken = token;
        handleAuthSuccess(token, sendResponse);
      });
      return true;

    case 'SIGN_OUT':
      chrome.identity.clearAllCachedAuthTokens(() => {
        authToken = null;
        // Notify all tabs about the auth state change
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                type: 'AUTH_STATE_CHANGED',
                user: null,
              });
            }
          });
        });
        sendResponse({ success: true });
      });
      return true;

    case 'GET_AUTH_STATUS':
      if (!authToken) {
        chrome.identity.getAuthToken({ interactive: false }, async (token) => {
          if (token) {
            try {
              const response = await fetch(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                const userInfo = await response.json();
                authToken = token;
                sendResponse({ token, userInfo });
              } else {
                sendResponse({ token: null, userInfo: null });
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              sendResponse({ error: errorMessage });
            }
          } else {
            sendResponse({ token: null, userInfo: null });
          }
        });
        return true;
      } else {
        sendResponse({ token: authToken });
      }
      return true;

    case 'SWITCH_ACCOUNT':
      const { email } = message;
      const account = activeAccounts.find(
        (account) => account.userInfo.email === email
      );
      if (account) {
        authToken = account.token;
        handleAuthSuccess(account.token, sendResponse);
        return true;
      }
      sendResponse({ error: 'Account not found' });
      return true;

    default:
      return false;
  }
});

// Helper function to handle successful authentication
const handleAuthSuccess = async (
  token: string,
  sendResponse: (response?: any) => void
) => {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await response.json();

    // Add account to activeAccounts if not already present
    const existingAccount = activeAccounts.find(
      (account) => account.userInfo.email === userInfo.email
    );
    if (!existingAccount) {
      activeAccounts.push({ token, userInfo });
    }

    // Notify all tabs about the auth state change
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'AUTH_STATE_CHANGED',
            user: {
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture,
              credential: token,
            },
            activeAccounts: activeAccounts,
          });
        }
      });
    });

    sendResponse({ token, userInfo, activeAccounts: activeAccounts });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    sendResponse({ error: errorMessage });
  }
};

export {};
