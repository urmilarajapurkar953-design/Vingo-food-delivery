import React, { useState } from 'react';
import { FaLocationDot, FaPlus } from "react-icons/fa6";
import { IoIosSearch } from 'react-icons/io';
import { FiShoppingCart } from 'react-icons/fi';
import { LuLayoutList } from "react-icons/lu"; 
import { useSelector, useDispatch } from 'react-redux'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setUserData } from '../redux/user.slice'; 
import { serverUrl } from '../App'; 

function Nav() {
  const { userData, currentCity, currentState, currentAddress } = useSelector((state) => state.user);
  const { myShopData } = useSelector((state) => state.owner);
  
  const [showInfo, setShowInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const dispatch = useDispatch(); 
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
        await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true });
        dispatch(setUserData(null));
        setShowInfo(false);
        navigate('/signin');
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

  return (
    <div className='w-full h-[80px] flex items-center justify-between md:justify-around px-[20px] fixed top-0 z-[9999] bg-[#fff9f6] border-b border-gray-100'>
      
      {/* Logo */}
      <h1 
        className='text-3xl font-bold text-[#ff4d2d] cursor-pointer'
        onClick={() => navigate('/')}
      >
        Vingo
      </h1>

      {/* --- RIGHT SIDE NAVIGATION --- */}
      <div className='flex items-center gap-3 md:gap-5'>
        
        {userData?.role === "owner" && (
          <>
            {myShopData && (
              <button className='flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-[#ff4d2d]/10 text-[#ff4d2d] hover:bg-[#ff4d2d]/20 transition-all'>
                <FaPlus size={16} />
                <span className='hidden md:inline font-semibold text-sm'>Add Food Item</span>
              </button>
            )}

            <button className='relative flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] hover:bg-[#ff4d2d]/20 transition-all'>
              <LuLayoutList size={20} />
              <span className='hidden md:inline font-semibold text-sm'>My Orders</span>
              <span className='absolute -right-1 -top-1 bg-[#ff4d2d] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#fff9f6]'>
                0
              </span>
            </button>
          </>
        )}

        {/* Profile Avatar */}
        <div 
          className='w-[40px] h-[40px] md:w-[45px] md:h-[45px] rounded-full flex items-center justify-center bg-[#ff4d2d] text-white text-[18px] md:text-[20px] shadow-lg font-bold cursor-pointer hover:scale-105 transition-transform' 
          onClick={() => setShowInfo(prev => !prev)}
        >
          {userData?.fullName ? userData.fullName.charAt(0).toUpperCase() : "A"}
        </div>

        {/* Profile Dropdown */}
        {showInfo && (
          <div className='fixed top-[85px] right-[20px] md:right-[10%] w-[180px] bg-white shadow-xl rounded-2xl p-5 flex flex-col gap-3 z-[9999] border border-gray-50'>
              <div className='text-gray-800 font-bold text-[15px] truncate'>
                {userData?.fullName || "Owner Name"}
              </div>
              <div 
                className='text-[#ff4d2d] font-semibold text-sm cursor-pointer hover:underline' 
                onClick={handleLogout}
              >
                Log Out
              </div>
          </div>
        )}
      </div> 
    </div> 
  );
}

export default Nav;