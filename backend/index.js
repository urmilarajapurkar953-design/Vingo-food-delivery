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

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT"]
    }
});

app.set("io", io);

io.on("connection", (socket) => {
    // STANDARDIZED: Handles both users and owners checking into their secure ID channel spaces
    socket.on("joinRoom", (id) => {
        socket.join(id);
        console.log(`Socket entity registered inside channel: ${id}`);
    });
    
    // Kept fallback for old reference if components trigger it
    socket.on("joinUserRoom", (userId) => {
        socket.join(userId);
        console.log(`User registered inside real-time notification room: ${userId}`);
    });
    
    socket.on("disconnect", () => {
        console.log("Client disconnected from streaming room socket context");
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

const PORT = process.env.PORT || 8000; 

server.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
});