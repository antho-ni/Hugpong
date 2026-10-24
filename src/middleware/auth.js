const db = require("../../db");

function getUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "Please log in." });
  next();
}

function requireStaff(req, res, next) {
  const user = getUserById(req.session.userId);
  if (!user || user.role !== "staff") return res.status(403).json({ error: "Staff only." });
  next();
}

module.exports = { getUserById, requireLogin, requireStaff };
