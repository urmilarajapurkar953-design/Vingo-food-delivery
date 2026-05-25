import express from "express";
import { acceptDeliveryJob } from "../controllers/delivery.controller.js";
import { getAvailableJobs } from "../controllers/order.controller.js"; 
import isAuth from "../middleware/isAuth.js"; 

const deliveryRouter = express.Router();

deliveryRouter.post("/accept-job", isAuth, acceptDeliveryJob);

deliveryRouter.get('/available-jobs', isAuth, getAvailableJobs);

export default deliveryRouter;