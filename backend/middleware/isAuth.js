import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }
        
        const decodeToken = await jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decodeToken) {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Standardize the ID: 
        // We map whatever ID property exists to _id to satisfy Mongoose requirements
        req.user = {
            ...decodeToken,
            _id: decodeToken.id || decodeToken._id 
        };
        
        next();
    } catch (error) {
        console.log("Auth Error:", error.message);
        res.status(401).json({ message: "Unauthorized or session expired" });
    }
}

export default isAuth;