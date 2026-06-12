import Order from "../models/order.model.js"; 
import Item from "../models/item.model.js";
import Shop from "../models/shop.model.js"; 
import User from "../models/user.model.js";
import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import Review from "../models/Review.js";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =========================================================================
// 📡 GLOBAL COMPATIBILITY UTILITY: INSENSITIVE CHECK MATCHING THE FRONTEND
// =========================================================================
const checkIfCOD = (paymentMethodString) => {
  if (!paymentMethodString) return false;
  const normalized = String(paymentMethodString).toLowerCase();
  return normalized.includes('cod') || normalized.includes('cash');
};

// ==========================================
// 1. INITIALIZE RAZORPAY ORDER ROUTINE
// ==========================================
export const createRazorpayOrderReference = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid order amount parameters." });
    }

    const configurations = {
      amount: Number(amount * 100), 
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(configurations);
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Razorpay Order initialization fault trace:", error);
    return res.status(500).json({ success: false, message: "Failed initiating external payment tracker." });
  }
};

// ==========================================
// 2. VERIFY PAYMENTS AND ATOMICALLY PLACE ORDERS
// ==========================================
export const verifyPaymentAndPlaceOrder = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      items, 
      paymentMethod, 
      deliveryAddress, 
      totalAmount 
    } = req.body;

    const userId = req.user?._id;

    const tokenPayload = razorpay_order_id + "|" + razorpay_payment_id;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(tokenPayload.toString())
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Security Warning: Payment signature mismatch!" });
    }

    if (!items || items.length === 0) return res.status(400).json({ success: false, message: "Cart is empty" });
    if (!deliveryAddress || !deliveryAddress.text) return res.status(400).json({ success: false, message: "Delivery text address is required" });
    
    const { lat, lon } = deliveryAddress;
    if (lat === undefined || lon === undefined || lat === null || lon === null) {
      return res.status(400).json({ success: false, message: "Delivery location coordinates are missing." });
    }

    const productIds = items.map(item => item.product);
    const databaseItems = await Item.find({ _id: { $in: productIds } });

    const itemMap = {};
    databaseItems.forEach(item => { itemMap[item._id.toString()] = item; });

    const groupedByShop = {};
    items.forEach(cartItem => {
      const fullItemDetails = itemMap[cartItem.product.toString()];
      if (!fullItemDetails) throw new Error(`Product with ID ${cartItem.product} no longer exists.`);
      const shopId = fullItemDetails.shop?.toString();
      if (!shopId) throw new Error(`Product "${fullItemDetails.name}" is not cleanly linked to a shop.`);

      if (!groupedByShop[shopId]) groupedByShop[shopId] = [];
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
      if (!activeShopRecord) return res.status(404).json({ success: false, message: `The shop listing with ID ${shopId} could not be located.` });
      
      const trueShopOwnerId = activeShopRecord.owner;
      if (!trueShopOwnerId) return res.status(400).json({ success: false, message: `The shop "${activeShopRecord.name}" is missing a registered owner value.` });

      shopOrdersPayload.push({
        shop: shopId,
        owner: trueShopOwnerId, 
        subTotal: shopSubtotal,
        status: "Pending",
        shopOrderItems: shopOrderItems.map(oi => ({ item: oi.item, price: oi.price, quantity: oi.quantity }))
      });
    }

    const unifiedOrder = new Order({
      user: userId, 
      paymentMethod: paymentMethod || "Online", 
      paymentStatus: "Paid", 
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      deliveryAddress: { text: deliveryAddress.text, lat: Number(lat), lon: Number(lon) },
      shopOrders: shopOrdersPayload, 
      items: items.map(item => ({ product: item.product, quantity: item.quantity })), 
      totalAmount: Number(totalAmount)
    });

    const savedOrder = await unifiedOrder.save();
    const fullyPopulatedOrder = await Order.findById(savedOrder._id)
      .populate("user", "fullName name email phone")
      .populate({ path: 'shopOrders.shop', select: 'name image text address' })
      .populate({ path: 'shopOrders.shopOrderItems.item', select: 'name price image' });

    // ⚡ WebSocket Notification to Store Owner
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
            paymentMethod: "Online Payment", 
            paymentStatus: "Paid",                     
            status: subOrder.status || "Pending",
            shop: subOrder.shop,
            items: subOrder.shopOrderItems,
            subTotal: subOrder.subTotal,
            totalWithDelivery: Number(subOrder.subTotal) + 40, 
            createdAt: fullyPopulatedOrder.createdAt
          });
        }
      });
    }

    return res.status(201).json({ success: true, message: "Order authorized and placed successfully via Razorpay!", orders: [fullyPopulatedOrder] });
  } catch (error) {
    console.error("Payment registration fault block:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal failure creating verified record." });
  }
};

