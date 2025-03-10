// Background script - handles authentication and API calls
let authToken: string | null = null;
let selectedText: { text: string; timestamp: string } | null = null;

// Function to broadcast the selected text to all extension contexts
const broadcastSelectedText = () => {
  if (selectedText) {
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
  }
};

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
      broadcastSelectedText();

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
                    console.error('Failed to get new token after revocation:', chrome.runtime.lastError);
                    sendResponse({
                      error: 'Failed to get new token after revocation',
                    });
                    return;
                  }
                  // Continue with the new token
                  console.log('Got new token after revocation');
                  authToken = newToken;
                  handleAuthSuccess(newToken, sendResponse);
                }
              );
            } catch (error) {
              console.error('Failed to handle token revocation:', error);
              sendResponse({ error: 'Failed to handle token revocation' });
            }
          } else {
            sendResponse({ error: errorMessage });
          }
          return;
        }

        if (!token) {
          console.error('No token received from getAuthToken');
          sendResponse({ error: 'No token received' });
          return;
        }

        console.log('Token received from getAuthToken');
        authToken = token;
        handleAuthSuccess(token, sendResponse);
      });
      return true;

    case 'SIGN_OUT':
      if (authToken) {
        // First revoke the token to properly log out from Google
        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${authToken}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        .then(() => console.log('Token revoked successfully'))
        .catch(error => console.error('Error revoking token:', error))
        .finally(() => {
          // Then clear all cached tokens
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
        });
      } else {
        // If no token, just clear cached tokens
        chrome.identity.clearAllCachedAuthTokens(() => {
          authToken = null;
          sendResponse({ success: true });
        });
      }
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
        // When authToken exists, fetch user info and return both token and userInfo
        try {
          fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          })
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error('Failed to fetch user info');
            }
          })
          .then(userInfo => {
            sendResponse({ token: authToken, userInfo });
          })
          .catch(error => {
            console.error('Error fetching user info:', error);
            // If there's an error fetching user info, the token might be invalid
            // Clear it and return null
            authToken = null;
            sendResponse({ token: null, userInfo: null });
          });
        } catch (error) {
          console.error('Error in GET_AUTH_STATUS:', error);
          sendResponse({ token: null, userInfo: null });
        }
        return true;
      }

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
    console.log("Authentication successful, token:", token ? "exists" : "null");
    
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await response.json();
    console.log("User info fetched:", userInfo);

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
            }
          });
        }
      });
    });

    // After successful authentication, broadcast the selected text if it exists
    setTimeout(() => {
      broadcastSelectedText();
    }, 500); // Small delay to ensure auth state is updated first

    sendResponse({ token, userInfo });
  } catch (error) {
    console.error("Error in handleAuthSuccess:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    sendResponse({ error: errorMessage });
  }
};

export {};
