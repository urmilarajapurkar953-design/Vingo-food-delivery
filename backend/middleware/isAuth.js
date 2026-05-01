import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "token not found" });
        }
        
        const decodeToken = await jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decodeToken) {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Fix: Use .id because that is what is in your Decoded Token log
        // Fix: Attach to req.user so the controller knows where to find it
        req.user = decodeToken; 
        
        next();
    } catch (error) {
        console.log("Auth Error:", error.message);
        res.status(401).json({ message: "Unauthorized or session expired" });
    }
}

export default isAuth;