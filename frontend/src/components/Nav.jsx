import React, { useState } from 'react';
import { FaLocationDot, FaPlus } from "react-icons/fa6";
import { IoIosSearch, IoIosClose } from 'react-icons/io';
import { FiShoppingCart } from 'react-icons/fi';
import { LuLayoutList } from "react-icons/lu"; 
import { useSelector, useDispatch } from 'react-redux'; 
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { setUserData } from '../redux/user.Slice'; 
import { serverUrl } from '../App'; 

// Import custom hook link
import { useSocket } from '../context/SocketContext';

function Nav() {
  const { userData, currentCity, currentAddress, cartItem } = useSelector((state) => state.user);
  const { myShopData } = useSelector((state) => state.owner);
  
  // Wire live navigation metrics counters
  const { ownerBadgeCount, userBadgeCount } = useSocket();
  
  const [showInfo, setShowInfo] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false); 
  
  const [searchParams] = useSearchParams();
  const searchVal = searchParams.get('search') || "";
  
  const dispatch = useDispatch(); 
  const navigate = useNavigate();

  // 🌟 UPDATED: Pushes live text entry string onto the standalone global search route setup layout
  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (value) {
      navigate(`/search?search=${encodeURIComponent(value)}`);
    } else {
      navigate('/');
    }
  };

  const totalCartItems = cartItem?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  // UPDATED LOGOUT HANDLER: Uses standard POST request layout with fallback safety net
  const handleLogout = async () => {
    try {
        await axios.post(`${serverUrl}/api/user/logout`, {}, { withCredentials: true });
        dispatch(setUserData(null));
        setShowInfo(false);
        navigate('/signin');
    } catch (error) {
        console.error("Logout failed, running fallback route cleanup:", error);
        // Fallback safety net guarantees frontend state resets cleanly regardless of server response
        dispatch(setUserData(null));
        setShowInfo(false);
        navigate('/signin');
    }
  };

  const isOwner = userData?.role === "owner";
  
  // DYNAMIC FILTER: Check if the logged-in user profile is a delivery boy
  const isDelivery = userData?.role?.toLowerCase() === "delivery" || userData?.role?.toLowerCase() === "deliveryboy";

  return (
    <div className='w-full h-[80px] flex items-center justify-between px-[15px] md:px-[40px] fixed top-0 z-[9999] bg-[#fff9f6] border-b border-gray-100'>
      
      {/* --- MOBILE SEARCH OVERLAY (Hidden for Owners and Delivery Boys) --- */}
      {!isOwner && !isDelivery && isMobileSearchOpen && (
        <div className='absolute inset-0 bg-[#fff9f6] z-[10000] flex items-center px-4'>
            <div className='flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 w-full shadow-md'>
                <IoIosSearch size={22} className='text-gray-400' />
                <input 
                  autoFocus 
                  type="text" 
                  value={searchVal}
                  onChange={handleSearchChange}
                  placeholder="Search for food..." 
                  className='bg-transparent outline-none w-full ml-2 text-gray-700' 
                />
                <IoIosClose size={28} className='text-gray-500 cursor-pointer' onClick={() => setIsMobileSearchOpen(false)} />
            </div>
        </div>
      )}

      {/* --- LEFT: LOGO & LOCATION --- */}
      <div className='flex items-center gap-4 md:gap-8'>
        <div className='flex items-center gap-2'>
          <h1 
            className='text-2xl md:text-3xl font-bold text-[#ff4d2d] cursor-pointer'
            onClick={() => navigate('/')}
          >
            Vingo
          </h1>
          
          {/* Conditional inline Rider badge matching design layout system */}
          {isDelivery && (
            <span className="text-[11px] font-bold bg-orange-100 text-[#ff4d2d] px-2 py-0.5 rounded shadow-sm select-none">
              Rider
            </span>
          )}
        </div>

        {/* Location layout details hidden for Owners and Delivery Boys */}
        {!isOwner && !isDelivery && (
          <div className='hidden lg:flex items-center gap-2 text-gray-600 border-l border-gray-300 pl-6 max-w-[200px]'>
            <FaLocationDot className='text-[#ff4d2d] shrink-0' size={18} />
            <div className='flex flex-col overflow-hidden'>
              <span className='font-bold text-sm text-gray-800 leading-none truncate'>{currentCity || "Detecting..."}</span>
              <span className='text-[10px] truncate'>{currentAddress || "Loading location..."}</span>
            </div>
          </div>
        )}
      </div>

      {/* --- MIDDLE: SEARCH (Hidden for Owners and Delivery Boys) --- */}
      {!isOwner && !isDelivery && (
        <div className='hidden md:flex items-center bg-white border border-gray-200 rounded-full px-5 py-3 w-full max-w-[450px] lg:max-w-[600px] shadow-sm'>
          <IoIosSearch size={24} className='text-gray-400 mr-2' />
          <input 
            type="text" 
            value={searchVal}
            onChange={handleSearchChange}
            placeholder="Search for food, restaurants or cuisines..." 
            className='bg-transparent outline-none w-full text-[15px] text-gray-700' 
          />
        </div>
      )}

      {/* --- RIGHT: ACTIONS & PROFILE --- */}
      <div className='flex items-center gap-4 md:gap-6'>
        
        {/* User Specific Actions (Hidden completely if user is a Delivery Boy) */}
        {!isOwner && !isDelivery && (
          <>
            <button 
              onClick={() => navigate('/my-orders')}
              className='relative hidden sm:flex items-center gap-2 text-gray-700 hover:text-[#ff4d2d] transition-all font-semibold text-sm group'
            >
              <div className='relative flex items-center gap-2'>
                <LuLayoutList size={20} className='group-hover:scale-110 transition-transform' />
                {userBadgeCount > 0 && (
                  <span className='absolute -top-2 -left-2 bg-[#ff4d2d] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-[#fff9f6] animate-pulse'>
                    {userBadgeCount}
                  </span>
                )}
              </div>
              <span>Track Orders</span>
            </button>

            <button className='md:hidden p-2 text-gray-600' onClick={() => setIsMobileSearchOpen(true)}>
              <IoIosSearch size={26} />
            </button>
            
            <div 
              className='relative cursor-pointer text-gray-700 hover:text-[#ff4d2d] transition-colors p-2'
              onClick={() => navigate('/cart')}
            >
              <FiShoppingCart size={24} />
              {totalCartItems > 0 && (
                <span className='absolute top-0 right-0 bg-[#ff4d2d] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white'>
                  {totalCartItems}
                </span>
              )}
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

                <button 
                  onClick={() => navigate('/dashboard/orders')}
                  className='relative flex items-center gap-2 text-gray-700 hover:text-[#ff4d2d] transition-all font-semibold text-sm group'
                >
                  <div className='relative'>
                    <LuLayoutList size={22} className='group-hover:scale-110 transition-transform' />
                    {ownerBadgeCount > 0 && (
                      <span className='absolute -top-2 -right-2 bg-[#ff4d2d] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-[#fff9f6] animate-bounce'>
                        {ownerBadgeCount}
                      </span>
                    )}
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
                
                {/* Track orders dropdown link layout option hidden automatically if Delivery Boy */}
                {!isOwner && !isDelivery && (
                  <button 
                    onClick={() => { navigate('/my-orders'); setShowInfo(false); }}
                    className='relative sm:hidden text-gray-700 font-bold text-sm text-left hover:bg-orange-50 p-2 rounded-lg transition-colors flex items-center justify-between w-full'
                  >
                    <span>Track Orders</span>
                    {userBadgeCount > 0 && (
                      <span className='bg-[#ff4d2d] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-2'>
                        {userBadgeCount}
                      </span>
                    )}
                  </button>
                )}
                
                {isOwner && myShopData && (
                  <button 
                    onClick={() => { navigate('/dashboard/orders'); setShowInfo(false); }}
                    className='relative sm:hidden text-gray-700 font-bold text-sm text-left hover:bg-orange-50 p-2 rounded-lg transition-colors flex items-center justify-between w-full'
                  >
                    <span>My Orders</span>
                    {ownerBadgeCount > 0 && (
                      <span className='bg-[#ff4d2d] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-2'>
                        {ownerBadgeCount}
                      </span>
                    )}
                  </button>
                )}

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