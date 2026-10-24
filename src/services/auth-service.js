const bcrypt = require("bcryptjs");
const db = require("../../db");
const { getUserById } = require("../middleware/auth");

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    student: !!user.student_verified,
    studentPending: !!user.student_requested && !user.student_verified,
    stamps: user.stamps,
    cups: user.cups,
    sponsored: user.sponsored,
  };
}

function startSession(req, userId, res, statusCode, next) {
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.userId = userId;
    res.status(statusCode).json({ user: publicUser(getUserById(userId)) });
  });
}

function verifyPassword(user, password) {
  return bcrypt.compareSync(password, user ? user.password_hash : DUMMY_HASH);
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

module.exports = { db, hashPassword, publicUser, startSession, verifyPassword };
