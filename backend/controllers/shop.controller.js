import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import Item from "../models/Item.model.js";
import fs from "fs";

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
                return res.status(500).json({ message: "Failed to get URL from Cloudinary" });
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

export const getMyShop = async (req, res) => {
    try {
        // Ensure req.user exists before querying
        if (!req.user?._id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const shop = await Shop.findOne({ owner: req.user._id }).populate("owner items");
        
        // Return an empty object if no shop is found instead of null
        return res.status(200).json(shop || {}); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addItem = async (req, res) => {
    try {
        const { name, category, foodType, price } = req.body;
        let imageUrl = "";

        if (req.file) {
            // FIX: Use the helper function 'uploadOnCloudinary' 
            // instead of 'cloudinary.uploader.upload'
            const result = await uploadOnCloudinary(req.file.path);
            if (result) {
                imageUrl = result.secure_url;
            }
        }

        const shop = await Shop.findOne({ owner: req.user._id }).populate("items");
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
        // Using the populate method on an existing document instance
await shop.populate([
    {
        path: 'items',
        options: { sort: { createdAt: -1 } } // Newest items at the top
    },
    {
        path: 'owner'
    }
]);
        return res.status(201).json(shop);

        console.log("--- DATA RECEIVED BY BACKEND ---");
        console.log("Body:", req.body); // Shows name, price, category
        console.log("File:", req.file); // Shows if image was received by Multer
        console.log("User ID:", req.user?._id); // Shows if isAuth is working

        // FIX: Return the variable 'item', NOT the Model 'Shop'
        res.status(201).json(item);

    } catch (error) {
        console.error("Add Item Error:", error);
        res.status(500).json({ message: error.message });
    }
}

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

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // Fetch the updated shop and populate it
const shop = await Shop.findOne({ owner: req.user._id })
    .populate({
        path: 'items',
        options: { sort: { createdAt: -1 } } // Sorts by newest first
    })
    .populate("owner");
        // Return the shop object directly so Redux stays clean
        res.status(200).json(shop); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getItemById = async (req, res) => {
    try {
        const { itemId } = req.params;
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        
        // 1. Delete the actual item document
        const item = await Item.findByIdAndDelete(itemId);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // 2. Find the shop and remove the item ID from its array
        const shop = await Shop.findOne({ owner: req.user._id });
        if (shop) {
            shop.items = shop.items.filter(id => id.toString() !== itemId);
            await shop.save();

            // 3. Populate everything so the frontend stays fully hydrated
            await shop.populate([
                {
                    path: "items",
                    options: { sort: { createdAt: -1 } } 
                },
                {
                    path: "owner"
                }
            ]);
        }

        // 4. CRITICAL: Return the SHOP object, not just a message
        res.status(200).json(shop); 
        
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ message: error.message });
    }
}