import cloudinary from "../utils/cloudinary.js";
import Item from "../models/Item.model.js";
import Shop from "../models/shop.model.js";

export const addItem = async (req, res) => {
    try {
        const { name, category, foodType, price } = req.body;
        let image;
        if (req.file) {
            image = await cloudinary.uploader.upload(req.file.path);
            image = image.secure_url;
        }
        const shop = await Shop.findOne({ owner: req.user._id });
        if (!shop) {
            return res.status(400).json({ message: "Shop not found for the user" });
        }
        const item = await Item.create({
            name,
            category,
            foodType,
            price,
            image,
            shop: shop._id,
        });
        res.status(201).json({ message: "Item added successfully", item });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const editItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { name, category, foodType, price } = req.body;
        let image;
        if (req.file) {
            image = await cloudinary.uploader.upload(req.file.path);
            image = image.secure_url;
        }
        const item = await Item.findByIdAndUpdate(
            itemId,
            { name, category, foodType, price, image },
            { new: true }
        );
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        res.status(200).json({ message: "Item updated successfully", item });
    } catch (error) {
        res.status(500).json({ message: error.message });
        
    }
}