// ==========================================
// 3. PLACE ORDER (COD REUSE ROUTINE)
// ==========================================
export const placeOrder = async (req, res) => {
  try {
    const { items, paymentMethod, deliveryAddress, totalAmount } = req.body;
    const userId = req.user?._id; 

    if (!items || items.length === 0) return res.status(400).json({ success: false, message: "Cart is empty" });
    if (!paymentMethod) return res.status(400).json({ success: false, message: "Payment method is required" });
    if (!deliveryAddress || !deliveryAddress.text) return res.status(400).json({ success: false, message: "Delivery text address is required" });
    
    const { lat, lon } = deliveryAddress;
    if (lat === undefined || lon === undefined || lat === null || lon === null) {
      return res.status(400).json({ success: false, message: "Delivery location coordinates are missing." });
    }

    const productIds = items.map(item => item.product);
    const databaseItems = await Item.find({ _id: { $in: productIds } });

    const itemMap = {};
    databaseItems.forEach(item => { itemMap[item._id.toString()] = item; });

    const groupedByShop = {};
    items.forEach(cartItem => {
      const fullItemDetails = itemMap[cartItem.product.toString()];
      if (!fullItemDetails) throw new Error(`Product with ID ${cartItem.product} no longer exists.`);
      const shopId = fullItemDetails.shop?.toString();
      if (!shopId) throw new Error(`Product "${fullItemDetails.name}" is not cleanly linked to a shop.`);

      if (!groupedByShop[shopId]) groupedByShop[shopId] = [];
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
      if (!activeShopRecord) return res.status(404).json({ success: false, message: `The shop listing with ID ${shopId} could not be located.` });
      
      const trueShopOwnerId = activeShopRecord.owner;
      if (!trueShopOwnerId) return res.status(400).json({ success: false, message: `The shop "${activeShopRecord.name}" is missing a registered owner value.` });

      shopOrdersPayload.push({
        shop: shopId,
        owner: trueShopOwnerId, 
        subTotal: shopSubtotal,
        status: "Pending",
        shopOrderItems: shopOrderItems.map(oi => ({ item: oi.item, price: oi.price, quantity: oi.quantity }))
      });
    }

    const unifiedOrder = new Order({
      user: userId, 
      paymentMethod,
      paymentStatus: "Pending", 
      deliveryAddress: { text: deliveryAddress.text, lat: Number(lat), lon: Number(lon) },
      shopOrders: shopOrdersPayload, 
      items: items.map(item => ({ product: item.product, quantity: item.quantity })), 
      totalAmount: Number(totalAmount)
    });

    const savedOrder = await unifiedOrder.save();
    const fullyPopulatedOrder = await Order.findById(savedOrder._id)
      .populate("user", "fullName name email phone")
      .populate({ path: 'shopOrders.shop', select: 'name image text address' })
      .populate({ path: 'shopOrders.shopOrderItems.item', select: 'name price image' });

    // ⚡ WebSocket Notification to Store Owner
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
            paymentMethod: "Cash on Delivery", 
            paymentStatus: "Pending",     
            status: subOrder.status || "Pending",
            shop: subOrder.shop,
            items: subOrder.shopOrderItems,
            subTotal: subOrder.subTotal,
            totalWithDelivery: Number(subOrder.subTotal) + 40, 
            createdAt: fullyPopulatedOrder.createdAt
          });
        }
      });
    }

    return res.status(201).json({ success: true, message: "Order placed successfully!", orders: [fullyPopulatedOrder] });
  } catch (error) {
    console.error("Order processing error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error while placing order." });
  }
};

