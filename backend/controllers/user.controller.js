import User from "../models/user.model.js"; // Ensure this import exists

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user?.id; 
        if (!userId) return res.status(401).json({ message: "No ID" });

        const user = await User.findById(userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        // CRITICAL: Ensure you send 'user' inside an object or directly
        return res.status(200).json({ user }); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}