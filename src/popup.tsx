import React from 'react'
import ReactDOM from 'react-dom/client'
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
    <div className="p-4 w-[300px] flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Rectangle Reader Buddy</h2>
      <p className="text-gray-600 text-sm">
        Click the button below to start selecting text from the webpage.
      </p>
      <Button onClick={handleStartSelection}>
        Start Selection
      </Button>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
)
