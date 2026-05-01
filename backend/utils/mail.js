import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  service: "Gmail",
    port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

export const sendOtpMail = async (to, otp) => {
await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject: "Your OTP for Password Reset",
    text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
});
}