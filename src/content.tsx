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
  // if (container) return;
  container = document.createElement('div')
  container.id = 'text-extractor-overlay'

  // Insert at the beginning of body
  const firstChild = document.body.firstChild
  if (firstChild) {
    document.body.insertBefore(container, firstChild)
  } else {
    document.body.appendChild(container)
  }

  console.log('injecting react app', container)

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
  if (container) {
    container.remove()
    container = null
  }
}

if (isChromeExtension) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'START_SELECTION') {
      injectReactApp()
      sendResponse({ success: true })
    } else if (message.type === 'STOP_SELECTION') {
      cleanupReactApp()
      sendResponse({ success: true })
    }
  })
} else {
  console.warn('Chrome extension APIs not available. Some features may not work.')
}
