const express = require("express");
const { db, hashPassword, publicUser, startSession, verifyPassword } = require("../services/auth-service");
const { getUserById } = require("../middleware/auth");

const router = express.Router();
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_NAME_LENGTH = 60;
const MAX_EMAIL_LENGTH = 120;
const MAX_PASSWORD_LENGTH = 72;

const failures = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;
function recentFails(key) {
  const now = Date.now();
  const list = (failures.get(key) || []).filter((time) => now - time < WINDOW_MS);
  failures.set(key, list);
  return list;
}
function isLocked(key) {
  return recentFails(key).length >= MAX_FAILS;
}
function addFail(key) {
  recentFails(key).push(Date.now());
}

router.post("/register", (req, res, next) => {
  const { name, email, password, student } = req.body || {};
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedName || normalizedName.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ error: "Enter your name (up to 60 characters).", field: "name" });
  }
  if (!EMAIL_RE.test(normalizedEmail) || normalizedEmail.length > MAX_EMAIL_LENGTH) {
    return res.status(400).json({ error: "Enter an email like name@example.com.", field: "email" });
  }
  if (typeof password !== "string" || password.length < 8 || password.length > MAX_PASSWORD_LENGTH) {
    return res.status(400).json({ error: "Use a password with 8 to 72 characters.", field: "password" });
  }

  let info;
  try {
    info = db
      .prepare("INSERT INTO users (name, email, password_hash, student, student_requested, student_verified) VALUES (?, ?, ?, 0, ?, 0)")
      .run(normalizedName, normalizedEmail, hashPassword(password), student ? 1 : 0);
  } catch (err) {
    if (/UNIQUE constraint failed/.test(err.message)) {
      return res.status(409).json({ error: "That email is already registered. Try logging in." });
    }
    return next(err);
  }

  startSession(req, Number(info.lastInsertRowid), res, 201, (err) => {
    console.error("Could not start a session after registration:", err);
    res.status(500).json({ error: "Account created, but we could not start your session. Please log in." });
  });
});

router.post("/login", (req, res, next) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail || typeof password !== "string" || !password) {
    return res.status(400).json({ error: "Enter your email and password.", field: !normalizedEmail ? "email" : "password" });
  }
  if (normalizedEmail.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(normalizedEmail)) {
    return res.status(400).json({ error: "Enter a valid email address.", field: "email" });
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return res.status(400).json({ error: "Enter a valid password.", field: "password" });
  }

  const key = req.ip + "|" + normalizedEmail;
  if (isLocked(key)) return res.status(429).json({ error: "Too many tries. Wait a few minutes and try again." });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail);
  if (!user || !verifyPassword(user, password)) {
    addFail(key);
    return res.status(401).json({ error: "Email or password is not right." });
  }

  failures.delete(key);
  startSession(req, user.id, res, 200, (err) => {
    console.error("Could not start a session after login:", err);
    next(new Error("We could not start your session. Please try again."));
  });
});

router.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Could not end session:", err);
      return next(new Error("Could not log you out. Please try again."));
    }
    res.clearCookie("hk.sid");
    res.json({ ok: true });
  });
});

router.get("/me", (req, res) => {
  const user = req.session.userId ? getUserById(req.session.userId) : null;
  res.json({ user: user ? publicUser(user) : null });
});

module.exports = router;
