import express from "express";
import { acceptDeliveryJob } from "../controllers/delivery.controller.js";
import isAuth from "../middleware/isAuth.js";

const deliveryRouter = express.Router();

// Endpoint for driver application to accept an active broadcast job
deliveryRouter.post("/accept-job", isAuth, acceptDeliveryJob);

export default deliveryRouter;