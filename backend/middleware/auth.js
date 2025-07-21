const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");

module.exports = function (req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization?.split(" ")[1] || null);
  if (!token) return res.redirect("/login");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Authentication error for token:", token, err);
    res.redirect("/login");
  }
};