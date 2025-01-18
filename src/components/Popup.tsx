import type { FC } from 'react';
import { useEffect } from 'react';

export const Popup: FC = () => {
  useEffect(() => {
    // Start selection immediately when popup opens
    chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_SELECTION',
          payload: true
        });
      }
    });
    window.close();
  }, []);

  return (
    <div className="p-4 w-[300px]">
      <p className="text-gray-600 text-sm">
        Starting selection mode...
      </p>
    </div>
  );
};
