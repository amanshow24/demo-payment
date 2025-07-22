const User = require("../models/User");

const moment = require("moment-timezone");
module.exports = async function (req, res, next) {
  try {
    const now = moment.tz("Asia/Kolkata").toDate();
    if (!req.user || !req.user.isPremium || !req.user.endDate || req.user.endDate < now) {
      return res.redirect("/expired");
    }
    next();
  } catch (err) {
    console.error("Error in checkPremium middleware for user ID:", req.user?.id, err);
    return res.redirect("/error");
  }
};