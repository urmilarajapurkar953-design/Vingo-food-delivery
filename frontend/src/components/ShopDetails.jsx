import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { serverUrl } from '../App';
import { addToCart, decrementQuantity } from '../redux/user.Slice.js';
import { FaChevronLeft, FaStar, FaBiking, FaPlus, FaMinus, FaShoppingCart, FaUtensils } from 'react-icons/fa';

function ShopDetails() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [shop, setShop] = useState(null);
  const [shopItems, setShopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const { cartItem } = useSelector((state) => state.user || { cartItem: [] });

  const getItemQty = (itemId) => {
    const item = cartItem.find((i) => i._id === itemId);
    return item ? item.quantity : 0;
  };

  useEffect(() => {
    const fetchShopAndItems = async () => {
      setLoading(true);
      try {
        const shopRes = await axios.get(`${serverUrl}/api/v1/shops/all`);
        const currentShop = shopRes.data?.find(s => s._id === shopId);
        setShop(currentShop);

        const itemsRes = await axios.get(`${serverUrl}/api/item/city-items`);
        const filtered = Array.isArray(itemsRes.data) 
          ? itemsRes.data.filter(item => item.shop?._id === shopId || item.shop === shopId)
          : [];
        setShopItems(filtered);

      } catch (error) {
        console.error("Error loading shop layout view details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShopAndItems();
  }, [shopId]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#fff9f6] text-gray-500 italic">
        Loading restaurant menu menu details...
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#fff9f6] gap-4">
        <p className="text-gray-600 font-bold">Restaurant Profile could not be located.</p>
        <button onClick={() => navigate(-1)} className="bg-[#ff4d2d] text-white px-4 py-2 rounded-full">Go Back</button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#fff9f6] pb-20 px-4 pt-24 flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        
        <div className="w-full">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm font-bold text-[#ff4d2d] bg-white px-4 py-2 rounded-full shadow-md hover:bg-orange-50 transition-colors mb-6 cursor-pointer w-fit"
          >
            <FaChevronLeft /> Back to Dashboard
          </button>

          <div className="relative h-64 md:h-80 w-full rounded-3xl overflow-hidden shadow-xl">
            <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            
            <div className="absolute bottom-6 left-6 md:left-10 text-white flex flex-col gap-2">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">{shop.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm md:text-base font-semibold">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5">
                  <FaStar className="text-yellow-400" /> 4.2 Rating
                </span>
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5">
                  <FaBiking className="text-[#ff4d2d]" /> {shop.city} Delivery Hub
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <h2 className="text-gray-800 text-2xl font-black mb-6 flex items-center gap-2">
            <FaUtensils className="text-[#ff4d2d]" /> Full Restaurant Menu
          </h2>

          {shopItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {shopItems.map((item) => {
                const itemQty = getItemQty(item._id);
                
                return (
                  <div 
                    key={item._id} 
                    className="group bg-white rounded-3xl p-3 border border-transparent shadow-sm hover:shadow-xl hover:border-[#ff4d2d]/40 hover:-translate-y-1.5 transition-all duration-300"
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
                      <p className="text-xs text-gray-400 font-medium">Freshly Prepared</p>
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm font-black text-[#ff4d2d]">
                          ₹{item.price}
                        </span>
                        
                        <div className="flex items-center bg-[#ff4d2d] text-white rounded-2xl overflow-hidden shadow-sm">
                          <button 
                            onClick={() => dispatch(decrementQuantity(item._id))}
                            className="p-2 hover:bg-[#e64429] transition-colors cursor-pointer"
                          >
                            <FaMinus size={10} />
                          </button>
                          
                          <span className="px-1 font-bold text-xs min-w-[18px] text-center">
                            {itemQty}
                          </span>

                          <button 
                            onClick={() => dispatch(addToCart(item))}
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
              })}
            </div>
          ) : (
            <div className="w-full text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
              <p className="text-gray-400 font-medium">No menu items listed under this shop yet.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ShopDetails;
