import Order from "../models/order.model.js"; 
import Item from "../models/item.model.js";
import Shop from "../models/shop.model.js"; 
import User from "../models/user.model.js";
import DeliveryAssignment from "../models/deliveryAssignment.model.js";

// 1. PLACE ORDER
export const placeOrder = async (req, res) => {
  try {
    const { items, paymentMethod, deliveryAddress, totalAmount } = req.body;
    const userId = req.user?._id; 

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }
    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: "Payment method is required" });
    }
    if (!deliveryAddress || !deliveryAddress.text) {
      return res.status(400).json({ success: false, message: "Delivery text address is required" });
    }
    
    const { lat, lon } = deliveryAddress;
    if (lat === undefined || lon === undefined || lat === null || lon === null) {
      return res.status(400).json({ 
        success: false, 
        message: "Delivery location coordinates are missing." 
      });
    }

    const productIds = items.map(item => item.product);
    const databaseItems = await Item.find({ _id: { $in: productIds } });

    const itemMap = {};
    databaseItems.forEach(item => {
      itemMap[item._id.toString()] = item;
    });

    const groupedByShop = {};

    items.forEach(cartItem => {
      const fullItemDetails = itemMap[cartItem.product.toString()];
      
      if (!fullItemDetails) {
        throw new Error(`Product with ID ${cartItem.product} no longer exists.`);
      }

      const shopId = fullItemDetails.shop?.toString();
      
      if (!shopId) {
        throw new Error(`Product "${fullItemDetails.name}" is not cleanly linked to a shop.`);
      }

      if (!groupedByShop[shopId]) {
        groupedByShop[shopId] = [];
      }

      groupedByShop[shopId].push({
        item: cartItem.product,
        price: fullItemDetails.price,
        quantity: cartItem.quantity
      });
    });

    const shopOrdersPayload = [];

    for (const shopId in groupedByShop) {
      const shopOrderItems = groupedByShop[shopId];
      const shopSubtotal = shopOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const activeShopRecord = await Shop.findById(shopId);
      
      if (!activeShopRecord) {
        return res.status(404).json({ 
          success: false, 
          message: `The shop listing with ID ${shopId} could not be located.` 
        });
      }

      const trueShopOwnerId = activeShopRecord.owner;

      if (!trueShopOwnerId) {
        return res.status(400).json({ 
          success: false, 
          message: `The shop "${activeShopRecord.name}" is missing a registered owner value.` 
        });
      }

      shopOrdersPayload.push({
        shop: shopId,
        owner: trueShopOwnerId, 
        subTotal: shopSubtotal,
        shopOrderItems: shopOrderItems.map(oi => ({
          item: oi.item,
          price: oi.price,
          quantity: oi.quantity
        }))
      });
    }

    const unifiedOrder = new Order({
      user: userId, 
      paymentMethod,
      deliveryAddress: {
        text: deliveryAddress.text,
        lat: Number(lat),  
        lon: Number(lon)   
      },
      shopOrders: shopOrdersPayload, 
      items: items.map(item => ({ product: item.product, quantity: item.quantity })), 
      totalAmount: Number(totalAmount)
    });

    const savedOrder = await unifiedOrder.save();

    const fullyPopulatedOrder = await Order.findById(savedOrder._id)
      .populate("user", "fullName name email phone")
      .populate({
        path: 'shopOrders.shop',
        select: 'name image text'
      })
      .populate({
        path: 'shopOrders.shopOrderItems.item',
        select: 'name price image'
      });

    const io = req.app.get("io");
    if (io && fullyPopulatedOrder) {
      fullyPopulatedOrder.shopOrders.forEach(subOrder => {
        const targetOwnerId = shopOrdersPayload.find(p => p.shop === subOrder.shop._id.toString())?.owner;
        
        if (targetOwnerId) {
          io.to(targetOwnerId.toString()).emit("newOrderReceived", {
            masterOrderId: fullyPopulatedOrder._id,
            subOrderId: subOrder._id,
            customer: fullyPopulatedOrder.user,
            deliveryAddress: fullyPopulatedOrder.deliveryAddress,
            paymentMethod: fullyPopulatedOrder.paymentMethod,
            status: subOrder.status || "Pending",
            shop: subOrder.shop,
            items: subOrder.shopOrderItems,
            subTotal: subOrder.subTotal,
            createdAt: fullyPopulatedOrder.createdAt
          });
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      orders: [fullyPopulatedOrder] 
    });

  } catch (error) {
    console.error("Order processing error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error while placing order."
    });
  }
};

