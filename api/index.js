const app = require("../src/app");
const { ensureStaffAccount } = require("../server");

ensureStaffAccount();

module.exports = app;
