document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('startSelection');
  if (button) {
    button.addEventListener('click', () => {
      chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'TOGGLE_SELECTION',
            payload: true
          });
        }
      });
      window.close();
    });
  }
});
