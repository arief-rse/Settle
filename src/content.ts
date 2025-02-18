let isSelecting = false;
let startX = 0;
let startY = 0;
let selectionBox: HTMLDivElement | null = null;

// Create selection box
function createSelectionBox() {
  const box = document.createElement('div');
  box.style.position = 'fixed';
  box.style.border = '2px solid #3b82f6';
  box.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
  box.style.pointerEvents = 'none';
  box.style.zIndex = '10000';
  return box;
}

// Handle mouse down
function handleMouseDown(e: MouseEvent) {
  if (!isSelecting) return;
  
  startX = e.clientX;
  startY = e.clientY;
  
  selectionBox = createSelectionBox();
  document.body.appendChild(selectionBox);
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

// Handle mouse move
function handleMouseMove(e: MouseEvent) {
  if (!isSelecting || !selectionBox) return;
  
  const currentX = e.clientX;
  const currentY = e.clientY;
  
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  
  selectionBox.style.left = `${left}px`;
  selectionBox.style.top = `${top}px`;
  selectionBox.style.width = `${width}px`;
  selectionBox.style.height = `${height}px`;
}

// Handle mouse up
function handleMouseUp() {
  if (!isSelecting || !selectionBox) return;
  
  const rect = selectionBox.getBoundingClientRect();
  const elements = document.elementsFromPoint(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2
  );
  
  let selectedText = '';
  elements.forEach(element => {
    if (element instanceof HTMLElement) {
      const text = element.innerText;
      if (text) selectedText += text + ' ';
    }
  });
  
  if (selectedText.trim()) {
    chrome.runtime.sendMessage({
      type: 'TEXT_SELECTED',
      text: selectedText.trim(),
      timestamp: new Date().toISOString(),
      source: 'text'
    });
  }
  
  cleanup();
}

// Cleanup function
function cleanup() {
  if (selectionBox) {
    selectionBox.remove();
    selectionBox = null;
  }
  
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  isSelecting = false;
  document.body.style.cursor = 'default';
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'START_SELECTION') {
    isSelecting = true;
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mousedown', handleMouseDown);
    sendResponse({ success: true });
  }
});

// Cleanup on script unload
window.addEventListener('unload', cleanup); 