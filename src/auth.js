class GitHubAuth {
    constructor() {
      this.clientId = 'Ov23lik5f0eJVREk5CdX';
      this.scope = 'repo,gist';
      this.githubAuthUrl = `https://github.com/login/oauth/authorize`
    }
   
    async authenticate() {
      try {
        const link = `${this.githubAuthUrl}?client_id=${this.clientId}&scope=${this.scope}`;
        window.open(link, '_blank');

      } catch (error) {
        console.error('Authentication failed:', error);
        throw error;
      }
    }
   
    async isAuthenticated() {
      try {
        const github_token  = await chrome.storage.local.get('github_auth_token');
        console.log('we have a token:',github_token)
        return Object.keys(github_token).length !== 0;
      } catch (error) {
        console.error('Error checking auth status:', error);
        return false;
      }
    }
   
    async logout() {
      try {
        await chrome.storage.local.remove('github_auth_token');
        console.log('Successfully logged out');
      } catch (error) {
        console.error('Logout failed:', error);
        throw error;
      }
    }
   }