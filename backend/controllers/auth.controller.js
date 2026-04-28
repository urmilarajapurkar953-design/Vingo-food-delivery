import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../utils/genToken.js";

export const signUp = async (req, res) => {
    try {
        const { fullName, email, password, mobile, role } = req.body;
        const user= await User.findOne({ email });
        if(user){
            return res.status(400).json({ message: "User already exists" });
        }
        const newUser = new User({ fullName, email, password, mobile, role });
        await newUser.save();
        res.status(201).json({ message: "User created successfully" });

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        };

        if (mobile.length !== 10) {
            return res.status(400).json({ message: "Mobile number must be 10 digits long" });
        };
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({ fullName, email, password: hashedPassword, mobile, role });

const token = await genToken(user._id);
res.cookie("token", token, {
    secure:false,
    sameSite:"strict",
    maxage: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
});
res.status(201).json({ message: "User created successfully", token });


    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user= await User.findOne({ email });
        if(!user){
            return res.status(400).json({ message: "User does not exist" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = await genToken(user._id);
        res.cookie("token", token, {
            secure:false,
            sameSite:"strict",
            maxage: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
        });
        res.status(200).json({ message: "User signed in successfully", token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const signOut = async (req, res) => {
    try {
        res.clearCookie("token");
        res.status(200).json({ message: "User signed out successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}