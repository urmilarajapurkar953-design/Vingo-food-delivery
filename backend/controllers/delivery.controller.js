import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import Order from "../models/order.model.js";

export const acceptDeliveryJob = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const driverId = req.user?._id; 

    const assignment = await DeliveryAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Delivery assignment not found." });
    }

    if (assignment.status === "assigned" || assignment.assignedTo) {
      return res.status(400).json({ 
        success: false, 
        message: "Too late! This order has already been accepted by another delivery agent." 
      });
    }

    assignment.assignedTo = driverId;
    assignment.status = "assigned";
    assignment.acceptedAt = new Date();
    await assignment.save();

    await Order.updateOne(
      { _id: assignment.order, "shopOrders._id": assignment.shopOrderId },
      { $set: { "shopOrders.$.status": "Driver Assigned" } }
    );

    const io = req.app.get("io");
    if (io) {
      assignment.broadcasted.forEach(notifiedDriverId => {
        if (notifiedDriverId.toString() !== driverId.toString()) {
          io.to(notifiedDriverId.toString()).emit("removeDeliveryJobCard", {
            assignmentId: assignment._id
          });
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "You have successfully accepted this delivery job!",
      assignment
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// ✨ ADDED: COMPLETE DELIVERY ROUTE FOR THE RIDER MANIFEST PIPELINE
// =========================================================================
export const completeDeliveryJob = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const driverId = req.user?._id;

    // 1. Locate current operational workflow assignment
    const assignment = await DeliveryAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Active assignment not found." });
    }

    // 2. Validate security permissions 
    if (assignment.assignedTo?.toString() !== driverId?.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized: You are not assigned to this package delivery." });
    }

    // 3. Close out assignment lifecycle 
    assignment.status = "completed";
    assignment.completedAt = new Date();
    await assignment.save();

    // 4. Update core document inside Master Order collection to "Delivered"
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: assignment.order, "shopOrders._id": assignment.shopOrderId },
      { $set: { "shopOrders.$.status": "Delivered" } },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Associated order element could not be found." });
    }

    // 5. Broadcast real-time message downstream to client UI tracker steps
    const io = req.app.get("io");
    if (io) {
      console.log(`📡 Emitting 'orderStatusUpdated' -> "Delivered" to User ID: ${updatedOrder.user}`);
      io.to(updatedOrder.user.toString()).emit("orderStatusUpdated", {
        masterOrderId: updatedOrder._id,
        subOrderId: assignment.shopOrderId,
        newStatus: "Delivered"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Delivery status updated to Delivered successfully!"
    });

  } catch (error) {
    console.error("Error inside completeDeliveryJob:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};