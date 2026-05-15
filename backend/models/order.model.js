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
        min: 1 // Added min to ensure valid orders
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
        enum: ["COD", "Online"] // Fixed typo from 'anum'
    },
    deliveryAddress: {
        text: String, // Changed 'Text' to lowercase 'text' (Standard practice)
        latitude: Number,
        longitude: Number
    },
    shopOrders: [shopOrderSchema], // Renamed to plural for clarity
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
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
    // Removed the duplicate 'totalAmount' key from here
}, {
    timestamps: true
});

// Exporting the model
 const Order = mongoose.model("Order", orderSchema);

export default Order;