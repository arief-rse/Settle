import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

(() => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  // Inject styles directly into the page
  const injectStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .text-extractor-selection-tool {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 2147483647 !important;
        cursor: crosshair !important;
        background: rgba(0, 0, 0, 0.1) !important;
        pointer-events: auto !important;
      }

      .text-extractor-selection-box {
        position: absolute !important;
        border: 2px solid #007bff !important;
        background: rgba(0, 123, 255, 0.1) !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
    return style;
  };

  const injectReactApp = () => {
    cleanupReactApp(); // Clean up any existing overlay first
    
    // Inject styles
    const styleElement = injectStyles();
    
    // Create container
    container = document.createElement('div');
    container.id = 'text-extractor-overlay';
    document.body.appendChild(container);

    // Create the SelectionTool component
    const SelectionTool = () => {
      return React.createElement('div', {
        className: 'text-extractor-selection-tool',
      });
    };

    root = createRoot(container);
    root.render(
      React.createElement(
        StrictMode,
        null,
        React.createElement(SelectionTool)
      )
    );

    // Store style element reference for cleanup
    container.dataset.styleElementId = styleElement.id;
  }

  const cleanupReactApp = () => {
    if (root) {
      root.unmount();
      root = null;
    }
    if (container) {
      // Clean up injected styles
      const styleElement = document.getElementById(container.dataset.styleElementId || '');
      if (styleElement) {
        styleElement.remove();
      }
      // Remove container
      container.remove();
      container = null;
    }
  }

  // Check if Chrome APIs are available
  const isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

  if (isChromeExtension) {
    // Clean up when the content script is unloaded
    window.addEventListener('unload', cleanupReactApp);

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      console.log('Received message:', message);
      if (message.type === 'START_SELECTION') {
        console.log('Starting selection...');
        injectReactApp();
        sendResponse({ success: true });
      }
      // Keep the message channel open
      return true;
    });
  } else {
    console.warn('Chrome extension APIs not available. Some features may not work.');
  }
})();
