import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from './components/ui/button'
import './index.css'

const Popup = () => {
  const handleStartSelection = () => {
    chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'START_SELECTION'
        });
        window.close();
      }
    });
  };

  return (
    <div className="p-4 w-[300px] h-[200px] bg-white flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Rectangle Reader Buddy</h2>
      <p className="text-gray-600 text-sm my-4">
        Click the button below to start selecting text from the webpage.
      </p>
      <Button onClick={handleStartSelection}>
        Start Selection
      </Button>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <Popup />
  </StrictMode>
)
