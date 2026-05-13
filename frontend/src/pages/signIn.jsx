import React, { useState, useEffect } from 'react'; // Added useEffect
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from "react-icons/fc";
import axios from 'axios';
import toast from 'react-hot-toast';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';
import { useDispatch, useSelector } from 'react-redux'; // Added useSelector
import { setUserData } from '../redux/user.Slice';

function SignIn() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Define primaryColor since it was used but not defined
  const primaryColor = "#ff4d2d";
  
  // Get userData to watch for successful login
  const { userData } = useSelector((state) => state.user || {});
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect automatically when userData is populated in Redux
  useEffect(() => {
    if (userData) {
      console.log("User detected, navigating home...");
      navigate("/home");
    }
  }, [userData, navigate]);

  const handleSignIn = async () => {
    if (!email || !password) return toast.error("Please fill all fields");
    
    setLoading(true);
    const loadingToast = toast.loading("Signing in...");

    try {
      const result = await axios.post(`http://localhost:8000/api/auth/signin`, { email, password }, { withCredentials: true });
      dispatch(setUserData(result.data));
      toast.success("Signed in!", { id: loadingToast });
    } catch (error) {
      toast.error(error.response?.data?.message || "Sign-in failed", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    const loadingToast = toast.loading("Connecting to Google...");
    try {
      const provider = new GoogleAuthProvider();
      const firebaseResult = await signInWithPopup(auth, provider);
      
      const dbResponse = await axios.post(
        `http://localhost:8000/api/auth/google-auth`, 
        { email: firebaseResult.user.email }, 
        { withCredentials: true }
      );

      dispatch(setUserData(dbResponse.data)); 
      toast.success("Welcome back!", { id: loadingToast });
      
    } catch (error) {
      console.error("Auth Error:", error);
      toast.error("Google login failed", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen w-full flex items-center justify-center p-4 bg-[#fff9f6]'>
      <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8 border-[1px] border-[#ddd]'>
        <h1 className='text-3xl font-bold mb-2' style={{ color: primaryColor }}>Vingo</h1>
        <p className='text-gray-600 mb-8'>Welcome back! Please sign in.</p>

        <div className='mb-4'>
          <label className='block text-gray-700 font-medium mb-1'>Email</label>
          <input type="email" className='w-full border rounded-lg px-3 py-2' value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className='mb-4'>
          <label className='block text-gray-700 font-medium mb-1'>Password</label>
          <input type="password" className='w-full border rounded-lg px-3 py-2' value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button
          disabled={loading}
          onClick={handleSignIn}
          className="w-full text-white font-medium py-2 rounded-lg disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? "Authenticating..." : "Sign In"}
        </button>

        <button
          disabled={loading}
          onClick={handleGoogleAuth}
          className="flex items-center justify-center gap-3 w-full border mt-4 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <FcGoogle size={20} />
          <span>{loading ? "Verifying..." : "Sign In with Google"}</span>
        </button>

        <p className='text-center mt-6'>
          New here? <span className="text-orange-500 hover:underline cursor-pointer" onClick={() => navigate('/signup')}>Sign Up</span>
        </p>
      </div>
    </div>
  );
}

export default SignIn; // <--- MUST HAVE THIS LINE