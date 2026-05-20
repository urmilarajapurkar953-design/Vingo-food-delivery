import Order from "../models/order.model.js"; 
import Item from "../models/item.model.js";

// KEPT UNCHANGED: Your exact order placement function
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

    // Fetch full item details to group them by shop
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
        quantity: cartItem.quantity,
        price: fullItemDetails.price 
      });
    });

    const shopOrdersPayload = [];

    for (const shopId in groupedByShop) {
      const shopOrderItems = groupedByShop[shopId];
      const shopSubtotal = shopOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      shopOrdersPayload.push({
        shop: shopId,
        owner: userId, 
        subTotal: shopSubtotal,
        shopOrderItems: shopOrderItems
      });
    }

    // Instantiate master order document matching your schema rules perfectly
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

    // CRITICAL UPDATE: Deep populate the document details right before responding to the client
    const fullyPopulatedOrder = await Order.findById(savedOrder._id)
      .populate({
        path: 'shopOrders',
        populate: [
          { 
            path: 'shop', 
            select: 'name image' 
          },
          { 
            path: 'shopOrderItems.item', 
            select: 'name price' 
          }
        ]
      });

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

// ADDED: Fetch order history for the active customer
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?._id;
    const orders = await Order.find({ user: userId })
      .populate({
        path: "shopOrders",
        populate: [
          { path: "shop", select: "name image" },
          { path: "shopOrderItems.item", select: "name image price" }
        ]
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ADDED: Fetch shop metrics specific only to the matching shop owner field
export const getOwnerShopOrders = async (req, res) => {
  try {
    const ownerId = req.user?._id;

    // Find master orders that contain nested items assigned to this owner's sub-profile
    const orders = await Order.find({ "shopOrders.owner": ownerId })
      .populate("user", "name email phone")
      .populate({
        path: "shopOrders",
        populate: [
          { path: "shop", select: "name image" },
          { path: "shopOrderItems.item", select: "name image price" }
        ]
      });

    const structuredOrders = [];
    orders.forEach((masterOrder) => {
      masterOrder.shopOrders.forEach((subOrder) => {
        // Isolate so the shop owner only receives data updates tailored to their shop profile
        if (subOrder.owner?.toString() === ownerId.toString()) {
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

// ADDED: Handle dropdown status shifts and dispatch WebSocket event notifications
export const updateSubOrderStatus = async (req, res) => {
  try {
    const { masterOrderId, subOrderId, status } = req.body;
    
    const masterOrder = await Order.findById(masterOrderId);
    if (!masterOrder) {
      return res.status(404).json({ success: false, message: "Master Order structural block missing." });
    }

    const subOrder = masterOrder.shopOrders.id(subOrderId);
    if (!subOrder) {
      return res.status(404).json({ success: false, message: "Sub order reference missing." });
    }

    subOrder.status = status;
    await masterOrder.save();

    // Fire real-time web dispatch message stream down to specific client room channel
    const io = req.app.get("io");
    if (io) {
      io.to(masterOrder.user.toString()).emit("orderStatusUpdated", {
        masterOrderId: masterOrder._id,
        subOrderId: subOrder._id,
        newStatus: status
      });
    }

    return res.status(200).json({ success: true, message: "Status synchronized successfully", status });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};