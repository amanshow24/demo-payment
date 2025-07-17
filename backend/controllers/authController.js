const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// GET: Signup page
exports.getSignup = (req, res) => {
  res.render("signup", { error: null });
};

// GET: Login page
exports.getLogin = (req, res) => {
  res.render("login", { error: null });
};

// POST: Signup form submission
exports.signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("signup", { error: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.cookie("token", token, { httpOnly: true });

    // ⏩ New users are taken to plans page by default
    res.redirect("/plans");
  } catch (err) {
    console.error("Signup error:", err);
    res.render("signup", { error: "Something went wrong. Please try again." });
  }
};

// POST: Login form submission
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", { error: "Email not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("login", { error: "Incorrect password." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.cookie("token", token, { httpOnly: true });

    // ✅ Smart redirect based on subscription status
    const now = new Date();
    if (user.isPremium && new Date(user.endDate) > now) {
      return res.redirect("/premium");
    } else if (user.isPremium && new Date(user.endDate) <= now) {
      return res.redirect("/expired");
    } else {
      return res.redirect("/plans");
    }
  } catch (err) {
    console.error("Login error:", err);
    res.render("login", { error: "Something went wrong. Please try again." });
  }
};

// GET: Logout
exports.logout = (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
};
