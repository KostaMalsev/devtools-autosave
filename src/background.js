// background.js
chrome.tabs.onUpdated.addListener(
  function(tabId, changeInfo, tab) {
    // Check if this is our auth page with a code
    if (changeInfo.url && changeInfo.url.startsWith('https://devtools-autosave.vercel.app/auth.html')) {
      try {
        const url = new URL(changeInfo.url);
        const code = url.searchParams.get('code');
        
        if (code) {
          // Make API request directly from background script
          fetch('https://devtools-autosave.vercel.app/api/oauth-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: code })
          })
          .then(response => response.json())
          .then(data => {
            if (data.access_token) {
              // Store token in extension's storage
              chrome.storage.local.set({ 'github_auth_token': data.access_token }, () => {
                console.log('Token stored successfully');
                // Close the auth tab after successful storage
                chrome.tabs.remove(tabId);
              });
            }
          })
          .catch(error => {
            console.error('Token exchange failed:', error);
          });
        }
      } catch (error) {
        console.error('Error parsing URL:', error);
      }
    }
  }
);