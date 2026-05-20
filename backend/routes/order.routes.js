import express from "express";
import isAuth from "../middleware/isAuth.js"; 
import { placeOrder, getUserOrders, getOwnerShopOrders, updateSubOrderStatus } from "../controllers/order.controller.js"; 

const orderRouter = express.Router();

// KEPT UNCHANGED: Your baseline order placement route endpoint
orderRouter.post("/place", isAuth, placeOrder);

// ADDED: Endpoints for user-history matching and owner system status pipelines
orderRouter.get("/user-history", isAuth, getUserOrders);
orderRouter.get("/owner-dashboard", isAuth, getOwnerShopOrders);
orderRouter.put("/update-status", isAuth, updateSubOrderStatus);

export default orderRouter;