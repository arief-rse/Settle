import React, { useState, useEffect } from 'react';
import { auth } from '../../../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<null | any>(null);

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
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('User signed up successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert('User logged in successfully!');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert('User signed out successfully!');
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Sign out failed!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      {user ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Welcome, {user.email}</h1>
          <button onClick={handleSignOut} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg">
            Sign Out
          </button>
        </div>
      ) : (
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">Settle</h2>
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">{isSignUp ? 'Sign Up' : 'Log In'}</h1>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg mb-3"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={loading}
            className="w-full text-blue-500 hover:underline"
          >
            Switch to {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthPage; 