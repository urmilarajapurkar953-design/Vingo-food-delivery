import express from "express";
import isAuth from "../middleware/isAuth.js";
import Razorpay from "razorpay";
import crypto from "crypto"; // Built-in node package needed for signature verification

const paymentRouter = express.Router();

// Initialize Razorpay SDK using variables safely extracted from your .env
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =======================================================
// 1. POST /api/payment/razor-order (Create Reference)
// =======================================================
paymentRouter.post("/razor-order", isAuth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid order total amount." });
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // Convert INR Rupees to Paisa subunits
      currency: "INR",
      receipt: `rcpt_order_${Date.now()}`,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    return res.status(200).json({
      success: true,
      razorpayOrder,
    });
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    return res.status(500).json({ success: false, message: "Could not initialize Gateway." });
  }
});

// =======================================================
// 2. NEW: POST /api/payment/verify (Verify Digital Signature)
// =======================================================
paymentRouter.post("/verify", isAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing required tracking tokens." });
    }

    // Generate cryptographic token string to match signature block
    const tokenPayload = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET) // Uses secret key to verify authenticity
      .update(tokenPayload.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      return res.status(200).json({
        success: true,
        message: "Payment signature authenticated successfully."
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Security Tampering Warning: Signature block invalid!"
      });
    }
  } catch (error) {
    console.error("Signature verification error trace:", error);
    return res.status(500).json({ success: false, message: "Internal cryptography execution error." });
  }
});

export default paymentRouter;