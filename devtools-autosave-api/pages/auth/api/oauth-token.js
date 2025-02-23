export default async function handler(req, res) {
  const https = require("https");

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  // Construct GitHub OAuth token exchange URL
  const url = `https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`;

  try {
    const { status, data } = await getRequest(url);
    return res.status(status).json(JSON.parse(data));
  } catch (error) {
    console.error("GitHub auth error:", error);
    return res.status(500).json({ error: "Failed to authenticate with GitHub" });
  }

  // Function to make an HTTPS GET request
  function getRequest(url) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, (resp) => {
        let data = "";
        resp.on("data", (chunk) => {
          data += chunk;
        });
        resp.on("end", () => {
          resolve({
            status: resp.statusCode,
            data: data,
          });
        });
      });

      req.on("error", (error) => {
        reject(error);
      });
    });
  }
}
