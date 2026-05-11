import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import Item from "../models/Item.model.js";
import fs from "fs";

// 1. GET ALL SHOPS (Crucial for UserDashboard)
export const getAllShops = async (req, res) => {
    try {
        // Fetches every shop in the database for the general feed
        const shops = await Shop.find().populate("owner items");
        return res.status(200).json(shops);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. CREATE OR EDIT SHOP (Owner Only)
export const createEditShop = async (req, res) => {
    try {
        const { name, city, state, address } = req.body;
        const ownerId = req.user?._id;

        if (!ownerId) {
            return res.status(401).json({ message: "Unauthorized. Please login." });
        }

        let shop = await Shop.findOne({ owner: ownerId });
        let imageUrl = shop ? shop.image : ""; 

        if (req.file) {
            const uploadResponse = await uploadOnCloudinary(req.file.path);
            if (uploadResponse && uploadResponse.secure_url) {
                imageUrl = uploadResponse.secure_url;
            } else {
                return res.status(500).json({ message: "Failed to upload image" });
            }
        }

        if (!imageUrl) {
            return res.status(400).json({ message: "Shop image is required" });
        }

        if (!shop) {
            shop = await Shop.create({
                name, city, state, address,
                image: imageUrl,
                owner: ownerId,
            });
        } else {
            shop = await Shop.findByIdAndUpdate(
                shop._id, 
                { name, city, state, address, image: imageUrl }, 
                { new: true }
            );
        }

        await shop.populate("owner"); 
        return res.status(200).json({ message: "Shop saved successfully", shop });

    } catch (error) {
        console.error("Shop Controller Error:", error);
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};

// 3. GET LOGGED-IN USER'S SHOP
export const getMyShop = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const shop = await Shop.findOne({ owner: req.user._id }).populate("owner items");
        return res.status(200).json(shop || {}); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. ADD ITEM TO SHOP
export const addItem = async (req, res) => {
    try {
        const { name, category, foodType, price } = req.body;
        let imageUrl = "";

        if (req.file) {
            const result = await uploadOnCloudinary(req.file.path);
            if (result) imageUrl = result.secure_url;
        }

        const shop = await Shop.findOne({ owner: req.user._id });
        if (!shop) {
            return res.status(400).json({ message: "Shop not found for the user" });
        }

        const item = await Item.create({
            name,
            category,
            foodType,
            price: Number(price), 
            image: imageUrl,
            shop: shop._id,
        });

        shop.items.push(item._id);
        await shop.save();

        await shop.populate([
            { path: 'items', options: { sort: { createdAt: -1 } } },
            { path: 'owner' }
        ]);

        return res.status(201).json(shop);

    } catch (error) {
        console.error("Add Item Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 5. EDIT EXISTING ITEM
export const editItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { name, category, foodType, price } = req.body;
        let imageUrl;

        if (req.file) {
            const result = await uploadOnCloudinary(req.file.path);
            if (result) imageUrl = result.secure_url;
        }

        const item = await Item.findByIdAndUpdate(
            itemId,
            { name, category, foodType, price: Number(price), image: imageUrl },
            { new: true }
        );

        if (!item) return res.status(404).json({ message: "Item not found" });

        const shop = await Shop.findOne({ owner: req.user._id })
            .populate({ path: 'items', options: { sort: { createdAt: -1 } } })
            .populate("owner");

        res.status(200).json(shop); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. DELETE ITEM
export const deleteItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        
        const item = await Item.findByIdAndDelete(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });

        const shop = await Shop.findOne({ owner: req.user._id });
        if (shop) {
            shop.items = shop.items.filter(id => id.toString() !== itemId);
            await shop.save();
            await shop.populate([
                { path: "items", options: { sort: { createdAt: -1 } } },
                { path: "owner" }
            ]);
        }

        res.status(200).json(shop); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 7. GET SINGLE ITEM BY ID
export const getItemById = async (req, res) => {
    try {
        const { itemId } = req.params;
        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};