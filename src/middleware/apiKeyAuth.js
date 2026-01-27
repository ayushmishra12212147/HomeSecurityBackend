function apiKeyAuth(req, res, next) {
  const expected = process.env.ANDROID_API_KEY;
  if (!expected) {
    return res.status(500).json({ error: "Server not configured" });
  }
  const apiKey = req.get("x-api-key");
  if (!apiKey || apiKey !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

module.exports = { apiKeyAuth };


