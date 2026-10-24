// Hugpong Kape server entry point.
const bcrypt = require("bcryptjs");
const db = require("./db");
const app = require("./src/app");
const { port } = require("./src/config/environment");

function ensureStaffAccount() {
  if (db.prepare("SELECT 1 FROM users WHERE role = 'staff' LIMIT 1").get()) return;

  const email = (process.env.STAFF_EMAIL || "staff@hugpong.demo").toLowerCase();
  const password = process.env.STAFF_PASSWORD || "barista-demo";
  db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'staff')").run(
    "Shop staff",
    email,
    bcrypt.hashSync(password, 10)
  );
  console.log(`Created the staff account ${email}. Change the password with STAFF_PASSWORD before sharing this site.`);
}

module.exports = { ensureStaffAccount };

if (require.main === module) {
  ensureStaffAccount();
  app.listen(port, () => console.log(`Hugpong Kape is running at http://localhost:${port}`));
}
