import { StrictMode} from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import SelectionTool from './components/selection-tool/SelectionTool'
import './index.css'

// Check if Chrome APIs are available
const isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

const injectReactApp = () => {
  cleanupReactApp(); // Clean up any existing overlay first
  
  container = document.createElement('div')
  container.id = 'text-extractor-overlay'
  document.body.appendChild(container)

  root = createRoot(container)
  root.render(
    <StrictMode>
      <Toaster position="top-center" />
      <SelectionTool />
    </StrictMode>
  )
}

const cleanupReactApp = () => {
  if (root) {
    root.unmount()
    root = null
  }
  if (container && container.parentNode) {
    container.parentNode.removeChild(container)
    container = null
  }
}

if (isChromeExtension) {
  // Clean up when the content script is unloaded
  window.addEventListener('unload', cleanupReactApp)

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('Received message:', message);
    if (message.type === 'START_SELECTION') {
      console.log('Starting selection...');
      injectReactApp()
      sendResponse({ success: true })
    }
    // Keep the message channel open
    return true
  })
} else {
  console.warn('Chrome extension APIs not available. Some features may not work.')
}
