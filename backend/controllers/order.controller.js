import Order from "../models/order.model.js"; 
import Item from "../models/item.model.js";

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
        lat: Number(lat),  // KEPT: Using lat natively as requested
        lon: Number(lon)   // KEPT: Using lon natively as requested
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
            select: 'name image' // Fetches exact shop names & images from your Shop collection
          },
          { 
            path: 'shopOrderItems.item', 
            select: 'name price' // Fetches exact item names for itemized breakdown lists
          }
        ]
      });

    // Passing the fully loaded order document configuration to the frontend
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