import express from "express";
// 🌟 FIX: Removed completeDeliveryJob from the imports list
import { acceptDeliveryJob, sendDeliveryOTP, verifyDeliveryOTP } from "../controllers/delivery.controller.js";
import { getAvailableJobs } from "../controllers/order.controller.js"; 
import isAuth from "../middleware/isAuth.js"; 

const deliveryRouter = express.Router();

deliveryRouter.post("/accept-job", isAuth, acceptDeliveryJob);
deliveryRouter.get('/available-jobs', isAuth, getAvailableJobs);

// 🔒 Secure Doorstep OTP Flow endpoints
deliveryRouter.post("/send-otp", isAuth, sendDeliveryOTP);      
deliveryRouter.post("/verify-otp", isAuth, verifyDeliveryOTP);   

export default deliveryRouter;