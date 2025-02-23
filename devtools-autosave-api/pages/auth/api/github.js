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