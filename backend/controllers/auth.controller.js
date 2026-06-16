import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../utils/genToken.js";
import {sendOtpMail} from "../utils/mail.js";


export const signUp = async (req, res) => {
    try {
        const { fullName, email, password, mobile, role } = req.body;

        // 1. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // 2. Validation (MUST happen before saving)
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        if (mobile.length !== 10) {
            return res.status(400).json({ message: "Mobile number must be 10 digits long" });
        }

        // 3. Hash the password BEFORE creating the user
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create and Save the user ONLY ONCE
        const newUser = await User.create({ 
            fullName, 
            email, 
            password: hashedPassword, 
            mobile, 
            role 
        });

        // 5. Generate Token
        const token = await genToken(newUser._id);

        // 6. Set Cookie
        res.cookie("token", token, {
            secure: process.env.NODE_ENV === "production", // Use true if using HTTPS
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // Corrected to maxAge
            httpOnly: true,
        });

        // 7. Send the FINAL and ONLY response
        return res.status(201).json({ 
            message: "User created successfully", 
            token,
            user: {
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        
        const token = await genToken(user._id);
        
        res.cookie("token", token, {
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
        });
        
        return res.status(200).json({ 
            message: "User signed in successfully", 
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const signOut = async (req, res) => {
    try {
        res.clearCookie("token");
        return res.status(200).json({ message: "User signed out successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }

        // Generate OTP (example: 6-digit number)
        const otp = Math.floor(100000 + Math.random() * 900000);
        user.resetOtp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        user.isOtpVerified = false; // Reset OTP verification status
        await user.save();

        // Send OTP via email
        await sendOtpMail(user.email, otp);

        return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }

        if (user.resetOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (Date.now() > user.otpExpires) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        user.isOtpVerified = true;
        user.resetOtp = undefined;
        user.otpExpires = undefined;
        await user.save();

        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

 export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }

        if (!user.isOtpVerified) {
            return res.status(400).json({ message: "Please verify OTP before resetting password" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.isOtpVerified = false; // Reset OTP verification status
        await user.save();

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
 } 

 export const googleAuth = async (req, res) => {
    try {
        const { fullName, email, mobile, role } = req.body;
        
        // 1. Use 'let' so we can re-assign the variable if we create a user
        let user = await User.findOne({ email });

        if (!user) {
            // 💡 FIX: If Google doesn't provide mobile or role, set safe defaults 
            // so your Mongoose schema validator won't crash with a 500 error.
            const defaultMobile = mobile || `google_${Date.now().toString().slice(-6)}`;
            const defaultRole = role || "user";

            // 2. Create the user and assign it to our 'user' variable
            user = await User.create({
                fullName,
                email,
                mobile: defaultMobile, 
                role: defaultRole
            });
        }

        // 3. Use 'user._id'
        const token = await genToken(user._id);

        // 4. Set Cookie
        res.cookie("token", token, {
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
        });

        // 5. Return success and user data
        return res.status(200).json({
            message: "Google authentication successful",
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        // Log the exact error directly in your backend console so you can inspect it!
        console.error("💥 Google Auth Internal Error Details:", error);
        return res.status(500).json({ message: error.message });
    }
};
