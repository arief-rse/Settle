import { useEffect, useState } from 'react'

type UserInfo = {
  credential: string
  name?: string
  email?: string
  photoURL?: string
}

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [activeAccounts, setActiveAccounts] = useState<UserInfo[]>([])
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

  const addAccount = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'ADD_ACCOUNT',
      })

      if (response.error) {
        throw new Error(response.error)
      }

      const { token, userInfo, activeAccounts: accounts } = response
      setActiveAccounts(accounts.map((acc: any) => ({
        email: acc.userInfo.email,
        name: acc.userInfo.name,
        photoURL: acc.userInfo.picture,
        credential: acc.token,
      })))

      setUser({
        email: userInfo.email,
        name: userInfo.name,
        photoURL: userInfo.picture,
        credential: token,
      })

      return token
    } catch (error) {
      console.error('Add account error:', error)
      throw error
    }
  }

  const switchAccount = async (email: string) => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'SWITCH_ACCOUNT',
        email,
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
      console.error('Switch account error:', error)
      throw error
    }
  }

  useEffect(() => {
    // Check initial auth state
    chrome.runtime
      .sendMessage({ action: 'GET_AUTH_STATUS' })
      .then((response) => {
        if (response.token && response.userInfo) {
          setUser({
            email: response.userInfo.email,
            name: response.userInfo.name,
            photoURL: response.userInfo.picture,
            credential: response.token,
          })
          if (response.activeAccounts) {
            setActiveAccounts(response.activeAccounts.map((acc: any) => ({
              email: acc.userInfo.email,
              name: acc.userInfo.name,
              photoURL: acc.userInfo.picture,
              credential: acc.token,
            })))
          }
        }
      })
      .catch((error) => console.error('Error checking auth status:', error))
      .finally(() => setLoading(false))

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
    addAccount,
    switchAccount,
    activeAccounts,
  }
}
