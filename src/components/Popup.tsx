import type { FC } from 'react';
import { Button } from './ui/button';

export const Popup: FC = () => {
  const handleStartSelection = () => {
    chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_SELECTION',
          payload: true
        });
      }
    });
    window.close();
  };

  return (
    <div className="p-4 w-[300px]">
      <p className="text-gray-600 text-sm mb-4">
        Click the button below to start selecting text from the webpage.
      </p>
      <Button 
        onClick={handleStartSelection}
        className="w-full bg-blue-500 hover:bg-blue-600"
      >
        Start Selection
      </Button>
    </div>
  );
};
