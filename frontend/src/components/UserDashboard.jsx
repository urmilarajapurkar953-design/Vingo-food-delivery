import React, { useRef, useState, useEffect } from 'react';
import CategoryCard from './CategoryCard.jsx';
import { categories } from '../category.js';
import { FaChevronLeft, FaChevronRight, FaStar, FaBiking, FaStoreSlash, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { serverUrl } from '../App.jsx';

function UserDashboard() {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [allShops, setAllShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  const { currentCity } = useSelector((state) => state.user || {});

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 5);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 5);
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
    const amount = window.innerWidth < 768 ? 250 : 450;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  // FETCH SHOPS
  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${serverUrl}/api/v1/shops/all?city=${currentCity || ""}`);
        setAllShops(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Shop Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, [currentCity]);

  // FETCH SUGGESTED ITEMS
  useEffect(() => {
    const fetchItems = async () => {
      setItemsLoading(true);
      try {
        const response = await axios.get(`${serverUrl}/api/item/city-items?city=${currentCity || ""}`);
        setSuggestedItems(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Items Fetch Error:", error);
      } finally {
        setItemsLoading(false);
      }
    };
    fetchItems();
  }, [currentCity]);

  return (
    <div className='w-full flex flex-col gap-8 items-center bg-[#fff9f6] pb-20 px-4'>
      
      {/* CATEGORY SLIDER */}
      <div className="w-full max-w-6xl mt-8">
        <h1 className='text-gray-800 text-2xl font-bold mb-5'>Inspiration for your first order</h1>
        <div className='relative group'>
          {showLeft && (
            <button onClick={() => scroll('left')} className='absolute left-[-15px] top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white shadow-xl text-[#ff4d2d]'><FaChevronLeft /></button>
          )}
          <div ref={scrollRef} className='flex overflow-x-auto gap-4 py-4 no-scrollbar scroll-smooth'>
            {categories?.map((cate, i) => <CategoryCard data={cate} key={i} />)}
          </div>
          {showRight && (
            <button onClick={() => scroll('right')} className='absolute right-[-15px] top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white shadow-xl text-[#ff4d2d]'><FaChevronRight /></button>
          )}
        </div>
      </div>

      {/* SHOPS GRID */}
      <div className="w-full max-w-6xl">
        <h1 className='text-gray-800 text-2xl font-bold mb-6 capitalize'>
          {currentCity ? `Best shops in ${currentCity}` : "Best shops near you"}
        </h1>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
          {loading ? (
            <p className="col-span-full text-center py-10">Loading shops...</p>
          ) : allShops.length > 0 ? (
            allShops.map((shop) => (
              <div key={shop._id} className='group cursor-pointer'>
                <div className='relative h-52 md:h-60 rounded-3xl overflow-hidden shadow-md'>
                  <img src={shop.image} alt={shop.name} className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700' />
                  <div className='absolute bottom-3 left-3 bg-white/90 px-3 py-1 rounded-full flex items-center gap-1 text-sm font-bold'><FaStar className='text-green-600' /> 4.2</div>
                </div>
                <div className='mt-4'>
                  <h3 className='text-xl font-extrabold text-gray-800'>{shop.name}</h3>
                  <p className='text-gray-500 text-sm flex items-center gap-2 mt-1'><FaBiking className='text-[#ff4d2d]' /> {shop.city}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10"><FaStoreSlash className="mx-auto mb-2" size={40}/> No shops found.</div>
          )}
        </div>
      </div>

      {/* SUGGESTED ITEMS GRID */}
      <div className="w-full max-w-6xl">
  <h1 className='text-gray-800 text-2xl font-bold mb-6'>Suggested items</h1>
  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
    {itemsLoading ? (
      <p className="col-span-full text-center py-10">Loading items...</p>
    ) : suggestedItems.length > 0 ? (
      suggestedItems.map((item) => (
        <div key={item._id} className="bg-white rounded-3xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-gray-50">
            {/* item.image points to the item DB field. 
                If you see a shop here, the URL in your DB is wrong! */}
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
            />
            <div className="absolute top-2 right-2 bg-white/90 px-3 py-1 rounded-full text-xs font-black text-[#ff4d2d]">
              ₹{item.price}
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-extrabold text-gray-800 truncate uppercase text-sm tracking-tight">{item.name}</h3>
            {/* item.shop.name comes from the .populate("shop") in backend */}
            <p className="text-xs text-gray-400 font-medium truncate">{item.shop?.name || "Local Shop"}</p>
            
            <div className="flex justify-between items-center mt-4">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                item.foodType?.toLowerCase() === 'veg' 
                ? 'bg-green-50 text-green-600' 
                : 'bg-red-50 text-red-600'
              }`}>
                {item.foodType}
              </span>
              <button className="bg-[#ff4d2d] text-white p-2 rounded-xl hover:bg-orange-600 transition-colors">
                <FaPlus size={14} />
              </button>
            </div>
          </div>
        </div>
      ))
    ) : (
      <p className="col-span-full text-center text-gray-500 py-10">No suggested items found.</p>
    )}
  </div>
</div>
    </div>
  );
}

export default UserDashboard;