// Application configuration

export const APP_CONFIG = {
  // Extension URLs
  EXTENSION_URLS: {
    HOME: `${chrome.runtime.getURL('')}index.html`,
    SUCCESS: `${chrome.runtime.getURL('')}index.html?status=success`,
    ERROR: `${chrome.runtime.getURL('')}index.html?status=error`,
  },
  
  // API configuration
  API: {
    BASE_URL: 'https://api.example.com', // Replace with your actual API URL
    ENDPOINTS: {
      ANALYZE: '/analyze',
      USER: '/user',
    }
  },
  
  // Storage keys
  STORAGE_KEYS: {
    USER: 'user',
    SELECTIONS: 'selections',
    SETTINGS: 'settings',
  }
} as const; 