import React, { StrictMode, useState, useCallback } from 'react';
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

  const SelectionBox: React.FC<{
    startX: number;
    startY: number;
    width: number;
    height: number;
  }> = ({ startX, startY, width, height }) => {
    return (
      <div
        className="text-extractor-selection-box"
        style={{
          left: `${startX}px`,
          top: `${startY}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
      />
    );
  };

  const SelectionTool = () => {
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
    const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
          const rect = node.parentElement?.getBoundingClientRect();
          if (rect && 
              rect.left <= right && 
              rect.right >= left && 
              rect.top <= bottom && 
              rect.bottom >= top) {
            textNodes.push(node);
          }
        }

        // Extract text from selected nodes
        const selectedText = textNodes
          .map(node => node.textContent)
          .filter(Boolean)
          .join(' ')
          .trim();

        // Send selected text to background script
        if (selectedText) {
          chrome.runtime.sendMessage({
            type: 'TEXT_SELECTED',
            text: selectedText,
            timestamp: new Date().toISOString()
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error sending message:', chrome.runtime.lastError);
            } else if (response?.success) {
              console.log('Text selection sent successfully');
            }
          });
        }

        // Clean up the overlay
        cleanupReactApp();
      }
    }, [isSelecting, selectionStart, selectionEnd]);

    // Calculate selection box dimensions
    const selectionStyle = {
      startX: Math.min(selectionStart.x, selectionEnd.x),
      startY: Math.min(selectionStart.y, selectionEnd.y),
      width: Math.abs(selectionEnd.x - selectionStart.x),
      height: Math.abs(selectionEnd.y - selectionStart.y)
    };

    return (
      <div
        className="text-extractor-selection-tool"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {isSelecting && (
          <SelectionBox {...selectionStyle} />
        )}
      </div>
    );
  };

  const injectReactApp = () => {
    cleanupReactApp(); // Clean up any existing overlay first
    
    // Inject styles
    const styleElement = injectStyles();
    
    // Create container
    container = document.createElement('div');
    container.id = 'text-extractor-overlay';
    document.body.appendChild(container);

    root = createRoot(container);
    root.render(
      <StrictMode>
        <SelectionTool />
      </StrictMode>
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
