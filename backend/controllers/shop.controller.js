// backend/controllers/shop.controller.js
import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import fs from "fs";

export const createEditShop = async (req, res) => {
    try {
        const { name, city, state, address } = req.body;
        const ownerId = req.user?._id;

        if (!ownerId) {
            return res.status(401).json({ message: "Unauthorized. Please login." });
        }

        // 1. Find existing shop
        let shop = await Shop.findOne({ owner: ownerId });
        
        // 2. Default to existing image
        let imageUrl = shop ? shop.image : ""; 

        // 3. Process new image if provided
        if (req.file) {
            console.log("Multer saved file to:", req.file.path);
            const uploadResponse = await uploadOnCloudinary(req.file.path);
            
            if (uploadResponse && uploadResponse.secure_url) {
                imageUrl = uploadResponse.secure_url;
                console.log("Cloudinary URL generated:", imageUrl);
            } else {
                return res.status(500).json({ message: "Failed to get URL from Cloudinary" });
            }
        }

        // 4. Final Validation: If no new file and no old file, then it's an error
        if (!imageUrl) {
            return res.status(400).json({ message: "Shop image is required" });
        }

        if (!shop) {
            // CREATE NEW
            shop = await Shop.create({
                name,
                city,
                state,
                address,
                image: imageUrl,
                owner: ownerId,
            });
        } else {
            // UPDATE EXISTING
            shop = await Shop.findByIdAndUpdate(
                shop._id, 
                { name, city, state, address, image: imageUrl }, 
                { new: true }
            );
        }

        await shop.populate("owner"); 

        return res.status(200).json({ 
            message: "Shop saved successfully", 
            shop 
        });

    } catch (error) {
        console.error("Shop Controller Error:", error);
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};

export const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.user._id }).populate("owner");
        return res.status(200).json(shop || null);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};