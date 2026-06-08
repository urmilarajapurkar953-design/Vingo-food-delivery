import express from "express";
import isAuth from "../middleware/isAuth.js"; 
import { 
  placeOrder, 
  getUserOrders, 
  getOwnerShopOrders, 
  updateSubOrderStatus,
  rateItem,
  getRiderDeliveryHistory
} from "../controllers/order.controller.js"; 

const orderRouter = express.Router();

orderRouter.post("/place", isAuth, placeOrder);

orderRouter.get("/user-history", isAuth, getUserOrders);
orderRouter.get("/owner-dashboard", isAuth, getOwnerShopOrders);

orderRouter.put("/update-status", isAuth, updateSubOrderStatus);

orderRouter.post("/rate-item", isAuth, rateItem);
orderRouter.get("/rider-history", isAuth, getRiderDeliveryHistory);

export default orderRouter;