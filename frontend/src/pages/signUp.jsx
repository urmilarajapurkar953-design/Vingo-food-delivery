import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from "react-icons/fc";
import axios from 'axios';
import toast from 'react-hot-toast';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/user.slice';

function SignUp() {
  const serverUrl = "http://localhost:8000";
  const primaryColor = "#ff4d2d";
  const bgColor = "#fff9f6";
  const borderColor = "#ddd";

  const [role, setRole] = useState("user");
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // New Loading State
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
      const backendMessage = error.response?.data?.message || "Registration failed";
      toast.error(backendMessage, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!mobile) {
      toast.error("Please enter mobile number first.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Authenticating with Google...");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      await axios.post(`${serverUrl}/api/auth/google-auth`, {
        fullName: result.user.displayName,
        email: result.user.email,
        mobile: mobile,
        role: "user"
      }, { withCredentials: true });

      dispatch(setUserData(result.data));

      toast.success("Welcome!", { id: loadingToast });
      navigate("/signin");
    } catch (error) {
      toast.error(error.response?.data?.message || "Google Auth failed", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen w-full flex items-center justify-center p-4' style={{ backgroundColor: bgColor }}>
      <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8 border-[1px]' style={{ border: `1px solid ${borderColor}` }}>
        <h1 className='text-3xl font-bold mb-2' style={{ color: primaryColor }}>Vingo</h1>
        <p className='text-gray-600 mb-8'>Create your account to get started.</p>

        <div className='mb-4'>
          <label className='block text-gray-700 font-medium mb-1'>Full Name</label>
          <input type="text" className='w-full border rounded-lg px-3 py-2 focus:outline-none' placeholder='Enter Name' value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div className='mb-4'>
          <label className='block text-gray-700 font-medium mb-1'>Email</label>
          <input type="email" className='w-full border rounded-lg px-3 py-2 focus:outline-none' placeholder='Enter Email' value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className='mb-4'>
          <label className='block text-gray-700 font-medium mb-1'>Mobile</label>
          <input type="text" className='w-full border rounded-lg px-3 py-2 focus:outline-none' placeholder='Enter Mobile' value={mobile} onChange={(e) => setMobile(e.target.value)} />
        </div>

        <div className='mb-4'>
          <label className='block text-gray-700 font-medium mb-1'>Password</label>
          <input type="password" className='w-full border rounded-lg px-3 py-2 focus:outline-none' placeholder='Enter Password' value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button
          disabled={loading}
          className={`w-full text-white font-medium py-2 px-4 rounded-lg transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-600'}`}
          style={{ backgroundColor: primaryColor }}
          onClick={handleSignUp}
        >
          {loading ? "Please wait..." : "Sign Up"}
        </button>

        <button
          disabled={loading}
          onClick={handleGoogleAuth}
          className="flex items-center justify-center gap-3 w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 mt-4 hover:bg-gray-50 disabled:opacity-50"
        >
          <FcGoogle size={20} />
          <span>{loading ? "Connecting..." : "Sign Up with Google"}</span>
        </button>

        <p className='text-center mt-6'>
          Already have an account? <span className="text-orange-500 hover:underline cursor-pointer" onClick={() => navigate('/signin')}>Sign In</span>
        </p>
      </div>
    </div>
  );
}

export default SignUp;