import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import userRouter from './routes/user.routes.js';
import authRouter from "./routes/auth.routes.js";
import shopRouter from "./routes/shop.routes.js";
import itemRouter from "./routes/item.routes.js";
import orderRouter from "./routes/order.routes.js"; // 1. IMPORTED ORDER ROUTER HERE


const app = express();

// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/item", itemRouter);
app.use("/api/orders", orderRouter); // 2. ADDED ORDER ROUTER HERE


// UPDATED: Added /v1/shops to match your Frontend request
app.use("/api/v1/shops", shopRouter); 

const PORT = process.env.PORT || 8000; // Standardizing to 8000 based on your App.jsx

app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
});