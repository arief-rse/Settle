import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { Elements } from '@stripe/react-stripe-js';
import { Toaster } from 'sonner';
import { getStripe } from './lib/stripe';
import Login from './pages/auth/login';
import Dashboard from './pages/dashboard';
import Pricing from './pages/pricing';
import Layout from './components/layout';
import ProtectedRoute from './components/auth/protected-route';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Elements stripe={getStripe()}>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
            </Route>
          </Routes>
        </Elements>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;