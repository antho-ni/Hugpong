const express = require("express");
const db = require("../../db");

const router = express.Router();
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

router.get("/menu", (req, res) => {
  const rows = db.prepare("SELECT id, name, description, tag, price FROM menu ORDER BY id").all();
  res.json({ menu: rows });
});

router.post("/interest", (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return res.status(400).json({ error: "Enter an email like name@example.com." });
  }
  db.prepare("INSERT OR IGNORE INTO interest (email) VALUES (?)").run(email);
  res.status(201).json({ ok: true });
});

module.exports = router;
