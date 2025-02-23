// Monitors tab updates and sends messages to content script
chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
      // Check if this is our auth page with a code
      if (changeInfo.url && changeInfo.url.startsWith('https://devtools-autosave.vercel.app/auth.html')) {
        try {
          const url = new URL(changeInfo.url);
          const code = url.searchParams.get('code');
          
          if (code) {
            // Send the code to content script
            chrome.tabs.sendMessage(tabId, {
              message: 'AUTH_CODE',
              code: code
            });
          }
        } catch (error) {
          console.error('Error parsing URL:', error);
        }
      }
    }
  );