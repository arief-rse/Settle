import React, { useState, useEffect } from 'react';
import { auth, signInWithChromeGoogle, createOrUpdateUser } from '../../../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
} from 'firebase/auth';
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Separator } from "../../ui/separator";

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<null | any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create standardized user document
        await createOrUpdateUser(userCredential.user);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(
        error.code === 'auth/email-already-in-use'
          ? 'Email already exists. Please sign in instead.'
          : error.code === 'auth/weak-password'
          ? 'Password should be at least 6 characters'
          : error.code === 'auth/invalid-email'
          ? 'Invalid email address'
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log('Starting Google sign-in...');
      await signInWithChromeGoogle();
      console.log('Google sign-in successful');
    } catch (error: any) {
      console.error('Google Sign-in Error:', error);
      setError(
        error.message.includes('OAuth2 client ID not found')
          ? 'Extension configuration error. Please contact support.'
          : error.message.includes('The user canceled the sign-in flow')
          ? 'Sign-in was cancelled.'
          : error.message.includes('popup')
          ? 'Please allow popups for this extension.'
          : error.message || 'Failed to sign in with Google. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Sign out failed!');
    }
  };

  if (user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Welcome, {user.email}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={handleSignOut} 
            className="w-full"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{isSignUp ? 'Sign Up' : 'Log In'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-destructive text-sm text-center">
            {error}
          </div>
        )}
        <Button
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center gap-2 bg-white text-gray-700 border hover:bg-gray-50"
        >
          <img src="/google.svg" alt="Google" className="w-4 h-4" />
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Button
            onClick={handleAuth}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={loading}
            className="w-full"
          >
            {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthPage; 