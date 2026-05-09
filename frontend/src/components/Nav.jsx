import React, { useState } from 'react';
import { FaLocationDot, FaPlus } from "react-icons/fa6";
import { IoIosSearch, IoIosClose } from 'react-icons/io';
import { FiShoppingCart } from 'react-icons/fi';
import { LuLayoutList } from "react-icons/lu"; 
import { useSelector, useDispatch } from 'react-redux'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setUserData } from '../redux/user.slice'; 
import { serverUrl } from '../App'; 

function Nav() {
  const { userData, currentCity, currentAddress } = useSelector((state) => state.user);
  const { myShopData } = useSelector((state) => state.owner);
  
  const [showInfo, setShowInfo] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false); 
  
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

  const isOwner = userData?.role === "owner";

  return (
    <div className='w-full h-[80px] flex items-center justify-between px-[15px] md:px-[40px] fixed top-0 z-[9999] bg-[#fff9f6] border-b border-gray-100'>
      
      {/* --- MOBILE SEARCH OVERLAY (Users Only) --- */}
      {!isOwner && isMobileSearchOpen && (
        <div className='absolute inset-0 bg-[#fff9f6] z-[10000] flex items-center px-4'>
            <div className='flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 w-full shadow-md'>
                <IoIosSearch size={22} className='text-gray-400' />
                <input autoFocus type="text" placeholder="Search for food..." className='bg-transparent outline-none w-full ml-2 text-gray-700' />
                <IoIosClose size={28} className='text-gray-500 cursor-pointer' onClick={() => setIsMobileSearchOpen(false)} />
            </div>
        </div>
      )}

      {/* --- LEFT: LOGO & LOCATION --- */}
      <div className='flex items-center gap-4 md:gap-8'>
        <h1 
          className='text-2xl md:text-3xl font-bold text-[#ff4d2d] cursor-pointer'
          onClick={() => navigate('/')}
        >
          Vingo
        </h1>

        {!isOwner && (
          <div className='hidden lg:flex items-center gap-2 text-gray-600 border-l border-gray-300 pl-6 max-w-[200px]'>
            <FaLocationDot className='text-[#ff4d2d] shrink-0' size={18} />
            <div className='flex flex-col overflow-hidden'>
              <span className='font-bold text-sm text-gray-800 leading-none truncate'>{currentCity || "Detecting..."}</span>
              <span className='text-[10px] truncate'>{currentAddress || "Loading location..."}</span>
            </div>
          </div>
        )}
      </div>

      {/* --- MIDDLE: SEARCH (Hidden for Owners) --- */}
      {!isOwner && (
        <div className='hidden md:flex items-center bg-white border border-gray-200 rounded-full px-5 py-3 w-full max-w-[450px] lg:max-w-[600px] shadow-sm'>
          <IoIosSearch size={24} className='text-gray-400 mr-2' />
          <input type="text" placeholder="Search for food, restaurants or cuisines..." className='bg-transparent outline-none w-full text-[15px] text-gray-700' />
        </div>
      )}

      {/* --- RIGHT: ACTIONS & PROFILE --- */}
      <div className='flex items-center gap-4 md:gap-6'>
        
        {/* User Specific Actions */}
        {!isOwner && (
          <>
            <button className='md:hidden p-2 text-gray-600' onClick={() => setIsMobileSearchOpen(true)}>
              <IoIosSearch size={26} />
            </button>
            <div className='relative cursor-pointer text-gray-700 hover:text-[#ff4d2d] transition-colors'>
              <FiShoppingCart size={24} />
              <span className='absolute -top-2 -right-2 bg-[#ff4d2d] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold'>0</span>
            </div>
          </>
        )}

        {/* Owner Specific Actions */}
        {isOwner && (
          <div className='flex items-center gap-5 md:gap-8'>
            {myShopData && (
              <>
                <button 
                  onClick={() => navigate('/add-item')}
                  className='flex items-center gap-2 text-gray-700 hover:text-[#ff4d2d] transition-all font-semibold text-sm group'
                >
                  <FaPlus size={18} className='group-hover:scale-110 transition-transform' />
                  <span className='hidden sm:inline'>Add Item</span>
                </button>

                <button className='relative flex items-center gap-2 text-gray-700 hover:text-[#ff4d2d] transition-all font-semibold text-sm group'>
                  <div className='relative'>
                    <LuLayoutList size={22} className='group-hover:scale-110 transition-transform' />
                    {/* Dynamic Order Notification Badge */}
                    <span className='absolute -top-2 -right-2 bg-[#ff4d2d] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-[#fff9f6]'>
                        0
                    </span>
                  </div>
                  <span className='hidden sm:inline'>My Orders</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Profile Avatar */}
        <div className='relative ml-2'>
          <div 
            className='w-[38px] h-[38px] md:w-[45px] md:h-[45px] rounded-full flex items-center justify-center bg-[#ff4d2d] text-white text-[18px] shadow-lg font-bold cursor-pointer hover:scale-105 transition-transform border-2 border-white' 
            onClick={() => setShowInfo(!showInfo)}
          >
            {userData?.fullName?.charAt(0).toUpperCase() || "U"}
          </div>

          {showInfo && (
            <div className='absolute top-[55px] right-0 w-[200px] bg-white shadow-2xl rounded-xl p-4 flex flex-col gap-3 z-[9999] border border-gray-100'>
                <div className='flex flex-col'>
                  <span className='text-gray-400 text-[10px] uppercase font-bold tracking-wider'>Logged in as</span>
                  <span className='text-gray-800 font-bold text-sm truncate'>{userData?.fullName}</span>
                </div>
                <div className='h-[1px] bg-gray-100 w-full'></div>
                <button 
                  className='text-[#ff4d2d] font-bold text-sm text-left hover:bg-orange-50 p-2 rounded-lg transition-colors' 
                  onClick={handleLogout}
                >
                  Log Out
                </button>
            </div>
          )}
        </div>
      </div> 
    </div> 
  );
}

export default Nav;