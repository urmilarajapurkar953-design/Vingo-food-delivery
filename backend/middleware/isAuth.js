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
       console.log("Decoded Token:", decodeToken); // Debugging line
        req.userId = decodeToken.userId;
        next();
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}