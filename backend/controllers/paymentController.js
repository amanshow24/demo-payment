const razorpay = require("../utils/razorpay");
const crypto = require("crypto");
const User = require("../models/User");

const PLAN_IDS = {
  weekly: process.env.RAZORPAY_WEEKLY_ID ,     // ← Your real Razorpay Plan ID for ₹2/week
  monthly: process.env.RAZORPAY_MONTHLY_ID , // ← Your real Razorpay Plan ID for ₹5/month
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
      total_count: 1, // Billing happens automatically every period (weekly/monthly)
    });

    res.json({
      subscription_id: subscription.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Subscription Error:", error);
    res.status(500).json({ error: "Subscription failed" });
  }
};

exports.verifyPayment = async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
  } = req.body;

  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest("hex");

  if (generated_signature === razorpay_signature) {
    const user = await User.findById(req.user.id);
    const startDate = new Date();
    const endDate = new Date();

    // Save end date based on which plan user bought
    const boughtWeekly = user.subscription_id?.includes("weekly") || PLAN_IDS.weekly === razorpay_subscription_id;
    const boughtMonthly = user.subscription_id?.includes("monthly") || PLAN_IDS.monthly === razorpay_subscription_id;

    if (boughtWeekly) {
      endDate.setDate(endDate.getDate() + 7);
    } else if (boughtMonthly) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1); // Default to monthly
    }

    user.isPremium = true;
    user.subscription_id = razorpay_subscription_id;
    user.startDate = startDate;
    user.endDate = endDate;
    await user.save();

    return res.json({ success: true });
  }

  return res.status(400).json({ success: false, message: "Invalid Signature" });
};
