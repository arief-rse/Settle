(() => {
  // Import React and ReactDOM from the window object
  const React = (window as any).React;
  const ReactDOM = (window as any).ReactDOM;

  let container: HTMLDivElement | null = null;
  let root: any = null;

  const injectReactApp = () => {
    cleanupReactApp(); // Clean up any existing overlay first
    
    container = document.createElement('div')
    container.id = 'text-extractor-overlay'
    document.body.appendChild(container)

    // Create the SelectionTool component
    const SelectionTool = () => {
      return React.createElement('div', {
        className: 'selection-tool',
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 999999,
          cursor: 'crosshair',
          background: 'rgba(0, 0, 0, 0.1)',
        }
      });
    };

    root = ReactDOM.createRoot(container)
    root.render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(SelectionTool)
      )
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

  // Check if Chrome APIs are available
  const isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id

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
})();
