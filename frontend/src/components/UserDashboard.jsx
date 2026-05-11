import React, { useRef, useState, useEffect } from 'react'
import CategoryCard from './CategoryCard.jsx'
import { categories } from '../category.js'
import { FaChevronLeft, FaChevronRight, FaStar, FaBiking } from 'react-icons/fa' 
import axios from 'axios'
import { useSelector } from 'react-redux' // Added to get user data
import { serverUrl } from '../App.jsx'

function UserDashboard() {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [allShops, setAllShops] = useState([]);

  // Get the city from your Redux state (matches your userSlice)
  const { userData } = useSelector((state) => state.user || {});
  const userCity = userData?.city || "your area";

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get(`${serverUrl}/api/v1/shops/all`); 
        const data = Array.isArray(response.data) ? response.data : [];
        setAllShops(data);
      } catch (error) {
        console.error("Error fetching shops:", error);
        setAllShops([]); 
      }
    };
    fetchShops();
  }, []);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const currentRef = scrollRef.current;
    if (currentRef) {
      checkScroll();
      currentRef.addEventListener('scroll', checkScroll);
    }
    return () => currentRef?.removeEventListener('scroll', checkScroll);
  }, []);

  const scroll = (direction) => {
    const { current } = scrollRef;
    const scrollAmount = window.innerWidth < 768 ? 250 : 450;
    if (direction === 'left') {
      current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className='w-full flex flex-col gap-8 items-center bg-[#fff9f6] pb-20 px-4'>
      
      {/* --- CATEGORY SLIDER --- */}
      <div className="w-full max-w-6xl flex flex-col gap-5 items-start mt-8">
        <h1 className='text-gray-800 text-2xl sm:text-3xl font-bold px-2'>
          Inspiration for your first order
        </h1>

        <div className='w-full relative group'>
          {showLeft && (
            <button 
              onClick={() => scroll('left')} 
              className='absolute left-1 md:left-[-20px] top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-white shadow-xl border border-gray-100 text-[#ff4d2d] hover:bg-[#ff4d2d] hover:text-white transition-all active:scale-90 flex items-center justify-center'
            >
              <FaChevronLeft size={18} />
            </button>
          )}

          <div 
            ref={scrollRef} 
            className='w-full flex overflow-x-auto gap-4 md:gap-6 py-4 no-scrollbar scroll-smooth'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories?.map((cate, index) => (
              <CategoryCard data={cate} key={index} />
            ))}
          </div>

          {showRight && (
            <button 
              onClick={() => scroll('right')} 
              className='absolute right-1 md:right-[-20px] top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-white shadow-xl border border-gray-100 text-[#ff4d2d] hover:bg-[#ff4d2d] hover:text-white transition-all active:scale-90 flex items-center justify-center'
            >
              <FaChevronRight size={18} />
            </button>
          )}
        </div>
      </div>

      <div className='w-full max-w-6xl h-[1px] bg-gray-200 mt-4'></div>

      {/* --- SHOPS GRID --- */}
      <div className="w-full max-w-6xl flex flex-col gap-6 items-start mt-4">
        {/* Dynamic Title using User's City */}
        <h1 className='text-gray-800 text-2xl sm:text-3xl font-bold px-2 capitalize'>
          Best shops in {userCity}
        </h1>

        <div className='w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
          {allShops.length > 0 ? (
            allShops.map((shop) => (
              <div key={shop?._id} className='group cursor-pointer transform transition-transform duration-300 hover:scale-[0.98]'>
                <div className='relative w-full h-52 md:h-60 rounded-3xl overflow-hidden shadow-md group-hover:shadow-2xl transition-all'>
                  <img 
                    src={shop?.image} 
                    alt={shop?.name} 
                    className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700' 
                  />
                  {/* Updated Rating Overlay (removed time) */}
                  <div className='absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-sm font-bold text-gray-800 shadow-lg'>
                    <FaStar className='text-green-600' /> 4.2
                  </div>
                </div>
                
                <div className='mt-4 px-2'>
                  <h3 className='text-xl font-extrabold text-gray-800 truncate'>{shop?.name}</h3>
                  <div className='flex items-center gap-2 text-gray-500 font-medium text-sm mt-1'>
                    <FaBiking className='text-[#ff4d2d]' />
                    <p className='truncate'>{shop?.address}, {shop?.city}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className='col-span-full py-20 flex flex-col items-center justify-center text-gray-400 gap-4'>
              <div className='w-16 h-16 border-4 border-t-[#ff4d2d] border-gray-200 rounded-full animate-spin'></div>
              <p className='text-lg font-medium'>Finding the best shops for you...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserDashboard