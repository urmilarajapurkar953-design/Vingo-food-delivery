import express from "express";
import { 
  signUp, 
  signIn, 
  signOut, 
  sendOtp, 
  verifyOtp, 
  resetPassword,
  googleAuth
} from "../controllers/auth.controller.js";


const authRouter = express.Router();

authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);
authRouter.get("/signout", signOut);

// These will now work because they are included in the import above
authRouter.post("/send-otp", sendOtp);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/google-auth", googleAuth);


export default authRouter;