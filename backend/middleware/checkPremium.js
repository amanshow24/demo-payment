const User = require("../models/User");
const moment = require("moment-timezone");

module.exports = async function (req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    const now = moment.tz("Asia/Kolkata");
    const endDate = moment.tz(user.endDate, "Asia/Kolkata");

    if (!user || !user.isPremium || endDate.isBefore(now)) {
      return res.redirect("/expired");
    }
    req.user = user; // attach user to request
    next();
  } catch (err) {
    console.error("Error in checkPremium middleware for user ID:", req.user?.id, err);
    return res.redirect("/error"); // Redirect to a custom error page
  }
};