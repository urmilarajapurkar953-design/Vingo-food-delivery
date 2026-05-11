import express from "express";
import { 
    createEditShop, 
    getMyShop, 
    getAllShops 
} from "../controllers/shop.controller.js";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";

const shopRouter = express.Router();

// Public route - anyone can see the list of shops
shopRouter.get("/all", getAllShops);

// Protected routes - requires login
shopRouter.post("/create-edit", isAuth, upload.single("image"), createEditShop);
shopRouter.get("/get-my", isAuth, getMyShop);

export default shopRouter;