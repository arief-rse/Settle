// Define the ExtensionMessage type
interface ExtensionMessage {
  type?: string;
  action?: string;
  text?: string;
  timestamp?: string;
}

// Background script - handles authentication and API calls
let authToken: string | null = null;
let selectedText: { text: string; timestamp: string } | null = null;

// Import Supabase config
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/config.local';

// Initialize Supabase credentials on extension startup
const initializeSupabaseCredentials = () => {
  chrome.storage.local.set({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY
  }, () => {
    console.log('Supabase credentials initialized');
  });
};

// Call this during extension startup
initializeSupabaseCredentials();

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
chrome.runtime.onMessage.addListener((
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
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
      if (message.text) {
        selectedText = {
          text: message.text,
          timestamp: message.timestamp || new Date().toISOString()
        };
        
        // Broadcast to all extension contexts
        broadcastSelectedText();
      }
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
    
    // Use a try-catch block specifically for the fetch operation
    let userInfo;
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Add these options to help with CORS and other network issues
        mode: 'cors',
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
      }

      userInfo = await response.json();
      console.log("User info fetched:", userInfo);
    } catch (fetchError) {
      console.error("Error fetching user info:", fetchError);
      
      // If we can't fetch user info, create a minimal user object with a default email
      // This allows the extension to function even when Google API calls fail
      userInfo = {
        email: 'user@example.com',
        name: 'Extension User',
        picture: '',
      };
      console.log("Using fallback user info:", userInfo);
    }

    // Create or update user profile in Supabase
    try {
      // Import the createOrUpdateUserProfile function
      const { createOrUpdateUserProfile } = await import('./lib/supabase');
      
      if (userInfo.email) {
        // Create or update the user profile using email
        const profileData = await createOrUpdateUserProfile(userInfo.email);
        console.log("User profile created/updated in Supabase:", profileData);
      } else {
        console.error("No email found in user info, cannot create profile");
      }
    } catch (dbError) {
      console.error("Error creating/updating user profile in Supabase:", dbError);
      // Continue with authentication even if database operation fails
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
            }
          });
        }
      });
    });

    // Store user data in Chrome's local storage for background script access
    chrome.storage.local.set({
      user: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        credential: token,
      }
    }, () => {
      console.log('User data saved to Chrome storage');
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

// Add these functions before export
interface DeepSeekSettings {
  temperature: number;
  model: string;
  maxTokens?: number;
}

export const getDeepSeekSettings = async (): Promise<DeepSeekSettings> => {
  if (!authToken) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${authToken}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      // Return default settings if none exist
      return {
        temperature: 0.7,
        model: 'deepseek-chat',
      };
    }

    const settings = await response.json();
    return settings[0] || {
      temperature: 0.7,
      model: 'deepseek-chat',
    };
  } catch (error) {
    console.error('Error fetching DeepSeek settings:', error);
    return {
      temperature: 0.7,
      model: 'deepseek-chat',
    };
  }
};

export const updateDeepSeekSettings = async (settings: Partial<DeepSeekSettings>): Promise<void> => {
  if (!authToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/user_settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      user_id: authToken,
      ...settings,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update DeepSeek settings');
  }
};

export const callDeepSeekAPI = async (messages: any) => {
  if (!authToken) {
    throw new Error('Not authenticated');
  }

  const settings = await getDeepSeekSettings();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/deepseek-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'X-User-ID': authToken,
    },
    body: JSON.stringify({
      messages,
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DeepSeek API error: ${error.message || response.statusText}`);
  }

  return response.json();
};

export const updateDeepSeekSettingsAPI = (apiKey: string) => {
  chrome.storage.local.set({ deepseekApiKey: apiKey }, () => {
    console.log('DeepSeek API key updated');
    // Notify all tabs about the settings update
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED' });
        }
      });
    });
  });
}

export const callDeepSeekAPIFunction = async (text: string): Promise<string> => {
  try {
    // Import the AI processor function dynamically
    const { processExtractedText } = await import('./lib/ai-processor');
    return await processExtractedText(text);
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
  }
}

export {};
