import express from "express";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { 
  addItem, 
  deleteItem, 
  editItem, 
  getItemById, 
  getItemsByCity // 1. Import the new controller
} from "../controllers/shop.controller.js";

const itemRouter = express.Router();

// Public route - No isAuth needed so the dashboard can load items immediately
itemRouter.get("/city-items", getItemsByCity); 

// Protected routes
itemRouter.post("/add-item", isAuth, upload.single("image"), addItem);
itemRouter.put("/edit-item/:itemId", isAuth, upload.single("image"), editItem);
itemRouter.post("/add", isAuth, upload.single("image"), addItem);
itemRouter.put("/edit/:itemId", isAuth, upload.single("image"), editItem);
itemRouter.get("/get-by-id/:itemId", isAuth, getItemById);
itemRouter.get("/delete/:itemId", isAuth, deleteItem);

export default itemRouter;