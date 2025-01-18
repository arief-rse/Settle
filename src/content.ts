let isSelecting = false;
let selectionBox: HTMLDivElement | null = null;
let startX = 0;
let startY = 0;

// Create selection box element
function createSelectionBox(x: number, y: number): HTMLDivElement {
  const box = document.createElement('div');
  box.style.position = 'fixed';
  box.style.border = '2px solid #3b82f6';
  box.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
  box.style.left = `${x}px`;
  box.style.top = `${y}px`;
  box.style.zIndex = '10000';
  return box;
}

// Mouse event handlers
function onMouseDown(e: MouseEvent) {
  if (!isSelecting) return;
  
  startX = e.clientX;
  startY = e.clientY;
  
  selectionBox = createSelectionBox(startX, startY);
  document.body.appendChild(selectionBox);
}

function onMouseMove(e: MouseEvent) {
  if (!isSelecting || !selectionBox) return;
  
  const width = e.clientX - startX;
  const height = e.clientY - startY;
  
  selectionBox.style.width = `${Math.abs(width)}px`;
  selectionBox.style.height = `${Math.abs(height)}px`;
  selectionBox.style.left = `${width > 0 ? startX : e.clientX}px`;
  selectionBox.style.top = `${height > 0 ? startY : e.clientY}px`;
}

function onMouseUp(e: MouseEvent) {
  if (!isSelecting || !selectionBox) return;
  
  const width = Math.abs(e.clientX - startX);
  const height = Math.abs(e.clientY - startY);
  
  // Only process if selection is big enough
  if (width >= 20 && height >= 20) {
    chrome.runtime.sendMessage({
      type: 'EXTRACT_TEXT',
      payload: {
        startPos: { x: startX, y: startY },
        endPos: { x: e.clientX, y: e.clientY }
      }
    });
  }
  
  cleanup();
}

function cleanup() {
  if (selectionBox) {
    document.body.removeChild(selectionBox);
    selectionBox = null;
  }
}

// Listen for messages from extension
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE_SELECTION') {
    isSelecting = message.payload;
    document.body.style.cursor = isSelecting ? 'crosshair' : 'default';
    
    if (isSelecting) {
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    } else {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      cleanup();
    }
  } else if (message.type === 'EXTRACTION_COMPLETE') {
    // Create floating result box
    const resultBox = document.createElement('div');
    resultBox.style.position = 'fixed';
    resultBox.style.left = '50%';
    resultBox.style.top = '20px';
    resultBox.style.transform = 'translateX(-50%)';
    resultBox.style.padding = '15px';
    resultBox.style.backgroundColor = 'white';
    resultBox.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    resultBox.style.borderRadius = '8px';
    resultBox.style.zIndex = '10001';
    resultBox.textContent = message.payload;
    
    document.body.appendChild(resultBox);
    setTimeout(() => document.body.removeChild(resultBox), 5000);
  }
});
