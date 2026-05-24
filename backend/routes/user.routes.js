import express from "express";
import { getCurrentUser, updateUserLocation } from "../controllers/user.controller.js";
import isAuth from "../middleware/isAuth.js";

const userRouter = express.Router();

userRouter.get("/current", isAuth, getCurrentUser);
userRouter.post("/update-location", isAuth, updateUserLocation);

// ADD THIS ROUTE: Handles clearing authentication cookies for any logged-in user
userRouter.post("/logout", (req, res) => {
  try {
    return res
      .status(200)
      .cookie("token", "", { 
        expires: new Date(0), 
        httpOnly: true, 
        secure: true, 
        sameSite: "none" 
      })
      .json({ success: true, message: "Logged out safely!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server logout failed" });
  }
});

export default userRouter;