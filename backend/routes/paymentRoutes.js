const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { createSubscription, verifyPayment } = require("../controllers/paymentController");

router.post("/create-subscription", auth, createSubscription);
router.post("/verify", auth, verifyPayment);

module.exports = router;