import Order from "../models/order.model.js"; 
import Item from "../models/item.model.js";
import Shop from "../models/shop.model.js"; 

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

    // FIXED: Populating directly on the saved main schema array elements smoothly
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

    // 🚀 LIVE REAL-TIME DISPATCH: Alerts owner endpoints immediately
    const io = req.app.get("io");
    if (io && fullyPopulatedOrder) {
      fullyPopulatedOrder.shopOrders.forEach(subOrder => {
        // Access raw schema reference value to prevent structural data loss 
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
        // FIXED: Explicitly target structural sub-order document variables
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

export const updateSubOrderStatus = async (req, res) => {
  try {
    const { masterOrderId, subOrderId, status } = req.body;
    
    console.log("------------------ STATUS UPDATE START ------------------");
    console.log("Raw incoming payload fields:", { masterOrderId, subOrderId, status });

    const updatedMasterOrder = await Order.findOneAndUpdate(
      { 
        _id: masterOrderId, 
        "shopOrders._id": subOrderId 
      },
      { 
        $set: { "shopOrders.$.status": status } 
      },
      { returnDocument: 'after' } 
    );

    if (!updatedMasterOrder) {
      console.error(`❌ DATABASE FAILED: Could not find Master Order (${masterOrderId}) containing subOrderId (${subOrderId})`);
      return res.status(404).json({ success: false, message: "Order element not found." });
    }

    console.log("✅ DATABASE SAVED: Target array node modified cleanly!");

    const io = req.app.get("io");
    if (io) {
      io.to(updatedMasterOrder.user.toString()).emit("orderStatusUpdated", {
        masterOrderId: updatedMasterOrder._id,
        subOrderId: subOrderId,
        newStatus: status
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Status successfully updated in DB and pushed live!", 
      status: status 
    });

  } catch (error) {
    console.error("💥 SYSTEM ERROR inside updateSubOrderStatus controller:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};