import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http"; 
import { Server } from "socket.io"; 

import connectDB from "./config/db.js";
import userRouter from './routes/user.routes.js';
import authRouter from "./routes/auth.routes.js";
import shopRouter from "./routes/shop.routes.js";
import itemRouter from "./routes/item.routes.js";
import orderRouter from "./routes/order.routes.js"; 
import deliveryRouter from "./routes/delivery.routes.js";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT"]
    }
});

// Attaches the socket instance to Express so your controllers can call: req.app.get("io")
app.set("io", io);

io.on("connection", (socket) => {
    console.log(`🔌 New WebSocket client handshake established: ${socket.id}`);

    // STANDARDIZED: Handles both users and owners checking into their secure ID channel spaces
    socket.on("joinRoom", (id) => {
        if (!id) return console.log("⚠️ Warning: Received an empty ID on joinRoom");
        socket.join(id.toString());
        console.log(`🎯 Socket entity registered inside channel: ${id}`);
    });
    
    // Kept fallback for old reference if components trigger it
    socket.on("joinUserRoom", (userId) => {
        if (!userId) return console.log("⚠️ Warning: Received an empty userId on joinUserRoom");
        socket.join(userId.toString());
        console.log(`👤 User registered inside real-time notification room: ${userId}`);
    });
    
    socket.on("disconnect", () => {
        console.log(`❌ Client disconnected from streaming room socket: ${socket.id}`);
    });
});

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
app.use("/api/orders", orderRouter); 
app.use("/api/v1/shops", shopRouter); 
app.use("/api/delivery", deliveryRouter);

const PORT = process.env.PORT || 8000; 

server.listen(PORT, () => {
    connectDB();
    console.log(`🚀 Server is cleanly running on port ${PORT}`);
});