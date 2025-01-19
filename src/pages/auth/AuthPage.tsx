import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { ThemeProvider } from '../../components/common/theme-provider'
import { toast } from 'sonner'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = mode === 'signin' 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

      if (error) throw error

      // Close the window and notify the extension
      chrome.runtime.sendMessage({ type: 'AUTH_SUCCESS' })
      window.close()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'signin' 
                ? 'Sign in to your account to continue'
                : 'Create a new account to get started'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </Button>
          </div>
        </Card>
      </div>
    </ThemeProvider>
  )
} 