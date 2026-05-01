import React, { useState } from 'react';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { serverUrl } from '../App';

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const primaryColor = "#f97316";

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadId = toast.loading("Sending OTP...");
    try {
      await axios.post(`${serverUrl}/api/auth/send-otp`, { email }, { withCredentials: true });
      toast.success("OTP sent!", { id: loadId });
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send", { id: loadId });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadId = toast.loading("Verifying...");
    try {
      await axios.post(`${serverUrl}/api/auth/verify-otp`, { email, otp }, { withCredentials: true });
      toast.success("Verified!", { id: loadId });
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP", { id: loadId });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Passwords mismatch");

    setLoading(true);
    const loadId = toast.loading("Updating password...");
    try {
      await axios.post(`${serverUrl}/api/auth/reset-password`, { email, newPassword }, { withCredentials: true });
      toast.success("Password updated!", { id: loadId });
      navigate("/signin");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed update", { id: loadId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex w-full items-center justify-center min-h-screen p-4 bg-[#fff9f6]'>
      <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8'>
        <div className='flex items-center gap-4 mb-4'>
          <IoIosArrowRoundBack size={30} className='text-[#ff4d2d] cursor-pointer' onClick={() => step > 1 ? setStep(step - 1) : navigate('/signin')} />
          <h1 className='text-2xl font-bold text-[#ff4d2d]'>
            {step === 1 ? "Forgot Password" : step === 2 ? "Verify OTP" : "Reset Password"}
          </h1>
        </div>

        <form onSubmit={step === 1 ? handleSendOtp : step === 2 ? handleVerifyOtp : handleResetPassword}>
          {step === 1 && (
            <div className='mb-4'>
              <label className='block text-gray-700 mb-1'>Email</label>
              <input type="email" required className='w-full border rounded-lg px-3 py-2' value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          )}

          {step === 2 && (
            <div className='mb-4'>
              <label className='block text-gray-700 mb-1'>OTP</label>
              <input type="text" required className='w-full border rounded-lg px-3 py-2' value={otp} onChange={(e) => setOtp(e.target.value)} />
            </div>
          )}

          {step === 3 && (
            <>
              <div className='mb-4'>
                <label className='block text-gray-700 mb-1'>New Password</label>
                <input type="password" required className='w-full border rounded-lg px-3 py-2' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className='mb-4'>
                <label className='block text-gray-700 mb-1'>Confirm Password</label>
                <input type="password" required className='w-full border rounded-lg px-3 py-2' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className='w-full text-white font-medium py-2 rounded-lg transition-all disabled:opacity-50'
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? "Working..." : step === 1 ? "Send OTP" : step === 2 ? "Verify OTP" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;