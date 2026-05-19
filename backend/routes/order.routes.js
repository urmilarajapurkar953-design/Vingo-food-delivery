import express from "express";
import isAuth from "../middleware/isAuth.js"; // Adjust path to matches your middleware folder
import { placeOrder } from "../controllers/order.controller.js"; // Adjust path to matches your controller file

const orderRouter = express.Router();

// Using isAuth middleware so req.user._id works securely on your backend controller
orderRouter.post("/place", isAuth, placeOrder);

export default orderRouter;