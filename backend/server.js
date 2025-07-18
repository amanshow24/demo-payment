const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const setUser = require("./middleware/setUser");

dotenv.config();
const app = express();


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

app.use(morgan("tiny"));
app.use(cors()); // Allow frontend communication (local)
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(cookieParser()); // Parse cookies


app.use(setUser); // Attach logged-in user globally to res.locals


app.use(express.static(path.join(__dirname, "../public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


mongoose.connect(process.env.MONGO_URI, {
}).then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch(err => console.error("❌ MongoDB Atlas Error:", err));


app.get("/", (req, res) => res.redirect("/plans"));
app.use("/", require("./routes/authRoutes"));
app.use("/payment", require("./routes/paymentRoutes"));

app.get("/health", (req,res)=> {
res.status(200).send("OK");
})

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
