import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from "react-icons/fc";
import axios from 'axios';
import toast from 'react-hot-toast';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/user.Slice';

function SignUp() {
  const serverUrl = "http://localhost:8000";
  const primaryColor = "#ff4d2d";
  const bgColor = "#fff9f6";
  const borderColor = "#ddd";

  const [role, setRole] = useState("user"); // "user" is colored by default
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSignUp = async () => {
    if (!fullName || !email || !mobile || !password) {
      return toast.error("Please fill all fields");
    }
    setLoading(true);
    const loadingToast = toast.loading("Creating account...");
    try {
      const result = await axios.post(`${serverUrl}/api/auth/signup`, {
        fullName, email, mobile, password, role
      }, { withCredentials: true });
      dispatch(setUserData(result.data));
      toast.success("Account created!", { id: loadingToast });
      navigate("/signin");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!mobile) return toast.error("Please enter mobile number first.");
    setLoading(true);
    const loadingToast = toast.loading("Authenticating...");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const response = await axios.post(`${serverUrl}/api/auth/google-auth`, {
        fullName: result.user.displayName,
        email: result.user.email,
        mobile: mobile,
        role: role
      }, { withCredentials: true });
      dispatch(setUserData(response.data));
      toast.success("Welcome!", { id: loadingToast });
      navigate("/signin");
    } catch (error) {
      toast.error("Google Auth failed", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen w-full flex items-center justify-center p-4' style={{ backgroundColor: bgColor }}>
      <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8 border border-gray-200'>
        <h1 className='text-3xl font-bold mb-2' style={{ color: primaryColor }}>Vingo</h1>
        <p className='text-gray-600 mb-6'>Create your account to get started.</p>

        {/* Input Fields */}
        <div className='space-y-4 mb-6'>
          <div>
            <label className='block text-gray-700 font-medium mb-1'>Full Name</label>
            <input type="text" className='w-full border rounded-lg px-3 py-2 focus:outline-none' value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder='Enter Name' />
          </div>
          <div>
            <label className='block text-gray-700 font-medium mb-1'>Email</label>
            <input type="email" className='w-full border rounded-lg px-3 py-2 focus:outline-none' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Enter Email' />
          </div>
          <div>
            <label className='block text-gray-700 font-medium mb-1'>Mobile</label>
            <input type="text" className='w-full border rounded-lg px-3 py-2 focus:outline-none' value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder='Enter Mobile' />
          </div>
          <div>
            <label className='block text-gray-700 font-medium mb-1'>Password</label>
            <input type="password" className='w-full border rounded-lg px-3 py-2 focus:outline-none' value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Enter Password' />
          </div>
        </div>

        {/* --- CUSTOM ROLE SELECTION (Matches Reference Image) --- */}
        <div className='mb-8'>
          <label className='block text-gray-500 text-sm font-bold mb-3 uppercase tracking-wide'>Role</label>
          <div className='flex items-center gap-3'>
            {['user', 'owner', 'deliveryBoy'].map((item) => (
              <button
                key={item}
                onClick={() => setRole(item)}
                className={`flex-1 py-2 px-1 rounded-lg text-sm font-bold transition-all duration-200 border-2 ${
                  role === item 
                    ? 'bg-[#ff4d2d] border-[#ff4d2d] text-white' 
                    : 'bg-white border-gray-200 text-[#ff4d2d] hover:border-[#ff4d2d]/30'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={loading}
          className={`w-full text-white font-bold py-3 rounded-lg mb-4 transition-all ${loading ? 'opacity-70' : 'hover:brightness-110'}`}
          style={{ backgroundColor: primaryColor }}
          onClick={handleSignUp}
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <button
          disabled={loading}
          onClick={handleGoogleAuth}
          className="flex items-center justify-center gap-3 w-full bg-white border border-gray-300 rounded-lg py-2.5 hover:bg-gray-50 mb-6"
        >
          <FcGoogle size={20} />
          <span className='font-medium'>Sign Up with Google</span>
        </button>

        <p className='text-center text-gray-600'>
          Already have an account? <span className="text-[#ff4d2d] font-bold cursor-pointer hover:underline" onClick={() => navigate('/signin')}>Sign In</span>
        </p>
      </div>
    </div>
  );
}

export default SignUp;