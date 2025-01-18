import React from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import SelectionTool from './components/SelectionTool'

// Check if Chrome APIs are available
const isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id

// Create container for React component
const container = document.createElement('div')
container.id = 'text-extractor-overlay'
document.body.appendChild(container)

// Create root and render app
const root = createRoot(container)
root.render(
  <React.StrictMode>
    <Toaster position="top-center" />
    <SelectionTool />
  </React.StrictMode>
)

// Listen for messages from the extension
if (isChromeExtension) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'EXTRACT_TEXT') {
      // Handle text extraction
      sendResponse({ success: true })
    }
  })
} else {
  console.warn('Chrome extension APIs not available. Some features may not work.')
}
