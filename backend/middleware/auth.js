const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function (req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization?.split(" ")[1] || null);
  if (!token) return res.redirect("/login?error=Please log in to continue.");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
   const user = await User.findById(decoded.id).select("email fullName isPremium startDate endDate");
if (!user) return res.redirect("/login");
req.user = user;
    next();
  } catch (err) {
    //console.error("Authentication error:", err);
    res.redirect("/login?error=Invalid or expired session. Please log in again.");
  }
};