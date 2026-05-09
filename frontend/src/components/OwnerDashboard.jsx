import React from 'react';
import Nav from './Nav'; 
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaUtensils, FaPen, FaPlus } from "react-icons/fa"; 
import OwnerItemCard from './OwnerItemCard';

function OwnerDashboard() {
  const { myShopData } = useSelector((state) => state.owner);
  const navigate = useNavigate();

  return (
    <div className='w-full min-h-screen bg-[#fff9f6] flex flex-col items-center pb-10'>
      <Nav />
      
      <div className="h-[20px]"></div>

      {!myShopData && (
        <div className='flex justify-center items-center p-4 sm:p-6 w-full mt-10'>
          <div className='w-full max-w-md bg-white shadow-lg rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex flex-col items-center text-center'>
              <FaUtensils className='text-[#ff4d2d] w-16 h-16 sm:w-20 sm:h-20 mb-4' />
              <h2 className='text-2xl font-bold text-gray-800 mb-2'>Add Your Restaurant</h2>
              <p className='text-gray-500 mb-6'>
                Join our food delivery platform and reach thousands of hungry customers every day.
              </p>
              <button 
                className='bg-[#ff4d2d] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#e64429] transition-colors w-full'
                onClick={() => navigate('/create-edit-shop')}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {myShopData && (
        <div className='w-full flex flex-col items-center gap-6 px-4 sm:px-6'>
          <h1 className='text-2xl sm:text-3xl text-gray-900 flex items-center gap-3 mt-2 text-center font-bold'>
            <FaUtensils className='text-[#ff4d2d] w-10 h-10' />
            Welcome to {myShopData.name}
          </h1>

          <div className='bg-white shadow-lg rounded-xl overflow-hidden border border-orange-100 hover:shadow-2xl transition-all duration-300 w-full max-w-3xl relative'>
            <div 
              className='absolute top-4 right-4 bg-[#ff4d2d] text-white p-2 rounded-full shadow-md hover:bg-orange-600 transition-colors cursor-pointer z-10'
              onClick={() => navigate("/create-edit-shop")}
            >
              <FaPen size={20} />
            </div>

            <img 
              src={myShopData.image} 
              alt={myShopData.name} 
              className='w-full h-48 sm:h-64 object-cover' 
            />

            <div className='p-4 sm:p-6'>
              <h1 className='text-xl sm:text-2xl font-bold text-gray-800 mb-2'>{myShopData.name}</h1>
              <p className='text-gray-500 text-sm'>{myShopData.city}, {myShopData.state}</p>
              <p className='text-gray-500 text-sm mb-4'>{myShopData.address}</p>
              <div className='h-[1px] bg-gray-100 w-full my-4'></div>
              <div className='flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-gray-400'>
                <span>Shop Status</span>
                <span className='text-green-500 font-bold'>Live</span>
              </div>
            </div>
          </div>

          <div className='w-full max-w-3xl mt-4'>
            <div className='flex justify-between items-center mb-6'>
                <h3 className="text-xl font-bold text-gray-800">Your Menu</h3>
                {myShopData?.items?.length > 0 && (
                    <button 
                        onClick={() => navigate("/add-item")}
                        className='flex items-center gap-2 bg-[#ff4d2d] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-orange-600 transition-all'
                    >
                        <FaPlus size={12}/> Add Item
                    </button>
                )}
            </div>

            {/* SAFE CHECK: IF ITEMS IS UNDEFINED OR EMPTY */}
            {(!myShopData.items || myShopData.items.length === 0) ? (
              <div className='w-full bg-white shadow-lg rounded-2xl p-8 border border-gray-100 text-center'>
                <FaUtensils className='text-[#ff4d2d] w-12 h-12 mb-4 mx-auto' />
                <h2 className='text-xl font-bold text-gray-800 mb-2'>Your menu is empty</h2>
                <p className='text-gray-600 mb-6'>Add delicious items to start receiving orders.</p>
                <button 
                  className='bg-[#ff4d2d] text-white px-8 py-2.5 rounded-full font-medium shadow-md hover:bg-orange-600'
                  onClick={() => navigate("/add-item")}
                >
                  Add Your First Item
                </button>
              </div>
            ) : (
              <div className='flex flex-col gap-4'>
                {myShopData.items.map((item, index) => (
                  /* FIX: ADDING UNIQUE KEY PROP */
                  <OwnerItemCard key={item._id || index} data={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;