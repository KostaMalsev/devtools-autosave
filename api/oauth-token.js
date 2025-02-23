export default async function handler(req, res) {
  const https = require("https");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  // GitHub OAuth URL
  const url = "https://github.com/login/oauth/access_token";
  const postData = JSON.stringify({
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code: code
  });

  try {
    const { status, data } = await postRequest(url, postData);
    
    // ✅ Fix: Ensure `data` is JSON before parsing
    const jsonData = JSON.parse(data);
    
    return res.status(status).json(jsonData);
  } catch (error) {
    console.error("GitHub auth error:", error);
    return res.status(500).json({ error: "Failed to authenticate with GitHub", details: error.message });
  }

  //POST request to GitHub with `Accept: application/json`
  function postRequest(url, postData) {
    return new Promise((resolve, reject) => {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        }
      };

      const req = https.request(url, options, (resp) => {
        let data = "";
        resp.on("data", (chunk) => {
          data += chunk;
        });
        resp.on("end", () => {
          resolve({ status: resp.statusCode, data });
        });
      });

      req.on("error", (error) => reject(error));
      req.write(postData);
      req.end();
    });
  }
}
