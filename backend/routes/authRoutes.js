const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const checkPremium = require("../middleware/checkPremium");
const { getSignup, getLogin, signup, login, logout } = require("../controllers/authController");
const User = require("../models/User");

// 🧠 Fun content pools for Premium Page
const techFacts = [
  "💾 The first computer bug was an actual moth.",
  "🟨 JavaScript was created in just 10 days.",
  "📧 The first email was sent in 1971.",
  "🌐 HTML was invented by Tim Berners-Lee in 1993.",
  "🔗 The first website is still online — info.cern.ch",
];

const devJokes = [
  "😎 Why do programmers prefer dark mode? Because light attracts bugs!",
  "💡 There are only 10 types of people: those who understand binary, and those who don’t.",
  "🍺 A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
  "🧠 How many programmers does it take to change a light bulb? None — it's a hardware problem.",
  "💍 I told my wife I was writing a JavaScript app. She said I never callback.",
];

const quotes = [
  "“Code is like humor. When you have to explain it, it’s bad.” – Cory House",
  "“Any fool can write code that a computer can understand. Good programmers write code that humans can understand.” – Martin Fowler",
  "“First, solve the problem. Then, write the code.” – John Johnson",
  "“Programs must be written for people to read.” – Harold Abelson",
  "“Simplicity is the soul of efficiency.” – Austin Freeman",
];

// ✅ Auth routes (Signup / Login / Logout)
router.get("/signup", getSignup);
router.post("/signup", signup);
router.get("/login", getLogin);
router.post("/login", login);
router.get("/logout", logout);

// 💰 Subscription Plans Page
router.get("/plans", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user.isPremium && new Date(user.endDate) > new Date()) {
    return res.redirect("/premium");
  }
  res.render("plans", { razorpayKey: process.env.RAZORPAY_KEY_ID });
});

// 🌟 Premium Content Page
router.get("/premium", auth, checkPremium, (req, res) => {
  const fact = techFacts[Math.floor(Math.random() * techFacts.length)];
  const joke = devJokes[Math.floor(Math.random() * devJokes.length)];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  res.render("premium", { user: req.user, fact, joke, quote });
});

// 🚫 Expired Subscription Page
router.get("/expired", (req, res) => {
  res.render("expired");
});

module.exports = router;
