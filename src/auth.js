class GitHubAuth {
    constructor() {
      this.clientId = 'Ov23lik5f0eJVREk5CdX';
      this.scope = 'repo,gist';
      this.githubAuthUrl = `https://github.com/login/oauth/authorize`
    }
   
    async authenticate() {
      try {
        const link = `${githubAuthUrl}?client_id=${this.clientId}&scope=${this.scope}`;
        window.open(link, '_blank');

      } catch (error) {
        console.error('Authentication failed:', error);
        throw error;
      }
    }
   
    async getAccessToken(code) {
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
   
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Token exchange failed: ${errorData.message || response.statusText}`);
        }
   
        const data = await response.json();
        return data.access_token;
      } catch (error) {
        console.error('Token exchange failed:', error);
        throw error;
      }
    }
   
    async isAuthenticated() {
      try {
        const { github_token } = await chrome.storage.local.get('github_token');
        return !!github_token;
      } catch (error) {
        console.error('Error checking auth status:', error);
        return false;
      }
    }
   
    async logout() {
      try {
        await chrome.storage.local.remove('github_token');
        console.log('Successfully logged out');
      } catch (error) {
        console.error('Logout failed:', error);
        throw error;
      }
    }
   }
   
   // Setup auth button
   const authButton = document.createElement('button');
   authButton.className = 'auth-button';
   document.body.insertBefore(authButton, resourcesEl);
   
   const githubAuth = new GitHubAuth();
   
   async function updateAuthButtonState() {
    const isAuthenticated = await githubAuth.isAuthenticated();
    authButton.textContent = isAuthenticated ? 'Sign Out of GitHub' : 'Sign in with GitHub';
    authButton.classList.toggle('signed-in', isAuthenticated);
   }
   
   authButton.addEventListener('click', async () => {
    try {
      const isAuthenticated = await githubAuth.isAuthenticated();
      if (isAuthenticated) {
        await githubAuth.logout();
      } else {
        await githubAuth.authenticate();
      }
      await updateAuthButtonState();
    } catch (error) {
      console.error('Auth action failed:', error);
    }
   });
   
   updateAuthButtonState();