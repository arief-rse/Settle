export const STRIPE_CONFIG = {
  WEBHOOK_URL: 'https://asia-southeast2-settle-75bb2.cloudfunctions.net/ext-firestore-stripe-payments-handleWebhookEvents',
  FUNCTIONS_BASE_URL: 'https://asia-southeast2-settle-75bb2.cloudfunctions.net/ext-firestore-stripe-payments-createCheckoutSession',
  PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  PRICES: {
    SUBSCRIPTION: import.meta.env.VITE_STRIPE_SUBSCRIPTION_PRICE_ID,
    ONE_TIME: import.meta.env.VITE_STRIPE_ONE_TIME_PRICE_ID,
  },
} as const;

export const APP_CONFIG = {
  SUCCESS_URL: `${chrome.runtime.getURL('')}index.html?payment=success`,
  CANCEL_URL: `${chrome.runtime.getURL('')}index.html?payment=cancelled`,
} as const; 