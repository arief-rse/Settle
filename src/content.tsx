import React, { StrictMode, useState, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { extractTextFromSelection } from './services/textExtractor';


interface ExtractedContent {
  text: string;
  source: 'text' | 'image' | 'both';
  imageData?: string;
  coordinates?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

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
        position: fixed !important;
        border: 2px solid #007bff !important;
        background: rgba(0, 123, 255, 0.1) !important;
        pointer-events: none !important;
      }

      .text-extractor-selection-guide {
        position: fixed !important;
        top: 20px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background: white !important;
        padding: 8px 16px !important;
        border-radius: 8px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        font-size: 14px !important;
        color: #666 !important;
        pointer-events: none !important;
        z-index: 2147483648 !important;
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
    const containerRef = useRef<HTMLDivElement>(null);

    const getPageOffset = useCallback(() => {
      return {
        x: window.scrollX,
        y: window.scrollY
      };
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      if (!containerRef.current) return;
      
      setIsSelecting(true);
      setSelectionStart({ 
        x: e.clientX,
        y: e.clientY
      });
      setSelectionEnd({ 
        x: e.clientX,
        y: e.clientY
      });
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (!isSelecting) return;
      
      setSelectionEnd({ 
        x: e.clientX,
        y: e.clientY
      });
    }, [isSelecting]);

    const handleMouseUp = useCallback(() => {
      if (isSelecting) {
        setIsSelecting(false);
        
        const pageOffset = getPageOffset();
        // Store viewport coordinates for visual rectangle
        const left = Math.min(selectionStart.x, selectionEnd.x);
        const top = Math.min(selectionStart.y, selectionEnd.y);
        const right = Math.max(selectionStart.x, selectionEnd.x);
        const bottom = Math.max(selectionStart.y, selectionEnd.y);

        // Calculate absolute coordinates for text extraction
        const absLeft = left + pageOffset.x;
        const absTop = top + pageOffset.y;
        const absRight = right + pageOffset.x;
        const absBottom = bottom + pageOffset.y;

        // Extract text using the enhanced extractor with absolute coordinates
        extractTextFromSelection(
          { 
            x: absLeft,
            y: absTop
          },
          { 
            x: absRight,
            y: absBottom
          },
          { left, top, right, bottom }
        ).then((result: ExtractedContent) => {
          // Send selected text to background script
          if (result.text || result.imageData) {
            chrome.runtime.sendMessage({
              type: 'TEXT_SELECTED',
              text: result.text,
              source: result.source,
              imageData: result.imageData,
              timestamp: new Date().toISOString()
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
              } else if (response?.success) {
                console.log('Text selection sent successfully');
                // Clean up the overlay immediately after successful send
                cleanupReactApp();
              }
            });
          } else {
            // Clean up if no content was extracted
            cleanupReactApp();
          }
        }).catch((error: Error) => {
          console.error('Error extracting text:', error);
          // Show error message to user
          const errorDiv = document.createElement('div');
          errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 2147483647;
            color: #dc2626;
          `;
          errorDiv.textContent = error.message;
          document.body.appendChild(errorDiv);
          setTimeout(() => {
            errorDiv.remove();
            // Clean up overlay after error message
            cleanupReactApp();
          }, 3000);
        });
      }
    }, [isSelecting, selectionStart, selectionEnd, getPageOffset]);

    // Calculate selection box dimensions in viewport coordinates
    const selectionStyle = {
      startX: Math.min(selectionStart.x, selectionEnd.x),
      startY: Math.min(selectionStart.y, selectionEnd.y),
      width: Math.abs(selectionEnd.x - selectionStart.x),
      height: Math.abs(selectionEnd.y - selectionStart.y)
    };

    return (
      <div
        ref={containerRef}
        className="text-extractor-selection-tool"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {!isSelecting && (
          <div className="text-extractor-selection-guide">
            Click and drag to select an area
          </div>
        )}
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
