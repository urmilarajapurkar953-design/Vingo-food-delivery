import Order from "../models/order.model.js"; 
import Shop from "../models/shop.model.js"; 
import User from "../models/user.model.js";
import DeliveryAssignment from "../models/deliveryAssignment.model.js";

export const updateSubOrderStatus = async (req, res) => {
  try {
    const { masterOrderId, subOrderId, status } = req.body;
    
    // 1. Update the order status in the database
    const updatedMasterOrder = await Order.findOneAndUpdate(
      { _id: masterOrderId, "shopOrders._id": subOrderId },
      { $set: { "shopOrders.$.status": status } },
      { returnDocument: 'after' }
    ).populate("user", "fullName email phone");

    if (!updatedMasterOrder) {
      return res.status(404).json({ success: false, message: "Order element not found." });
    }

    const subOrder = updatedMasterOrder.shopOrders.id(subOrderId);
    const activeShop = await Shop.findById(subOrder.shop);

    // 2. Alert the Customer via WebSockets
    const io = req.app.get("io");
    if (io) {
      io.to(updatedMasterOrder.user._id.toString()).emit("orderStatusUpdated", {
        masterOrderId: updatedMasterOrder._id,
        subOrderId: subOrderId,
        newStatus: status
      });
    }

    // 3. PROFESSIONAL DISPATCH ENGINE: Triggered when marked "Out for Delivery"
    if (status === "Out for Delivery" && activeShop && activeShop.location) {
      const shopCoordinates = activeShop.location.coordinates; // [lon, lat]

      // Find nearby delivery users (role: "delivery") within 5000 meters (5km)
      const nearbyDrivers = await User.find({
        role: "delivery",
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: shopCoordinates
            },
            $maxDistance: 5000 // Distance in meters
          }
        }
      });

      if (nearbyDrivers.length > 0) {
        const driverIds = nearbyDrivers.map(driver => driver._id);

        // Save assignment state to the database
        const newAssignment = new DeliveryAssignment({
          order: updatedMasterOrder._id,
          shop: activeShop._id,
          shopOrderId: subOrderId,
          broadcasted: driverIds,
          status: "broadcasted" // Fixed spelling matching schema definition below
        });
        await newAssignment.save();

        // Broadcast to each nearby driver's individual socket room channel
        if (io) {
          driverIds.forEach(driverId => {
            io.to(driverId.toString()).emit("newDeliveryJobAvailable", {
              assignmentId: newAssignment._id,
              masterOrderId: updatedMasterOrder._id,
              subOrderId: subOrderId,
              shopName: activeShop.name,
              shopAddress: activeShop.text || activeShop.address,
              deliveryAddress: updatedMasterOrder.deliveryAddress,
              subTotal: subOrder.subTotal
            });
          });
        }
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: "Status updated successfully!", 
      status: status 
    });

  } catch (error) {
    console.error("System Error inside updateSubOrderStatus:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};