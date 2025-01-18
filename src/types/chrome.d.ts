interface Chrome {
  tabs: {
    query: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<chrome.tabs.Tab[]>;
    captureVisibleTab: () => Promise<string>;
  };
  scripting: {
    insertCSS: (details: { target: { tabId: number }; css: string }) => Promise<void>;
  };
}

declare global {
  interface Window {
    chrome: Chrome;
  }
  const chrome: Chrome;
}

export {};