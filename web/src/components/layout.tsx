import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import React from 'react';

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <Link to="/" className="flex items-center" key="home">
                <span className="text-xl font-bold text-indigo-600">Settle</span>
              </Link>
              <div className="ml-6 flex items-center space-x-4">
                <Link 
                  to="/" 
                  className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-indigo-600"
                  key="dashboard"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/pricing" 
                  key="pricing"
                  className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-indigo-600"
                >
                  Pricing
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">{user?.email}</span>
                <button
                  onClick={handleSignOut}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}