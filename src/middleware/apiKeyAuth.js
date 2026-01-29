function apiKeyAuth(req, res, next) {
  const expected = process.env.ANDROID_API_KEY;
  if (!expected) {
    console.error("[apiKeyAuth] ANDROID_API_KEY not configured in environment");
    return res.status(500).json({ error: "Server not configured" });
  }
  const apiKey = req.get("x-api-key");
  if (!apiKey) {
    console.warn("[apiKeyAuth] Missing x-api-key header");
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (apiKey !== expected) {
    console.warn("[apiKeyAuth] Invalid API key provided");
    return res.status(401).json({ error: "Unauthorized" });
  }
  console.log("[apiKeyAuth] API key validated successfully");
  return next();
}

module.exports = { apiKeyAuth };


