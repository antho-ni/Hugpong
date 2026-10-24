// SQLite database setup. The file hugpong.db is created next to this file on first run.
const path = require("path");
// node:sqlite ships inside Node 22, so nothing needs to be compiled on Windows.
const { DatabaseSync } = require("node:sqlite");

const databasePath = process.env.VERCEL ? "/tmp/hugpong.db" : path.join(__dirname, "hugpong.db");
const db = new DatabaseSync(databasePath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff')),
    student       INTEGER NOT NULL DEFAULT 0,
    stamps        INTEGER NOT NULL DEFAULT 0 CHECK (stamps BETWEEN 0 AND 9),
    cups          INTEGER NOT NULL DEFAULT 0,
    sponsored     INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS menu (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL,
    tag         TEXT,
    price       INTEGER NOT NULL CHECK (price BETWEEN 1 AND 999)
  );

  CREATE TABLE IF NOT EXISTS interest (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const userColumns = db.prepare("PRAGMA table_info(users)").all().map((column) => column.name);
if (!userColumns.includes("student_requested")) {
  db.exec("ALTER TABLE users ADD COLUMN student_requested INTEGER NOT NULL DEFAULT 0");
}
if (!userColumns.includes("student_verified")) {
  db.exec("ALTER TABLE users ADD COLUMN student_verified INTEGER NOT NULL DEFAULT 0");
}
// Accounts created before verification existed keep their previously granted status.
db.prepare("UPDATE users SET student_requested = 1, student_verified = 1 WHERE student = 1 AND student_verified = 0").run();

// Starter menu, inserted only when the table is empty.
const menuCount = db.prepare("SELECT COUNT(*) AS n FROM menu").get().n;
if (menuCount === 0) {
  const insert = db.prepare("INSERT INTO menu (id, name, description, tag, price) VALUES (?, ?, ?, ?, ?)");
  const rows = [
    [1, "Muscovado Latte", "Espresso, steamed milk and muscovado syrup.", "House special", 140],
    [2, "Calamansi Cold Brew", "Slow cold brew over ice with fresh calamansi.", null, 130],
    [3, "Ube Cream Latte", "Espresso with ube cream and milk.", null, 150],
    [4, "Farmer's Brew", "Black drip coffee from the day's partner beans.", null, 100],
  ];
  db.exec("BEGIN");
  try {
    rows.forEach((r) => insert.run(...r));
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

module.exports = db;
