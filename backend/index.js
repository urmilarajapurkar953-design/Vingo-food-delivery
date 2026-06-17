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
import paymentRouter from "./routes/payment.routes.js"; 

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://vingo-food-delivery-yi6q.onrender.com"
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
};

const server = http.createServer(app);
const io = new Server(server, {
    cors: corsOptions 
});

app.set("io", io);

io.on("connection", (socket) => {
    console.log(`🔌 New WebSocket client handshake established: ${socket.id}`);

    socket.on("joinRoom", (id) => {
        if (!id) return console.log("⚠️ Warning: Received an empty ID on joinRoom");
        socket.join(id.toString());
        console.log(`🎯 Socket entity registered inside channel: ${id}`);
    });
    
    socket.on("joinUserRoom", (userId) => {
        if (!userId) return console.log("⚠️ Warning: Received an empty userId on joinUserRoom");
        socket.join(userId.toString());
        console.log(`👤 User registered inside real-time notification room: ${userId}`);
    });

    socket.on("joinDeliveryRoom", () => {
        socket.join("delivery_drivers_room");
        console.log(`🛵 Delivery Boy registered to live geo-radar broadcast channel.`);
    });
    
    socket.on("disconnect", () => {
        console.log(`❌ Client disconnected from streaming room socket: ${socket.id}`);
    });
});

app.use(cors(corsOptions)); 
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/item", itemRouter);
app.use("/api/orders", orderRouter); 
app.use("/api/v1/shops", shopRouter); 
app.use("/api/delivery", deliveryRouter);
app.use("/api/payment", paymentRouter); // 🌟

const PORT = process.env.PORT || 8000; 

server.listen(PORT, () => {
    connectDB();
    console.log(`🚀 Server is cleanly running on port ${PORT}`);
});
