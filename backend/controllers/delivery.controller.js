import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";

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
// 2. COMPLETE DELIVERY JOB
// ==========================================
export const completeDeliveryJob = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const driverId = req.user?._id;

    const assignment = await DeliveryAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    if (assignment.assignedTo?.toString() !== driverId?.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    assignment.status = "completed";
    assignment.completedAt = new Date();
    await assignment.save();

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: assignment.order, "shopOrders._id": assignment.shopOrderId },
      { $set: { "shopOrders.$.status": "Delivered" } },
      { new: true }
    ).lean();

    const driverProfile = await User.findById(driverId).select("name fullName phone email role currentLocation").lean();

    const io = req.app.get("io");
    if (io && updatedOrder) {
      const userTargetRoomId = updatedOrder.user.toString();
      io.to(userTargetRoomId).emit("orderStatusUpdated", {
        masterOrderId: updatedOrder._id.toString(),
        subOrderId: assignment.shopOrderId.toString(),
        newStatus: "Delivered",
        deliveryBoy: driverProfile
      });
    }

    return res.status(200).json({ success: true, message: "Delivery updated to Delivered!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};