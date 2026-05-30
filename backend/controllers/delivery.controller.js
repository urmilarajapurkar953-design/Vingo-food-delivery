import nodemailer from "nodemailer";
import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";

// ==========================================
// NODEMAILER CONFIGURATION
// ==========================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // Changed from EMAIL_USER
    pass: process.env.PASS
  }
});

// ==========================================
// 1. ACCEPT DELIVERY JOB
// ==========================================
export const acceptDeliveryJob = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const driverId = req.user?._id; 

    if (!driverId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Driver session missing." });
    }

    const assignment = await DeliveryAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Delivery assignment not found." });
    }

    if (assignment.status === "assigned" || assignment.assignedTo) {
      return res.status(400).json({ 
        success: false, 
        message: "Too late! This order has already been accepted by another agent." 
      });
    }

    assignment.assignedTo = driverId;
    assignment.status = "assigned";
    assignment.acceptedAt = new Date();
    await assignment.save();

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: assignment.order, "shopOrders._id": assignment.shopOrderId },
      { 
        $set: { 
          "shopOrders.$.status": "Driver Assigned",
          "shopOrders.$.deliveryBoy": driverId 
        } 
      },
      { new: true }
    ).lean();

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const driverProfile = await User.findById(driverId).select("name fullName phone email role currentLocation").lean();

    const io = req.app.get("io");
    if (io) {
      if (assignment.broadcasted && Array.isArray(assignment.broadcasted)) {
        assignment.broadcasted.forEach(notifiedDriverId => {
          if (notifiedDriverId.toString() !== driverId.toString()) {
            io.to(notifiedDriverId.toString()).emit("removeDeliveryJobCard", { assignmentId: assignment._id });
          }
        });
      }

      const userTargetRoomId = updatedOrder.user.toString();
      io.to(userTargetRoomId).emit("orderStatusUpdated", {
        masterOrderId: updatedOrder._id.toString(),
        subOrderId: assignment.shopOrderId.toString(),
        newStatus: "Driver Assigned",
        deliveryBoy: driverProfile
      });
    }

    return res.status(200).json({ success: true, message: "Job accepted successfully!", assignment });

  } catch (error) {
    console.error("Crash in acceptDeliveryJob:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. INITIATE DROP-OFF (GENERATE & SEND OTP EMAIL)
// ==========================================
export const sendDeliveryOTP = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const driverId = req.user?._id;

    // 1. Fetch assignment context records cleanly
    const assignment = await DeliveryAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment details not found." });
    }

    if (assignment.assignedTo?.toString() !== driverId?.toString()) {
      return res.status(403).json({ success: false, message: "Access denied. You are not the assigned rider." });
    }

    // 2. Find the master order document and fully populate customer profile fields
    const order = await Order.findById(assignment.order).populate("user", "email name");
    if (!order) {
      return res.status(404).json({ success: false, message: "Master order record not found." });
    }

    // Locate the unique shop sub-order structure loop segment
    const shopOrder = order.shopOrders.id(assignment.shopOrderId);
    if (!shopOrder) {
      return res.status(404).json({ success: false, message: "Shop order subset layout not found." });
    }

    // 3. Generate a secure random 6-digit pin string mapping
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set parameters on your document with a strict 10-minute expiration window
    shopOrder.deliveryOTP = generatedOTP;
    shopOrder.deliveryOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    await order.save();

    // 4. Draft transactional payload HTML layouts
    const mailOptions = {
      from: `"Food Delivery App" <${process.env.EMAIL_USER}>`,
      to: order.user.email,
      subject: `🔒 Secure Verification PIN for Order #${order._id.toString().slice(-6)}`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; max-width: 480px; border: 1px solid #f2f2f2; border-radius: 24px; margin: 0 auto;">
          <h2 style="color: #ff4d2d; margin-top: 0;">Your delivery has arrived!</h2>
          <p style="color: #4a4a4a; font-size: 14px;">Hello <strong>${order.user.name || 'Customer'}</strong>,</p>
          <p style="color: #4a4a4a; font-size: 14px; line-height: 1.5;">The rider is currently at your doorstep. To pick up your items securely, share this verification pin directly with them:</p>
          <div style="background: #fff3f0; padding: 18px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #ff4d2d; margin: 24px 0; border-radius: 16px; border: 1px dashed rgba(229,77,45,0.2);">
            ${generatedOTP}
          </div>
          <p style="font-size: 11px; color: #a0a0a0; margin-bottom: 0;">This pin is highly time-sensitive and expires in 10 minutes. For your safety, do not share it over phone calls or messaging apps.</p>
        </div>
      `
    };

    // 5. Fire mailing service call
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: "Verification PIN successfully dispatched to the user's email box." });

  } catch (error) {
    console.error("Crash inside sendDeliveryOTP pipeline:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. VERIFY OTP AND SECURELY COMPLETE RUN
// ==========================================
export const verifyDeliveryOTP = async (req, res) => {
  try {
    const { assignmentId, inputOTP } = req.body;
    const driverId = req.user?._id;

    // 1. Fetch assignment blocks validation controls
    const assignment = await DeliveryAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment context not found." });
    }

    if (assignment.assignedTo?.toString() !== driverId?.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized run update access." });
    }

    // 2. Fetch master order context to process inputs
    const order = await Order.findById(assignment.order);
    if (!order) {
      return res.status(404).json({ success: false, message: "Master order context not found." });
    }

    const shopOrder = order.shopOrders.id(assignment.shopOrderId);
    if (!shopOrder) {
      return res.status(404).json({ success: false, message: "Sub-order link missing." });
    }

    // 3. Defensive security pattern checks on OTP strings
    if (!shopOrder.deliveryOTP || shopOrder.deliveryOTP !== inputOTP) {
      return res.status(400).json({ success: false, message: "Invalid verification code entered. Please ask customer to re-check." });
    }

    if (new Date() > new Date(shopOrder.deliveryOTPExpires)) {
      return res.status(400).json({ success: false, message: "The verification code has expired. Please hit 'Resend Code' to request a new token." });
    }

    // 4. Verification passing path: clear code slots and shift states safely
    shopOrder.status = "Delivered"; 
    shopOrder.deliveryOTP = null;
    shopOrder.deliveryOTPExpires = null;

    // Resolve assignment tracking schema updates
    assignment.status = "completed";
    assignment.completedAt = new Date();
    await assignment.save();

    // Check if ALL companion sub-orders in this block have finished routing cycles successfully
    const allDelivered = order.shopOrders.every(so => so.status === "Delivered" || so.status === "Completed");
    if (allDelivered) {
      order.status = "Delivered"; // Final master milestone flag update
    }

    await order.save();

    // 5. Broadcast real-time delivery payload updates across your system rooms
    const driverProfile = await User.findById(driverId).select("name fullName phone email role currentLocation").lean();
    const io = req.app.get("io");
    if (io) {
      const userTargetRoomId = order.user.toString();
      io.to(userTargetRoomId).emit("orderStatusUpdated", {
        masterOrderId: order._id.toString(),
        subOrderId: assignment.shopOrderId.toString(),
        newStatus: "Delivered",
        deliveryBoy: driverProfile
      });
    }

    return res.status(200).json({ success: true, message: "Doorstep OTP verified successfully! Order completed." });

  } catch (error) {
    console.error("Crash inside verifyDeliveryOTP pipeline:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};