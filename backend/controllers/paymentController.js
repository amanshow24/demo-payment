const razorpay = require("../utils/razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const moment = require("moment-timezone");

const PLAN_IDS = {
  weekly: process.env.RAZORPAY_WEEKLY_ID,
  monthly: process.env.RAZORPAY_MONTHLY_ID,
};


exports.createSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id;

    if (!PLAN_IDS[plan]) {
      return res.status(400).json({ error: "Invalid plan selected" });
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: PLAN_IDS[plan],
      customer_notify: 1,
      total_count: 1
    });

res.json({
  subscription_id: subscription.id,
  razorpayKey: process.env.RAZORPAY_KEY_ID,
  userName: req.user.fullName,
  userEmail: req.user.email
});
  } catch (error) {
    console.error("❌ Subscription Creation Error for user ID:", userId, error);
    res.status(500).json({ error: "Failed to create subscription." });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid Signature" });
    }

    // 2️⃣ Signature is valid → Fetch subscription to determine the plan
    const subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);
    const planId = subscription.plan_id;

    const startDate = moment.tz("Asia/Kolkata");
    const endDate = moment.tz(startDate, "Asia/Kolkata");

    if (planId === PLAN_IDS.weekly) {
      endDate.add(7, "days");
    } else if (planId === PLAN_IDS.monthly) {
      endDate.add(1, "month");
    } else {
      endDate.add(1, "month"); // default fallback
    }

    const user = await User.findById(req.user.id);
    user.isPremium = true;
    user.subscription_id = razorpay_subscription_id;
    user.startDate = startDate.toDate();
    user.endDate = endDate.toDate();
    await user.save();

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Payment Verification Error for user ID:", req.user.id, err);
    return res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};