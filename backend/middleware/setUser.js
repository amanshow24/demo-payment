// In middleware/setUser.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const moment = require("moment-timezone");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.split(" ")[1] || null);
    if (!token) {
      res.locals.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!req.user) { // Only query if auth middleware hasn't set req.user
      const user = await User.findById(decoded.id).select("email fullName isPremium startDate endDate");
      if (user) {
        const now = moment.tz("Asia/Kolkata");
        const endDate = user.endDate ? moment(user.endDate) : null;
        if (user.isPremium && endDate && endDate.diff(now, "days") <= 3) {
          res.locals.expiredSoon = true;
        }
        res.locals.user = user;
      } else {
        res.locals.user = null;
      }
    } else {
      const now = moment.tz("Asia/Kolkata");
      const endDate = req.user.endDate ? moment(req.user.endDate) : null;
      if (req.user.isPremium && endDate && endDate.diff(now, "days") <= 3) {
        res.locals.expiredSoon = true;
      }
      res.locals.user = req.user;
    }
    next();
  } catch (err) {
    console.error("Error in setUser middleware:", err);
    res.locals.user = null;
    next();
  }
};