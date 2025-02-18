import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './lib/auth';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from './lib/stripe';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <Elements stripe={getStripe()}>
        <App />
      </Elements>
    </AuthProvider>
  </React.StrictMode>
); 