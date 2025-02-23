// GitHub Gist integration for DevTools Autosave
class GitHubGistManager {
    constructor(token) {
      this.token = token;
    }
  
    // Create a gist from saved resources
    async createGist(resources, pageUrl) {
      const files = {};
      
      // Create filename from URL
      const sanitizedUrl = pageUrl.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
      const description = `DevTools Autosave: ${pageUrl}`;
  
      // Process each resource into gist files
      for (let key in resources) {
        const resource = resources[key];
        
        if (key === DevToolsAutosaveSavedResourceReader.pageHTMLKey) {
          // Handle page HTML
          files['page.html'] = {
            content: decodeUnicode(resource)
          };
        } else {
          // Handle other resources
          const filename = resource.url.split('/').pop() || 'resource';
          const extension = this.getFileExtension(resource.type);
          files[`${filename}.${extension}`] = {
            content: decodeUnicode(resource.content)
          };
        }
      }
  
      // Create the gist
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description,
          files: files,
          public: false
        })
      });
  
      if (!response.ok) {
        throw new Error(`Failed to create gist: ${response.statusText}`);
      }
  
      return await response.json();
    }
  
    // Helper to determine file extension based on resource type
    getFileExtension(type) {
      const typeMap = {
        'text/css': 'css',
        'text/javascript': 'js',
        'text/html': 'html',
        'application/json': 'json',
        'inspector-stylesheet': 'css'
      };
      return typeMap[type] || 'txt';
    }
  }
  
  // Extend the existing DOMContentLoaded event listener
  document.addEventListener('DOMContentLoaded', async () => {
    // ... existing code ...
  
    // Add save to gist button
    const saveGistButton = document.createElement('button');
    saveGistButton.className = 'gist-button';
    saveGistButton.textContent = 'Save to GitHub Gist';
    document.body.insertBefore(saveGistButton, resourcesEl);
  
    // Handle saving to gist
    saveGistButton.addEventListener('click', async () => {
      try {
        // Get the stored token
        const storage = await chrome.storage.local.get('github_auth_token');
        const token = storage.github_auth_token;
  
        if (!token) {
          throw new Error('Please sign in with GitHub first');
        }
  
        // Get current page URL
        const urlScript = 'window.location.href';
        const [pageUrl] = await new Promise(resolve => {
          chrome.devtools.inspectedWindow.eval(urlScript, (result, isException) => {
            resolve([result, isException]);
          });
        });
  
        // Get saved resources
        const savedResourceReader = DevToolsAutosaveSavedResourceReader;
        const savedResources = await savedResourceReader.getSavedResources();
  
        if (Object.keys(savedResources).length === 0) {
          throw new Error('No resources to save');
        }
  
        // Create gist
        const gistManager = new GitHubGistManager(token);
        const gist = await gistManager.createGist(savedResources, pageUrl);
  
        // Show success message
        saveGistButton.textContent = 'Saved to Gist ✓';
        saveGistButton.classList.add('success');
        
        // Open gist in new tab
        window.open(gist.html_url, '_blank');
  
        // Reset button after delay
        setTimeout(() => {
          saveGistButton.textContent = 'Save to GitHub Gist';
          saveGistButton.classList.remove('success');
        }, 3000);
  
      } catch (error) {
        console.error('Failed to save gist:', error);
        saveGistButton.textContent = error.message;
        saveGistButton.classList.add('error');
  
        // Reset button after delay
        setTimeout(() => {
          saveGistButton.textContent = 'Save to GitHub Gist';
          saveGistButton.classList.remove('error');
        }, 3000);
      }
    });
  });