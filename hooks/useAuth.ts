import { useEffect, useState } from 'react'

type UserInfo = {
  credential: string
  name?: string
  email?: string
  photoURL?: string
}

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const signIn = async () => {
    try {
      // Send message to background script to handle authentication
      const response = await chrome.runtime.sendMessage({
        action: 'SIGN_IN',
      })

      if (response.error) {
        throw new Error(response.error)
      }

      const { token, userInfo } = response
      setUser({
        email: userInfo.email,
        name: userInfo.name,
        photoURL: userInfo.picture,
        credential: token,
      })

      return token
    } catch (error) {
      console.error('Authentication error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      // Just sign out from our app
      await chrome.runtime.sendMessage({ action: 'SIGN_OUT' })
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  useEffect(() => {
    // Check initial auth state
    chrome.runtime
      .sendMessage({ action: 'GET_AUTH_STATUS' })
      .then((response) => {
        console.log('Auth status response:', response);
        if (response.token) {
          // If we have a token but no userInfo, fetch the userInfo
          if (!response.userInfo) {
            console.log('Token exists but no userInfo, fetching user info');
            // This should not happen with our updated background script,
            // but keeping it as a fallback
            chrome.runtime.sendMessage({ action: 'GET_AUTH_STATUS' });
            return;
          }
          
          setUser({
            email: response.userInfo.email,
            name: response.userInfo.name,
            photoURL: response.userInfo.picture,
            credential: response.token,
          });
        }
      })
      .catch((error) => console.error('Error checking auth status:', error))
      .finally(() => setLoading(false));

    // Listen for auth state changes
    const handleAuthChange = (message: any) => {
      if (message.type === 'AUTH_STATE_CHANGED') {
        if (message.user) {
          setUser(message.user)
        } else {
          setUser(null)
        }
      }
    }

    chrome.runtime.onMessage.addListener(handleAuthChange)

    return () => {
      chrome.runtime.onMessage.removeListener(handleAuthChange)
    }
  }, [])

  return {
    user,
    loading,
    signIn,
    signOut,
  }
}
