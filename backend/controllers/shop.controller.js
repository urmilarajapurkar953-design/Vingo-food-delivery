import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import Item from "../models/item.model.js";
import fs from "fs";

// 1. GET ALL SHOPS (Crucial for UserDashboard)
// 1. GET ALL SHOPS (Filtered by City)
// 1. GET ALL SHOPS (Perfectly Filtered by City & Address fallback)
export const getAllShops = async (req, res) => {
    try {
        const { city } = req.query; // Get city from URL: ?city=Mira-Bhayander
        
        let query = {};
        
        // Safely validate that a genuine city query value exists
        if (
            city && 
            city.trim() !== "" && 
            city !== "your area" && 
            city !== "undefined" && 
            city !== "null"
        ) {
            const searchRegex = new RegExp(city.trim(), "i");
            
            // 🔥 THE FIX: Search across both 'city' AND 'address' fields so it doesn't return empty!
            query = {
                $or: [
                    { city: searchRegex },
                    { address: searchRegex }
                ]
            };
        }

        const shops = await Shop.find(query).populate("owner items");
        return res.status(200).json(shops);
    } catch (error) {
        console.error("Error fetching shops:", error);
        return res.status(500).json({ message: error.message });
    }
};

// 2. CREATE OR EDIT SHOP
export const createEditShop = async (req, res) => {
    try {
        const { name, city, state, address } = req.body;
        const ownerId = req.user?._id;

        if (!ownerId) return res.status(401).json({ message: "Unauthorized." });

        let shop = await Shop.findOne({ owner: ownerId });
        let imageUrl = shop ? shop.image : ""; 

        if (req.file) {
            const uploadResponse = await uploadOnCloudinary(req.file.path);
            if (uploadResponse?.secure_url) {
                imageUrl = uploadResponse.secure_url;
            }
        }

        if (!imageUrl) return res.status(400).json({ message: "Shop image is required" });

        if (!shop) {
            shop = await Shop.create({
                name, city, state, address,
                image: imageUrl,
                owner: ownerId,
            });
        } else {
            // Using returnDocument: 'after' for the latest Mongoose standards
            shop = await Shop.findByIdAndUpdate(
                shop._id, 
                { name, city, state, address, image: imageUrl }, 
                { returnDocument: 'after', runValidators: true }
            );
        }

        await shop.populate("owner items"); 
        return res.status(200).json({ message: "Shop saved successfully", shop });

    } catch (error) {
        console.error("Shop Controller Error:", error);
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};
// ... rest of controller (addItem, etc.) remains same
// Ensure getMyShop also handles the empty state correctly
export const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.user._id }).populate("owner items");
        // Return null if no shop, so frontend loading logic works correctly
        return res.status(200).json(shop); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. ADD ITEM TO SHOP
export const addItem = async (req, res) => {
    try {
        const { name, category, foodType, price } = req.body;
        
        // 1. Check if file actually exists
        if (!req.file) {
            return res.status(400).json({ message: "Food item image is required" });
        }

        const result = await uploadOnCloudinary(req.file.path);
        if (!result?.secure_url) {
            return res.status(500).json({ message: "Failed to upload image to Cloudinary" });
        }

        const shop = await Shop.findOne({ owner: req.user._id });
        if (!shop) return res.status(404).json({ message: "Shop not found" });

        // 2. Create item with the NEWLY uploaded result ONLY
        const item = await Item.create({
            name,
            category,
            foodType,
            price: Number(price), 
            image: result.secure_url, // Strict assignment
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



export const getItemsByCity = async (req, res) => {
    try {
        const { city } = req.query;

        let query = {};
        if (city && city !== "your area" && city !== "undefined" && city !== "null") {
            // Find shops in that city first
            const shopsInCity = await Shop.find({ 
                city: { $regex: new RegExp(city.trim(), "i") } 
            }).select("_id");

            const shopIds = shopsInCity.map(shop => shop._id);
            query = { shop: { $in: shopIds } };
        }

        // Fetch items and ONLY populate the shop name to avoid image confusion
        const items = await Item.find(query)
            .populate("shop", "name") // We only need the shop name for the UI
            .sort({ createdAt: -1 });

        return res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
