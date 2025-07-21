 const jwt = require("jsonwebtoken");
const User = require("../models/User");
const moment = require("moment-timezone");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.locals.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("email fullName");
    if (user) {
      const now = moment.tz("Asia/Kolkata");
      const endDate = moment.tz(user.endDate, "Asia/Kolkata");
      if (user.isPremium && endDate.diff(now, "days") <= 3) {
        res.locals.expiredSoon = true; // Flag for near expiry warning
      }
    }
    res.locals.user = user; // available in all EJS files
    next();
  } catch (err) {
    console.error("Error in setUser middleware:", err);
    res.locals.user = null;
    next();
  }
};  