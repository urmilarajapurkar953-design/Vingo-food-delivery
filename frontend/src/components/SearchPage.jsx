import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { FaArrowLeft, FaPlus, FaMinus, FaShoppingCart } from 'react-icons/fa';
import { serverUrl } from '../App';
import { addToCart, decrementQuantity } from '../redux/user.Slice.js';

function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const searchQuery = searchParams.get('search')?.toLowerCase().trim() || "";
  const { currentCity, cartItem } = useSelector((state) => state.user || { cartItem: [] });

  const [suggestedItems, setSuggestedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const getItemQty = (itemId) => {
    const item = cartItem.find((i) => i._id === itemId);
    return item ? item.quantity : 0;
  };

  // Fetch items based on city area location context
  useEffect(() => {
    const fetchItems = async () => {
      if (!currentCity) return;
      setLoading(true);
      try {
        const response = await axios.get(`${serverUrl}/api/item/city-items`, {
          params: { city: currentCity }
        });
        setSuggestedItems(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Search Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [currentCity]);

  // Client-side filtering matching search terms natively
  const filteredItems = suggestedItems.filter(item => 
    item.name?.toLowerCase().includes(searchQuery) || 
    item.category?.toLowerCase().includes(searchQuery) ||
    item.shop?.name?.toLowerCase().includes(searchQuery)
  );

  return (
    <div className='w-full min-h-screen bg-[#fff9f6] pt-24 px-4 pb-20 flex flex-col items-center'>
      <div className="w-full max-w-6xl">
        
        {/* BACK NAVIGATION BAR */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/')} 
            className="p-3 bg-white hover:bg-orange-50 text-[#ff4d2d] rounded-full shadow-md transition-all active:scale-95"
          >
            <FaArrowLeft size={18} />
          </button>
          <div>
            <h1 className='text-gray-800 text-2xl font-black'>
              Search results for "{searchQuery}"
            </h1>
            <p className='text-xs text-gray-500 font-semibold mt-0.5'>
              Showing matches in {currentCity || "your area"}
            </p>
          </div>
        </div>

        {/* RESULTS GRID */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {loading ? (
            <p className="col-span-full text-center py-12 italic text-gray-400">Searching menus...</p>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const itemQty = getItemQty(item._id);
              
              return (
                <div 
                  key={item._id} 
                  className="group bg-white rounded-3xl p-3 border border-transparent shadow-sm hover:shadow-xl hover:border-[#ff4d2d]/40 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold shadow-sm ${item.foodType === 'veg' ? 'bg-green-50/90 text-green-600' : 'bg-red-50/90 text-red-600'}`}>
                      {item.foodType}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-extrabold text-gray-800 truncate group-hover:text-[#ff4d2d] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">{item.shop?.name || "Partner Shop"}</p>
                    
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm font-black text-[#ff4d2d]">
                        ₹{item.price}
                      </span>
                      
                      <div className="flex items-center bg-[#ff4d2d] text-white rounded-2xl overflow-hidden shadow-sm">
                        <button 
                          onClick={(e) => { e.stopPropagation(); dispatch(decrementQuantity(item._id)); }}
                          className="p-2 hover:bg-[#e64429] transition-colors cursor-pointer"
                        >
                          <FaMinus size={10} />
                        </button>
                        
                        <span className="px-1 font-bold text-xs min-w-[18px] text-center">
                          {itemQty}
                        </span>

                        <button 
                          onClick={(e) => { e.stopPropagation(); dispatch(addToCart(item)); }}
                          className="p-2 border-r border-white/20 hover:bg-[#e64429] transition-colors cursor-pointer"
                        >
                          <FaPlus size={10} />
                        </button>

                        <div className="p-2 bg-[#ff4d2d]">
                          <FaShoppingCart size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="col-span-full text-center py-20 text-gray-400 font-medium">
              We couldn't find any items matching "{searchQuery}". Try searching for something else!
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

export default SearchPage;