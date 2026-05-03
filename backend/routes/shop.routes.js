import express from "express";
import { createEditShop } from "../controllers/shop.controller.js";
import isAuth from "../middleware/isAuth.js";

const shopRouter = express.Router();

shopRouter.get("/create-edit", isAuth, createEditShop);

export default shopRouter;