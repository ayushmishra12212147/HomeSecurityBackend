function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;
  const message = err.expose ? err.message : "Internal Server Error";
  res.status(status).json({ error: message });
}

module.exports = { errorHandler };


