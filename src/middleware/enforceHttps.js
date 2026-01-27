function enforceHttps(req, res, next) {
  const nodeEnv = process.env.NODE_ENV || "development";
  if (nodeEnv !== "production") return next();

  const proto = req.get("x-forwarded-proto");
  if (proto && proto !== "https") {
    const host = req.get("host");
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }
  return next();
}

module.exports = { enforceHttps };


