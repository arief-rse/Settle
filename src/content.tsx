import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

(() => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  // Inject styles directly into the page
  const injectStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .text-extractor-overlay {
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

      .text-extractor-selection {
        position: absolute !important;
        border: 2px solid #007bff !important;
        background: rgba(0, 123, 255, 0.1) !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
    return style;
  };

  const SelectionOverlay = () => {
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
    const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(true);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      setIsSelecting(true);
      setSelectionStart({ x: e.clientX, y: e.clientY });
      setSelectionEnd({ x: e.clientX, y: e.clientY });
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (isSelecting) {
        setSelectionEnd({ x: e.clientX, y: e.clientY });
      }
    }, [isSelecting]);

    const handleMouseUp = useCallback(() => {
      if (isSelecting) {
        setIsSelecting(false);

        // Calculate selection rectangle
        const left = Math.min(selectionStart.x, selectionEnd.x);
        const top = Math.min(selectionStart.y, selectionEnd.y);
        const right = Math.max(selectionStart.x, selectionEnd.x);
        const bottom = Math.max(selectionStart.y, selectionEnd.y);

        // Get all text nodes within the selection rectangle
        const textNodes: Text[] = [];
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );

        let node: Text | null;
        while ((node = walker.nextNode() as Text)) {
          const range = document.createRange();
          range.selectNodeContents(node);
          const rects = range.getClientRects();

          for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            if (
              rect.left <= right &&
              rect.right >= left &&
              rect.top <= bottom &&
              rect.bottom >= top
            ) {
              textNodes.push(node);
              break;
            }
          }
        }

        // Extract and combine text
        const text = textNodes
          .map(node => node.textContent)
          .filter(Boolean)
          .join(' ')
          .trim();

        if (text) {
          chrome.runtime.sendMessage({
            type: 'TEXT_SELECTED',
            text,
            timestamp: new Date().toISOString()
          });
          setIsVisible(false);
        }
      }
    }, [isSelecting, selectionStart, selectionEnd]);

    if (!isVisible) return null;

    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    const left = Math.min(selectionStart.x, selectionEnd.x);
    const top = Math.min(selectionStart.y, selectionEnd.y);

    return (
      <div
        className="text-extractor-overlay"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {isSelecting && (
          <div
            className="text-extractor-selection"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              left: `${left}px`,
              top: `${top}px`,
            }}
          />
        )}
      </div>
    );
  };

  const injectReactApp = async () => {
    // Check authentication first
    const isAuthenticated = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
        resolve(response);
      });
    });

    if (!isAuthenticated) {
      chrome.runtime.sendMessage({ type: 'OPEN_AUTH' });
      return;
    }

    cleanupReactApp(); // Clean up any existing overlay first

    // Inject styles
    const styleElement = injectStyles();

    // Create container
    container = document.createElement('div');
    container.id = 'text-extractor-overlay';
    document.body.appendChild(container);

    root = createRoot(container);
    root.render(
      <React.StrictMode>
        <SelectionOverlay />
      </React.StrictMode>
    );

    // Store style element reference for cleanup
    container.dataset.styleElementId = styleElement.id;
  };

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
  };

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
