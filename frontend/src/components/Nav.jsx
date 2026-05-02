import React, { useState } from 'react';
import { FaLocationDot } from "react-icons/fa6";
import { IoIosSearch } from 'react-icons/io';
import { FiShoppingCart } from 'react-icons/fi';
// 1. ADD THESE IMPORTS
import { useSelector, useDispatch } from 'react-redux'; 
import axios from 'axios';
import { setUserData } from '../redux/user.Slice'; // Adjust this path to your actual slice file
import { serverUrl } from '../App'; // Adjust this path to where your serverUrl is defined

function Nav() {
  const { userData, city } = useSelector((state) => state.User);
  const [showInfo, setShowInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  // 2. This will now work because of the import
  const dispatch = useDispatch(); 

  const handleLogout = async () => {
    try {
        // 3. axios and serverUrl are now defined
        const result = await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true });
        dispatch(setUserData(null));
        setShowInfo(false);
    } catch (error) {
        console.error("Logout failed", error);
    }
  };
  return (
    <div className='w-full h-[80px] flex items-center justify-between md:justify-around gap-[20px] px-[20px] fixed top-0 z-[9999] bg-[#fff9f6] border-b border-gray-100'>
      
      {/* Logo */}
      <h1 className='text-3xl font-bold text-[#ff4d2d] cursor-pointer'>Vingo</h1>

      {/* 
         Combined Search Bar Logic:
         On Mobile: It appears as an absolute dropdown when showSearch is true.
         On Desktop: It is always part of the flex row (md:flex).
      */}
      <div className={`
        ${showSearch ? 'flex' : 'hidden'} 
        absolute top-[80px] left-0 w-full px-[20px] 
        md:static md:flex md:w-[50%] lg:w-[40%] md:px-0 z-[9998]
      `}>
        <div className='flex w-full h-[50px] bg-white shadow-lg md:shadow-md rounded-lg items-center gap-[10px] px-[15px] border border-gray-100'>
          <div className='flex items-center gap-[5px] border-r-[1px] border-gray-300 pr-[10px] max-w-[35%]'>
            <FaLocationDot size={18} className="text-[#ff4d2d] shrink-0" />
            <div className='truncate text-xs md:text-sm text-gray-600'>{city}</div>
          </div>
          <div className='flex-1 flex items-center gap-[8px]'>
            <IoIosSearch size={20} className='text-[#ff4d2d] shrink-0' />
            <input 
              autoFocus={showSearch}
              placeholder='Search delicious food...' 
              className='text-sm text-gray-700 outline-none w-full bg-transparent' 
            />
          </div>
        </div>
      </div>

      {/* Right Side Icons */}
      <div className='flex items-center gap-5'>
        
        {/* Mobile Search Toggle - FIXED WITH ONCLICK */}
        <IoIosSearch 
          size={25} 
          className='text-[#ff4d2d] md:hidden cursor-pointer' 
          onClick={() => setShowSearch(prev => !prev)} 
        />

        <div className='relative cursor-pointer'>
          <FiShoppingCart size={25} className='text-[#ff4d2d]' />
          <span className='absolute -right-2 -top-2 bg-[#ff4d2d] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full'>
            0
          </span>
        </div>

        <button className='hidden md:block px-4 py-1.5 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] text-sm font-semibold hover:bg-[#ff4d2d]/20'>
          My Orders
        </button>

        <div 
          className='w-[40px] h-[40px] rounded-full flex items-center justify-center bg-[#ff4d2d] text-white text-[18px] shadow-lg font-bold cursor-pointer' 
          onClick={() => setShowInfo(prev => !prev)}
        >
          {userData?.fullName ? userData.fullName.slice(0, 1).toUpperCase() : "?"}
        </div>

        {showInfo && (
          <div className='fixed top-[85px] right-[20px] md:right-[5%] lg:right-[15%] w-[200px] bg-white shadow-2xl rounded-xl p-[20px] flex flex-col gap-[15px] z-[9999] border border-gray-100'>
            <div className='border-b pb-2'>
              <p className='text-xs text-gray-400'>Account</p>
              <div className='text-[16px] font-bold text-gray-800 truncate'>
                {userData?.fullName || "Guest User"}
              </div>
            </div>
            <div className='md:hidden text-gray-700 font-medium cursor-pointer'>My Orders</div>
            <div className='text-[#ff4d2d] font-bold cursor-pointer' onClick={handleLogout}>
              Log Out
            </div>
          </div>
        )}
      </div> 
    </div> 
  );
}

export default Nav;