// 2. GET USER ORDERS
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?._id;
    const orders = await Order.find({ user: userId })
      .populate({
        path: "shopOrders.shop",
        select: "name image"
      })
      .populate({
        path: "shopOrders.shopOrderItems.item",
        select: "name image price"
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. GET OWNER SHOP ORDERS
export const getOwnerShopOrders = async (req, res) => {
  try {
    const ownerId = req.user?._id;

    const orders = await Order.find({ "shopOrders.owner": ownerId })
      .populate("user", "fullName name email phone")
      .populate({
        path: "shopOrders.shop",
        select: "name image"
      })
      .populate({
        path: "shopOrders.shopOrderItems.item",
        select: "name image price"
      });

    const structuredOrders = [];
    orders.forEach((masterOrder) => {
      masterOrder.shopOrders.forEach((subOrder) => {
        if (subOrder.owner && subOrder.owner.toString() === ownerId.toString()) {
          structuredOrders.push({
            masterOrderId: masterOrder._id,
            subOrderId: subOrder._id,
            customer: masterOrder.user,
            deliveryAddress: masterOrder.deliveryAddress,
            paymentMethod: masterOrder.paymentMethod,
            status: subOrder.status || "Pending",
            shop: subOrder.shop,
            items: subOrder.shopOrderItems,
            subTotal: subOrder.subTotal,
            createdAt: masterOrder.createdAt
          });
        }
      });
    });

    structuredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json({ success: true, orders: structuredOrders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// Rest of file remains identical above...

export const updateSubOrderStatus = async (req, res) => {
  try {
    const { masterOrderId, subOrderId, status } = req.body;
    console.log(`📦 Incoming Status Change: Master [${masterOrderId}] | Sub [${subOrderId}] -> "${status}"`);
    
    // ✨ ADDED: Enforce strict restaurant boundaries. Prevent owners from skipping to delivery completion.
    const allowedMerchantStatuses = ["Pending", "Preparing", "Out for Delivery"];
    if (!allowedMerchantStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Action Denied: Merchants can only set orders to Pending, Preparing, or Out for Delivery."
      });
    }

    const updatedMasterOrder = await Order.findOneAndUpdate(
      { _id: masterOrderId, "shopOrders._id": subOrderId },
      { $set: { "shopOrders.$.status": status } },
      { new: true } 
    ).populate("user", "fullName email phone");

    if (!updatedMasterOrder) {
      console.error("❌ Master Order document could not be found or updated.");
      return res.status(404).json({ success: false, message: "Order element not found." });
    }

    const subOrder = updatedMasterOrder.shopOrders.id(subOrderId);
    if (!subOrder) {
      console.error("❌ Sub-order segment matching ID was missing.");
      return res.status(404).json({ success: false, message: "Sub-order details not found." });
    }

    const activeShop = await Shop.findById(subOrder.shop);

    const io = req.app.get("io");
    if (io) {
      io.to(updatedMasterOrder.user._id.toString()).emit("orderStatusUpdated", {
        masterOrderId: updatedMasterOrder._id,
        subOrderId: subOrderId,
        newStatus: status
      });
    }

    if (status === "Out for Delivery") {
      const nearbyDrivers = await User.find({
        role: { $in: [/^delivery$/i, /^deliveryboy$/i] }
      });

      console.log(`📡 Broadcast Engine: Found (${nearbyDrivers.length}) system riders available for assignment.`);

      if (nearbyDrivers.length > 0) {
        const driverIds = nearbyDrivers.map(driver => driver._id);

        const newAssignment = new DeliveryAssignment({
          order: updatedMasterOrder._id,
          shop: subOrder.shop,
          shopOrderId: subOrderId,
          broadcasted: driverIds,
          status: "broadcasted"
        });
        await newAssignment.save();
        console.log(`✅ DeliveryAssignment successfully minted in MongoDB! ID: ${newAssignment._id}`);

        if (io) {
          driverIds.forEach(driverId => {
            io.to(driverId.toString()).emit("newDeliveryJobAvailable", {
              assignmentId: newAssignment._id,
              masterOrderId: updatedMasterOrder._id,
              subOrderId: subOrderId,
              shopName: activeShop?.name || "Local Kitchen",
              shopAddress: activeShop?.text || activeShop?.address || "Store Address",
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
    console.error("💥 System Crash inside updateSubOrderStatus:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Rest of file remains identical below...

export const getAvailableJobs = async (req, res) => {
  try {
    const driverId = req.user?._id;
    console.log("🔍 Checking initialized job feed for Driver ID:", driverId);

    if (!driverId) {
      return res.status(401).json({ success: false, message: "Unauthorized: No driver ID found in session tokens." });
    }

    // DEBUG: Look up assignments ignoring status to see if the driver is listed in the broadcast array at all
    const allAssignmentsForMe = await DeliveryAssignment.find({
      broadcasted: driverId
    });
    console.log(`📡 Database Check: Found total ${allAssignmentsForMe.length} assignments linked to this driver ID in history.`);

    // Find active jobs
    const activeAssignments = await DeliveryAssignment.find({
      broadcasted: driverId,
      status: "broadcasted"
    }).populate("shop").populate("order");

    const formattedJobs = activeAssignments.map(job => ({
      assignmentId: job._id,
      masterOrderId: job.order?._id,
      subOrderId: job.shopOrderId,
      shopName: job.shop?.name,
      shopAddress: job.shop?.text || job.shop?.address,
      deliveryAddress: job.order?.deliveryAddress,
      subTotal: job.order?.shopOrders?.find(so => so._id.toString() === job.shopOrderId.toString())?.subTotal || 0
    }));

    return res.status(200).json({ success: true, jobs: formattedJobs });
  } catch (error) {
    console.error("❌ Error inside getAvailableJobs API endpoint:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};