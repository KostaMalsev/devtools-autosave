import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code
    }, {
      headers: {
        Accept: 'application/json'
      }
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('GitHub auth error:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Failed to authenticate with GitHub',
      details: error.response?.data || error.message 
    });
  }
}

// package.json
{
  "name": "devtools-autosave-api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^12.0.0",
    "axios": "^0.24.0"
  }
}

// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "GITHUB_CLIENT_ID": "@github-client-id",
    "GITHUB_CLIENT_SECRET": "@github-client-secret"
  }
}

// Modified auth.js in the extension
class GitHubAuth {
  constructor() {
    this.clientId = 'YOUR_GITHUB_CLIENT_ID';
    this.redirectUri = chrome.identity.getRedirectURL('github');
    this.scope = 'repo gist';
    // Update this URL with your Vercel deployment URL
    this.apiUrl = 'https://your-vercel-app.vercel.app/api/auth/github';
  }

  async authenticate() {
    const authUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `scope=${encodeURIComponent(this.scope)}`;

    try {
      const responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      });

      const code = new URL(responseUrl).searchParams.get('code');
      if (!code) {
        throw new Error('No code received from GitHub');
      }

      const token = await this.getAccessToken(code);
      await chrome.storage.local.set({ 'github_token': token });
      return token;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  async getAccessToken(code) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get access token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }

  async isAuthenticated() {
    const { github_token } = await chrome.storage.local.get('github_token');
    return !!github_token;
  }

  async logout() {
    await chrome.storage.local.remove('github_token');
  }
}