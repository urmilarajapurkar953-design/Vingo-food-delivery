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
        ref: "Shop", // 🌟 FIXED: Changed from "User" to "Shop" so population connects correctly
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
    deliveryBoy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    status: {
        type: String,
        enum: ["Pending", "Preparing", "Driver Assigned", "Out for Delivery", "Completed", "Delivered"],
        default: "Pending"
    },
    status: {
        type: String,
        enum: ["Pending", "Preparing", "Driver Assigned", "Out for Delivery", "Completed", "Delivered"],
        default: "Pending"
    },
    shopOrderItems: [shopOrderItemSchema],

    // 🌟 ADD THESE CODE FIELDS HERE FOR DOORSTEP VERIFICATION
    deliveryOTP: {
        type: String,
        default: null
    },
    deliveryOTPExpires: {
        type: Date,
        default: null
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
        enum: ["COD", "Online", "Cash on Delivery"] // 🌟 UPDATED: Added "Cash on Delivery" to match your frontend checkout button payload string
    },
    deliveryAddress: {
        text: String, 
        lat: Number, 
        lon: Number  
    },
    shopOrders: [shopOrderSchema], 
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Item", 
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
    timestamps: true,
    strictPopulate: false // 🌟 FIXED: Safety flag to stop strict populating errors from breaking runtime queries
});

// Clean up existing models cache in modern Next/Node ESM setups to prevent model re-compilation crashes
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;