import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@/components/common/theme-provider';
import PaymentPage from './PaymentPage';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <PaymentPage />
      </ThemeProvider>
    </Router>
  </React.StrictMode>
); 