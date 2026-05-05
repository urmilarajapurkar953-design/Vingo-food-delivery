import express from "express";
import isAuth from "../middleware/isAuth.js";
import { addItem, editItem } from "../controllers/item.controller.js";
import upload from "../middleware/multer.js";

const itemRouter = express.Router();

itemRouter.post("/add-item", isAuth, upload.single("image"), addItem);
itemRouter.put("/edit-item/:itemId", isAuth, upload.single("image"), editItem);
itemRouter.post("/add", isAuth, upload.single("image"), addItem);
itemRouter.put("/edit/:itemId", isAuth, upload.single("image"), editItem);

export default itemRouter;