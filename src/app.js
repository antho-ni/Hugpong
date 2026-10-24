const path = require("path");
const express = require("express");
const session = require("express-session");
const { isProduction, sessionSecret } = require("./config/environment");
const authRoutes = require("./routes/auth");
const publicRoutes = require("./routes/public");
const staffRoutes = require("./routes/staff");
const { apiNotFound, errorHandler } = require("./middleware/errors");

const app = express();

app.disable("x-powered-by");
if (isProduction) app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "same-origin");
  res.set("X-Frame-Options", "DENY");
  next();
});
app.use(express.json({ limit: "10kb" }));
app.use(session({
  name: "hk.sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8,
  },
}));

app.use("/api", authRoutes);
app.use("/api", publicRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api", apiNotFound);
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(errorHandler);

module.exports = app;
