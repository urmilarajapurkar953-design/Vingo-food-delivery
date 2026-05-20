import mongoose from "mongoose";

// 1. Schema for individual items within a shop order
const shopOrderItemSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1 
    }
}, {
    timestamps: true
});

// 2. Schema for an order grouped by a specific shop
const shopOrderSchema = new mongoose.Schema({
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    subTotal: {
        type: Number,
        required: true
    },
    // ADDED CRITICAL FIELD: Status definition mapping ensures data shifts persist on refresh
    status: {
        type: String,
        enum: ["Pending", "Preparing", "Out for Delivery", "Completed"],
        default: "Pending"
    },
    shopOrderItems: [shopOrderItemSchema]
}, {
    timestamps: true
});

// 3. Main Order Schema
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ["COD", "Online"] 
    },
    deliveryAddress: {
        text: String, 
        lat: Number, // FIXED: Reverted back to lat to match your frontend tracking map
        lon: Number  // FIXED: Reverted back to lon to match your frontend tracking map
    },
    shopOrders: [shopOrderSchema], 
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Item", // FIXED: Changed "Product" to "Item" so population handles smoothly
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;