function apiNotFound(req, res) {
  res.status(404).json({ error: "Not found." });
}

function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Bad request." });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request is too large." });

  console.error(`${req.method} ${req.originalUrl}`, err);
  if (res.headersSent) return next(err);

  const status = err.status && err.status >= 400 && err.status < 500 ? err.status : 500;
  res.status(status).json({
    error: status < 500 ? err.message : "Something went wrong on the server.",
  });
}

module.exports = { apiNotFound, errorHandler };
