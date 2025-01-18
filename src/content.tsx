import { createRoot } from 'react-dom/client';
import SelectionTool from './components/SelectionTool';

// Create container for React component
function createSelectionToolContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'selection-tool-container';
  document.body.appendChild(container);
  return container;
}

// Listen for messages from extension
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE_SELECTION') {
    if (message.payload) {
      // Create container and mount React component
      const container = createSelectionToolContainer();
      const root = createRoot(container);
      
      root.render(
        <SelectionTool
          onComplete={(text) => {
            chrome.runtime.sendMessage({
              type: 'EXTRACTION_COMPLETE',
              payload: text
            });
            // Cleanup
            root.unmount();
            container.remove();
          }}
          onCancel={() => {
            // Cleanup
            root.unmount();
            container.remove();
          }}
        />
      );
    }
  }
});
