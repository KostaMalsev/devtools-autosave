// contentscript.js - Receives auth code, makes API request, and stores token
const AUTH_TOKEN_KEY = 'github_auth_token';

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

    console.log('Got message in content scrip listner',request.message,request.code)

    if (request.message === 'AUTH_CODE') {
      // Make request to backend with the code
      fetch('https://devtools-autosave.vercel.app/api/oauth-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: request.code })
      })
      .then(response => response.json())
      .then(data => {
        console.log('got data from backend:',data)
        if (data.access_token) {
          // Store token in local storage
          chrome.storage.local.set({ [AUTH_TOKEN_KEY]: data.access_token }, () => {
            console.log('Token stored successfully');
            
            // Send message back to background script about successful storage
            chrome.runtime.sendMessage({
              message: 'TOKEN_STORED',
              success: true
            });
            
            // Update any page elements if needed
            const statusMessage = document.getElementById('statusMessage');
            if (statusMessage) {
              statusMessage.textContent = 'Authentication successful! You can close this tab.';
              statusMessage.classList.add('success');
            }
          });
        } else {
          throw new Error('No access token received');
        }
      })
      .catch(error => {
        console.error('Token exchange or storage failed:', error);
        
        // Update page with error
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
          statusMessage.textContent = 'Authentication failed. Please try again.';
          statusMessage.classList.add('error');
        }
        
        // Notify background script of failure
        chrome.runtime.sendMessage({
          message: 'TOKEN_ERROR',
          error: error.message
        });
      });
    }
});