import Order from "../models/order.model.js"; // Adjust paths to match your project
import Product from "../models/product.model.js"; 
import mongoose from "mongoose";

export const placeOrder = async (req, res) => {
  try {
    const { items, paymentMethod, deliveryAddress, totalAmount } = req.body;
    const userId = req.user?._id; // Assuming you have user authentication middleware

    // 1. STAGE ONE: Validate all required fields (including coordinates)
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }
    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: "Payment method is required" });
    }
    if (!deliveryAddress || !deliveryAddress.text) {
      return res.status(400).json({ success: false, message: "Delivery text address is required" });
    }
    
    // Check if map coordinates are present
    const { lat, lon } = deliveryAddress;
    if (lat === undefined || lon === undefined || lat === null || lon === null) {
      return res.status(400).json({ 
        success: false, 
        message: "Delivery location coordinates (Latitude and Longitude) are missing." 
      });
    }

    // 2. STAGE TWO: Fetch full product details to verify shops and calculate pricing safely
    const productIds = items.map(item => item.product);
    const databaseProducts = await Product.find({ _id: { $in: productIds } });

    // Build a quick lookup map for full product data
    const productMap = {};
    databaseProducts.forEach(prod => {
      productMap[prod._id.toString()] = prod;
    });

    // 3. STAGE THREE: Group items by their respective Shop ID
    const groupedByShop = {};

    items.forEach(item => {
      const fullProductDetails = productMap[item.product.toString()];
      
      if (!fullProductDetails) {
        throw new Error(`Product with ID ${item.product} no longer exists.`);
      }

      // Identify which shop owns this product
      // Adjust property name ('shop', 'shopId', or 'restaurant') based on your Product Schema
      const shopId = fullProductDetails.shop?.toString() || fullProductDetails.shopId?.toString();
      
      if (!shopId) {
        throw new Error(`Product ${fullProductDetails.name} is not linked to any shop.`);
      }

      if (!groupedByShop[shopId]) {
        groupedByShop[shopId] = [];
      }

      groupedByShop[shopId].push({
        product: item.product,
        quantity: item.quantity,
        priceAtOrder: fullProductDetails.price, // Store historical price
        name: fullProductDetails.name
      });
    });

    // 4. STAGE FOUR: Generate individual database orders for each distinct shop group
    const createdOrders = [];
    const sharedGroupId = new mongoose.Types.ObjectId(); // Connects the separated orders under one checkout session if needed

    for (const shopId in groupedByShop) {
      const shopItems = groupedByShop[shopId];
      
      // Calculate split totals dynamically from verified database values
      const shopSubtotal = shopItems.reduce((acc, currentItem) => {
        return acc + (currentItem.priceAtOrder * currentItem.quantity);
      }, 0);

      // You can divide your base delivery fee across shops or assign it to the first one
      const assignedDeliveryFee = 40 / Object.keys(groupedByShop).length; 

      const newOrder = new Order({
        user: userId,
        shop: shopId, // The specific vendor receiving this order segment
        items: shopItems.map(si => ({ product: si.product, quantity: si.quantity })),
        subtotalAmount: shopSubtotal,
        deliveryFee: assignedDeliveryFee,
        totalAmount: shopSubtotal + assignedDeliveryFee,
        paymentMethod,
        deliveryAddress: {
          text: deliveryAddress.text,
          lat: Number(lat),
          lon: Number(lon)
        },
        checkoutGroupId: sharedGroupId, // Handy for lookups matching these split orders later
        status: "Pending"
      });

      const savedOrder = await newOrder.save();
      createdOrders.push(savedOrder);
    }

    // 5. STAGE FIVE: Return clean unified success status back to frontend
    return res.status(201).json({
      success: true,
      message: `Your order was split and placed successfully across ${createdOrders.length} shops!`,
      orders: createdOrders
    });

  } catch (error) {
    console.error("Order Splitting Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error while placing order."
    });
  }
};