import express from "express";
import { acceptDeliveryJob, completeDeliveryJob } from "../controllers/delivery.controller.js";
import { getAvailableJobs } from "../controllers/order.controller.js"; 
import isAuth from "../middleware/isAuth.js"; 

const deliveryRouter = express.Router();

deliveryRouter.post("/accept-job", isAuth, acceptDeliveryJob);
deliveryRouter.post("/complete-delivery", isAuth, completeDeliveryJob); // ✨ ADDED: Delivery completion endpoint
deliveryRouter.get('/available-jobs', isAuth, getAvailableJobs);

export default deliveryRouter;