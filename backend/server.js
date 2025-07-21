const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const setUser = require("./middleware/setUser");
const moment = require("moment-timezone");
const rateLimit = require("express-rate-limit");

dotenv.config();
const app = express();

moment.tz.setDefault("Asia/Kolkata");

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000", 
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://checkout.razorpay.com"
        ],
        frameSrc: [
          "'self'",
          "https://api.razorpay.com",
          "https://*.razorpay.com"  // ✅ Needed for Razorpay popup
        ],
        connectSrc: [
          "'self'",
          "https://api.razorpay.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        imgSrc: [
          "'self'",
          "data:"
        ],
        scriptSrcAttr: ["'none'"],
        upgradeInsecureRequests: []
      }
    }
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(morgan("tiny"));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(cookieParser()); // Parse cookies

app.use(setUser); // Attach logged-in user globally to res.locals

app.use(express.static(path.join(__dirname, "../public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000
}).then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch(err => console.error("❌ MongoDB Atlas Error at", moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"), err));

app.get("/", (req, res) => res.redirect("/plans"));
app.use("/", require("./routes/authRoutes"));
app.use("/payment", require("./routes/paymentRoutes"));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime(), timestamp: moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss") });
});

app.get('/privacy', (req, res) => res.render('policies/privacy'));
app.get('/terms', (req, res) => res.render('policies/terms'));
app.get('/refund', (req, res) => res.render('policies/refund'));
app.get('/contact', (req, res) => res.render('policies/contact'));
app.get('/shipping', (req, res) => res.render('policies/shipping'));

app.use((err, req, res, next) => {
  console.error("Server error at", moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"), err.stack);
  res.redirect("/error");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT} at ${moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")}`);
});