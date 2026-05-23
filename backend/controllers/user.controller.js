import User from "../models/user.model.js"; 

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user?.id; 
        if (!userId) return res.status(401).json({ message: "No ID" });

        const user = await User.findById(userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({ user }); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const updateUserLocation = async (req, res) => {
    try {
        const { lat, lon } = req.body;
        
        // FIX: Changed from req.userId to req.user?.id to match your auth structure
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized access: Missing user identification" });
        }

        const user = await User.findByIdAndUpdate(userId, {
            location: {
                type: 'Point',
                coordinates: [lon, lat] // GEOJson coordinates order is always [longitude, latitude]
            }
        }, { new: true });

        if (!user) {
            return res.status(400).json({ message: "user is not found" });
        }

        return res.status(200).json({ message: 'location updated' });
    } catch (error) {
        return res.status(500).json({ message: `update location error: ${error.message}` });
    }
};