// ==========================================
// 4. GET USER ORDERS
// ==========================================
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "User session not authenticated." });

    const rawOrders = await Order.find({ user: userId })
      .populate({ path: "shopOrders.shop", select: "name image address text city" })
      .populate({ path: "shopOrders.shopOrderItems.item", select: "name image price" })
      .sort({ createdAt: -1 })
      .lean();

    const driverIds = [];
    rawOrders.forEach(order => {
      order.shopOrders?.forEach(sub => { if (sub.deliveryBoy) driverIds.push(sub.deliveryBoy.toString()); });
    });

    const drivers = await User.find({ _id: { $in: driverIds } }).select("fullName name email phone role currentLocation").lean();
    const driverMap = {};
    drivers.forEach(d => { driverMap[d._id.toString()] = d; });

    const processedOrders = rawOrders.map(order => {
      if (order.shopOrders) {
        order.shopOrders = order.shopOrders.map(sub => {
          sub.deliveryBoy = (sub.deliveryBoy && driverMap[sub.deliveryBoy.toString()]) ? driverMap[sub.deliveryBoy.toString()] : null;
          return sub;
        });
      }
      return order;
    });

    return res.status(200).json({ success: true, orders: processedOrders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================
// 5. GET OWNER SHOP ORDERS (ROBUST SYNCED TRANSLATION)
// =========================================================
export const getOwnerShopOrders = async (req, res) => {
  try {
    const ownerId = req.user?._id;
    if (!ownerId) return res.status(401).json({ success: false, message: "Unauthorized." });

    const orders = await Order.find({ "shopOrders.owner": ownerId })
      .populate("user", "fullName name email phone")
      .populate({ path: "shopOrders.shop", select: "name image address" })
      .populate({ path: "shopOrders.shopOrderItems.item", select: "name image price" });

    const structuredOrders = [];

    orders.forEach((masterOrder) => {
      masterOrder.shopOrders.forEach((subOrder) => {
        if (subOrder.owner && subOrder.owner.toString() === ownerId.toString()) {
          
          const isCOD = checkIfCOD(masterOrder.paymentMethod);
          
          structuredOrders.push({
            masterOrderId: masterOrder._id,
            subOrderId: subOrder._id,
            customer: masterOrder.user,
            deliveryAddress: masterOrder.deliveryAddress,
            paymentMethod: isCOD ? "Cash on Delivery" : "Online Payment",
            paymentStatus: masterOrder.paymentStatus || (isCOD ? "Pending" : "Paid"),
            status: subOrder.status || "Pending",
            shop: subOrder.shop,
            items: subOrder.shopOrderItems,
            subTotal: subOrder.subTotal,
            totalWithDelivery: Number(subOrder.subTotal) + 40, 
            createdAt: masterOrder.createdAt
          });
        }
      });
    });

    structuredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json({ success: true, orders: structuredOrders });
  } catch (error) {
    console.error("Error in getOwnerShopOrders:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. UPDATE SUB-ORDER STATUS & DRIVER DISPATCH (ULTRA-COMPATIBLE OVERRIDE)
// ==========================================
export const updateSubOrderStatus = async (req, res) => {
  try {
    const { masterOrderId, subOrderId, status } = req.body;
    
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

    if (!updatedMasterOrder) return res.status(404).json({ success: false, message: "Order element not found." });

    const subOrder = updatedMasterOrder.shopOrders.id(subOrderId);
    if (!subOrder) return res.status(404).json({ success: false, message: "Sub-order details not found." });

    const activeShop = await Shop.findById(subOrder.shop);
    const io = req.app.get("io");

    if (io) {
      io.to(updatedMasterOrder.user._id.toString()).emit("orderStatusUpdated", {
        masterOrderId: updatedMasterOrder._id.toString(),
        subOrderId: subOrderId.toString(),
        newStatus: status,
        deliveryBoy: null,
        paymentMethod: updatedMasterOrder.paymentMethod || "Online" 
      });
    }

    if (status === "Out for Delivery") {
      const nearbyDrivers = await User.find({ role: { $in: [/^delivery$/i, /^deliveryboy$/i] } });

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

        const totalWithDelivery = Number(subOrder.subTotal) + 40;
        const isCOD = checkIfCOD(updatedMasterOrder.paymentMethod);
        const collectionInstruction = isCOD 
          ? `COLLECT CASH AT DOORSTEP: ₹${totalWithDelivery}` 
          : "PREPAID ORDER - DO NOT COLLECT CASH";

        if (io) {
          driverIds.forEach(driverId => {
            io.to(driverId.toString()).emit("newDeliveryJobAvailable", {
              assignmentId: newAssignment._id,
              masterOrderId: updatedMasterOrder._id.toString(),
              subOrderId: subOrderId.toString(),
              shopName: activeShop?.name || "Local Kitchen",
              shopAddress: activeShop?.text || activeShop?.address || "Store Address",
              deliveryAddress: updatedMasterOrder.deliveryAddress,
              subTotal: subOrder.subTotal,
              // 🌟 SHOTGUN APPROACH: We pass ALL variations so frontend verification CANNOT fail
              paymentMethod: isCOD ? "COD Cash on Delivery" : "Online Prepaid Payment", 
              collectionInstruction: collectionInstruction      
            });
          });
        }
      }
    }

    return res.status(200).json({ success: true, message: "Status updated successfully!", status: status });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 7. GET AVAILABLE JOBS FOR DELIVERY BOYS (ULTRA-COMPATIBLE OVERRIDE)
// ==========================================
export const getAvailableJobs = async (req, res) => {
  try {
    const activeOrders = await Order.find({ "shopOrders.status": "Out for Delivery" })
      .populate("user", "fullName name email phone")
      .populate({ path: "shopOrders.status" === "Out for Delivery" ? "shopOrders.shop" : "shopOrders.shop", select: "name image text address city" })
      .populate({ path: "shopOrders.shopOrderItems.item", select: "name price image" })
      .lean();

    const broadcastedJobs = [];

    activeOrders.forEach((masterOrder) => {
      masterOrder.shopOrders.forEach((subOrder) => {
        if (subOrder.status === "Out for Delivery" && !subOrder.deliveryBoy) {
          
          const isCOD = checkIfCOD(masterOrder.paymentMethod);
          const totalWithDelivery = Number(subOrder.subTotal) + 40;
          
          broadcastedJobs.push({
            masterOrderId: masterOrder._id,
            subOrderId: subOrder._id,
            customer: masterOrder.user,
            deliveryAddress: masterOrder.deliveryAddress,
            // 🌟 SHOTGUN APPROACH: Matches both .includes('cod') and .includes('cash') perfectly
            paymentMethod: isCOD ? "COD Cash on Delivery" : "Online Prepaid Payment", 
            collectionInstruction: isCOD 
              ? `COLLECT CASH AT DOORSTEP: ₹${totalWithDelivery}` 
              : "PREPAID ORDER - DO NOT COLLECT CASH",         
            status: subOrder.status,
            shop: subOrder.shop,
            items: subOrder.shopOrderItems,
            subTotal: subOrder.subTotal,
            createdAt: masterOrder.createdAt
          });
        }
      });
    });

    broadcastedJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json({ success: true, jobs: broadcastedJobs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// ==========================================
// 8. RATE ITEM
// ==========================================
export const rateItem = async (req, res) => {
  try {
    const { itemId, subOrderId, rating } = req.body;
    const userId = req.user._id; 

    if (!itemId || !subOrderId || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required rating parameters (itemId, subOrderId, rating)." 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: "Rating scale must fall between 1 and 5 stars." 
      });
    }

    const existingReview = await Review.findOne({ userId, subOrderId, itemId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a rating for this item."
      });
    }

    const newReview = new Review({
      userId,
      itemId,
      subOrderId,
      rating
    });
    await newReview.save();

    await Order.updateOne(
      { "shopOrders._id": subOrderId, "shopOrders.shopOrderItems.item": itemId },
      { 
        $set: { "shopOrders.$[outer].shopOrderItems.$[inner].isRated": true } 
      },
      {
        arrayFilters: [
          { "outer._id": subOrderId },
          { "inner.item": itemId }
        ]
      }
    );

    return res.status(201).json({
      success: true,
      message: "Thank you! Your rating has been successfully logged.",
      review: newReview
    });

  } catch (error) {
    console.error("CRITICAL error registering item rating stream:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server compilation fault updating product metrics.",
      error: error.message
    });
  }
};

// ==========================================
// 9. RIDER DELIVERY HISTORY
// ==========================================
export const getRiderDeliveryHistory = async (req, res) => {
  try {
    const riderId = req.user._id; 

    const orders = await Order.find({
      "shopOrders.deliveryBoy": riderId,
      "shopOrders.status": { $in: ["Completed", "Delivered"] }
    })
    .sort({ createdAt: -1 })
    .populate("shopOrders.shop", "name image")
    .populate("shopOrders.shopOrderItems.item", "name image");

    let historyList = [];

    orders.forEach(masterOrder => {
      masterOrder.shopOrders.forEach(subOrder => {
        if (subOrder.deliveryBoy && subOrder.deliveryBoy.toString() === riderId.toString() && ["Completed", "Delivered"].includes(subOrder.status)) {
          
          const totalItemsCount = subOrder.shopOrderItems.reduce((sum, item) => sum + item.quantity, 0);
          const calculatedSubTotal = subOrder.shopOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

          historyList.push({
            masterOrderId: masterOrder._id,
            subOrderId: subOrder._id,
            shopName: subOrder.shop?.name || "Partner Shop",
            shopImage: subOrder.shop?.image || "",
            items: subOrder.shopOrderItems.map(io => ({
              name: io.item?.name || "Menu Item",
              quantity: io.quantity,
              price: io.price
            })),
            itemCount: totalItemsCount,
            amount: calculatedSubTotal,
            paymentMethod: masterOrder.paymentMethod,
            deliveryAddress: masterOrder.deliveryAddress?.text || "Customer Address",
            completedAt: subOrder.updatedAt || masterOrder.updatedAt 
          });
        }
      });
    });

    return res.status(200).json({
      success: true,
      count: historyList.length,
      history: historyList
    });

  } catch (error) {
    console.error("Error aggregating rider delivery profiles:", error);
    return res.status(500).json({
      success: false,
      message: "Internal configuration server error building rider analytics.",
      error: error.message
    });
  }
};

// ==========================================
// 10. AUTHENTICATED USER CONFIGS
// ==========================================
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id; 
    if (!userId) return res.status(401).json({ message: "No ID" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ user }); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const updateUserLocation = async (req, res) => {
  try {
    const { lat, lon } = req.body;
    const userId = req.user?.id; 

    const user = await User.findByIdAndUpdate(userId, {
        location: {
            type: 'Point',
            coordinates: [lon, lat]
        }
    }, { returnDocument: 'after' }); 

    if (!user) {
        return res.status(400).json({ message: "user is not found" });
    }

    return res.status(200).json({ message: 'location updated' });
  } catch (error) {
    return res.status(500).json({ message: `update location error: ${error.message}` });
  }
};