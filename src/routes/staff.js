const express = require("express");
const db = require("../../db");
const { publicUser } = require("../services/auth-service");
const { requireLogin, requireStaff } = require("../middleware/auth");

const router = express.Router();

function customerAction(sql, failMessage) {
  return (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad customer id." });
    const info = db.prepare(sql).run(id);
    if (info.changes === 0) return res.status(409).json({ error: failMessage });
    res.json({ customer: publicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id)) });
  };
}

router.use(requireLogin, requireStaff);

router.get("/customers", (req, res) => {
  const rows = db.prepare("SELECT * FROM users WHERE role = 'customer' ORDER BY name COLLATE NOCASE").all();
  res.json({ customers: rows.map(publicUser) });
});

router.post("/customers/:id/student/verify", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad customer id." });
  const info = db.prepare(
    "UPDATE users SET student = 1, student_verified = 1, student_requested = 1 WHERE id = ? AND role = 'customer' AND student_requested = 1"
  ).run(id);
  if (info.changes === 0) return res.status(409).json({ error: "This student verification request is no longer pending." });
  res.json({ customer: publicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id)) });
});

router.post("/customers/:id/student/reject", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad customer id." });
  const info = db.prepare(
    "UPDATE users SET student = 0, student_verified = 0, student_requested = 0 WHERE id = ? AND role = 'customer' AND student_requested = 1"
  ).run(id);
  if (info.changes === 0) return res.status(409).json({ error: "This student verification request is no longer pending." });
  res.json({ customer: publicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id)) });
});

router.post("/customers/:id/stamp", customerAction(
  "UPDATE users SET stamps = stamps + 1, cups = cups + 1 WHERE id = ? AND role = 'customer' AND stamps < 9",
  "That card is full. Redeem the free cup first."
));
router.post("/customers/:id/sponsor", customerAction(
  "UPDATE users SET sponsored = sponsored + 10 WHERE id = ? AND role = 'customer'",
  "Customer not found."
));
router.post("/customers/:id/redeem", customerAction(
  "UPDATE users SET stamps = 0 WHERE id = ? AND role = 'customer' AND stamps >= 9",
  "This card is not ready for a free cup yet."
));

router.put("/menu", (req, res, next) => {
  const prices = req.body?.prices;
  if (!Array.isArray(prices) || prices.length === 0 || prices.length > 50) {
    return res.status(400).json({ error: "Send a list of prices." });
  }
  const valid = prices.every((price) =>
    Number.isInteger(price?.id) && Number.isInteger(price?.price) && price.price >= 1 && price.price <= 999
  );
  if (!valid) return res.status(400).json({ error: "Enter whole prices between 1 and 999." });

  const update = db.prepare("UPDATE menu SET price = ? WHERE id = ?");
  db.exec("BEGIN");
  try {
    prices.forEach((price) => update.run(price.price, price.id));
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    return next(err);
  }
  res.json({ menu: db.prepare("SELECT id, name, description, tag, price FROM menu ORDER BY id").all() });
});

module.exports = router;
