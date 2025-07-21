const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  isPremium: { type: Boolean, default: false },
  subscription_id: String,
  startDate: Date,
  endDate: Date,
});

module.exports = mongoose.model("User", userSchema);