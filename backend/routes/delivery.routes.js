import express from "express";
import { 
  acceptDeliveryJob, 
  sendDeliveryOTP, 
  verifyDeliveryOTP 
} from "../controllers/delivery.controller.js";
import { getAvailableJobs } from "../controllers/order.controller.js"; 
import isAuth from "../middleware/isAuth.js"; 

const deliveryRouter = express.Router();

// 📥 Job Manifest Queries
deliveryRouter.get('/available-jobs', isAuth, getAvailableJobs);
deliveryRouter.post("/accept-job", isAuth, acceptDeliveryJob);// 🔒 Secure Doorstep OTP Flow Endpoints
deliveryRouter.post("/send-otp", isAuth, sendDeliveryOTP);      
deliveryRouter.post("/verify-otp", isAuth, verifyDeliveryOTP);   

export default deliveryRouter;