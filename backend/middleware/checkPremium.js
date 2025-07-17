const User = require("../models/User");

module.exports = async function (req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isPremium || new Date(user.endDate) < new Date()) {
      return res.redirect("/expired");
    }
    req.user = user; // attach user to request
    next();
  } catch (err) {
    console.error("Error in checkPremium middleware:", err);
    return res.status(500).send("Server Error");
  }
};
