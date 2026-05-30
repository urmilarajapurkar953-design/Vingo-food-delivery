import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaLock, FaEnvelopeOpen, FaUndo } from 'react-icons/fa';

const RiderJobCard = ({ orderId, shopOrderId }) => {
  const [showModal, setShowModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Phase 1: Fire code generator endpoint and unlock security interface modal
  const handleInitiateDropoff = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/api/delivery/send-otp", 
        { orderId, shopOrderId }, 
        { withCredentials: true }
      );
      if (response.data.success) {
        toast.success("Verification code sent to customer email!");
        setShowModal(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to trigger security code.");
    } finally {
      setLoading(false);
    }
  };

  // Phase 2: Submit verification code input 
  const handleVerifyAndComplete = async (e) => {
    e.preventDefault();
    if (otpInput.length !== 6) return toast.error("Please provide a valid 6-digit code.");

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/api/delivery/verify-otp", 
        { orderId, shopOrderId, inputOTP: otpInput }, 
        { withCredentials: true }
      );
      if (response.data.success) {
        toast.success("Order verified and completed successfully!");
        setShowModal(false);
        // Refresh your active jobs dashboard context view here
        window.location.reload(); 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid validation token code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
      {/* Existing map routing links button block goes here... */}

      {/* Primary Action Control Switcher */}
      <button
        onClick={handleInitiateDropoff}
        disabled={loading}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
      >
        {loading ? "Requesting OTP Authorization..." : "Confirm Drop-off / Complete Run"}
      </button>

      {/* DOCK DOORSTEP CODE INPUT VALIDATION SCREEN MODAL LAYER */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-6 md:p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-orange-50 text-[#ff4d2d] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              <FaLock />
            </div>
            
            <h3 className="text-xl font-black text-gray-900 mb-2">Secure Doorstep Verification</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-6">
              Ask the customer for the 6-digit verification security pin sent directly to their registered email profile box.
            </p>

            <form onSubmit={handleVerifyAndComplete} className="space-y-4">
              <input
                type="text"
                maxLength="6"
                placeholder="• • • • • •"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-2xl font-black tracking-[12px] bg-gray-50 border-2 border-gray-100 focus:border-[#ff4d2d] focus:bg-white rounded-2xl p-4 outline-none transition-all"
              />

              <button
                type="submit"
                disabled={loading || otpInput.length !== 6}
                className="w-full bg-[#ff4d2d] hover:bg-[#e64429] text-white py-4 rounded-2xl font-bold transition-all disabled:bg-gray-200 disabled:text-gray-400"
              >
                {loading ? "Verifying..." : "Unlock & Release Order"}
              </button>
            </form>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 text-xs">
              <button 
                onClick={handleInitiateDropoff}
                disabled={resending}
                className="text-gray-500 hover:text-gray-800 font-bold flex items-center gap-1 transition-colors"
              >
                <FaUndo /> Resend Code
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="text-red-400 hover:text-red-600 font-medium transition-colors"
              >
                Cancel / Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderJobCard;