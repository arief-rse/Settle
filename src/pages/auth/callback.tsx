import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error during auth callback:', error)
        navigate('/')
        return
      }

      if (session) {
        // Close the window and notify the extension
        chrome.runtime.sendMessage({ type: 'AUTH_SUCCESS', user: session.user })
        window.close()
      } else {
        navigate('/')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Completing sign in...</h2>
        <p className="text-sm text-muted-foreground">You can close this window after sign in is complete.</p>
      </div>
    </div>
  )
}
