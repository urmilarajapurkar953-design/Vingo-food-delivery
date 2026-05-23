import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import Order from "../models/order.model.js";

export const acceptDeliveryJob = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const driverId = req.user?._id; // Extracted via isAuth middleware

    // Find the assignment
    const assignment = await DeliveryAssignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Delivery assignment not found." });
    }

    // Thread Lock Validation: Check if another driver claimed it first
    if (assignment.status === "assigned" || assignment.assignedTo) {
      return res.status(400).json({ 
        success: false, 
        message: "Too late! This order has already been accepted by another delivery agent." 
      });
    }

    // Atomically assign the job to this driver
    assignment.assignedTo = driverId;
    assignment.status = "assigned";
    assignment.acceptedAt = new Date();
    await assignment.save();

    // Update the sub-order status inside the master Order model to track the assignment
    await Order.updateOne(
      { _id: assignment.order, "shopOrders._id": assignment.shopOrderId },
      { $set: { "shopOrders.$.status": "Driver Assigned" } }
    );

    // Notify remaining broadcasted drivers to remove the matching order card from their screens
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