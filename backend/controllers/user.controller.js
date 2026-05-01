import User from "../models/user.model.js"; // Ensure this import exists

export const getCurrentUser = async (req, res) => {
    try {
        // Change from req.userId to req.user.id
        const userId = req.user?.id; 

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: No user ID found" });
        }

        const user = await User.findById(userId).select("-password"); // Exclude password for security
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return the user object directly or as { user }
        return res.status(200).json(user); 
    } catch (error) {
        console.error("Controller Error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}