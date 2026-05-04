import Shop from "../models/shop.model";
import cloudinary from "../utils/cloudinary.js";

export const createEditShop = async (req, res) => {
    try {
        const { name, city, state, address } = req.body;
        
        let shop = await Shop.findOne({ owner: req.user._id });
        
        // Handle Image Upload
        let imageUrl;
        if (req.file) {
            const uploadResponse = await cloudinary.uploader.upload(req.file.path);
            imageUrl = uploadResponse.secure_url; // Extract the actual URL
        } else {
            // If no new image, keep the old one (only applies to update)
            imageUrl = shop ? shop.image : undefined;
        }

        if (!shop) {
            // CREATE NEW SHOP
            shop = await Shop.create({
                name,
                city,
                state,
                address,
                image: imageUrl,
                owner: req.user._id,
            });
        } else {
            // UPDATE EXISTING SHOP
            shop = await Shop.findByIdAndUpdate(
                shop._id, 
                {
                    name,
                    city,
                    state,
                    address,
                    image: imageUrl, // Uses new URL or remains the same
                }, 
                { new: true }
            );
        } // Closed correctly here

        // Populate and Send Response
        await shop.populate("owner");
        
        // Return 200 for update, 201 for creation (optional distinction)
        return res.status(200).json({ 
            message: "Shop processed successfully", 
            shop 
        });

    } catch (error) {
        console.error("Shop Error:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.user._id }).populate("owner items");
        if (!shop) {
            return res.status(404).json({ message: "Shop not found for the user" });
        }
        return res.status(200).json({ shop });
        
    } catch (error) {
        console.error("Shop Error:", error);
        res.status(500).json({ message: error.message });
    }
}
