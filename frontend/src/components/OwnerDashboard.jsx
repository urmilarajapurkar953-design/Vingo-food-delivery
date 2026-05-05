import React from 'react';
import Nav from './Nav'; // Ensure the path matches your project structure
import { useSelector } from 'react-redux';
import { FaUtensils } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

function OwnerDashboard() {
  const { myShopData } = useSelector((state) => state.owner);
  const navigate = useNavigate();

  return (
    <div className='w-full min-h-screen bg-[#fff9f6] flex flex-col items-center'>
      <Nav />
      
      {/* Spacer to push content below fixed Nav */}
      <div className="h-[100px]"></div>

      {/* Show this card ONLY if shop is not registered */}
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
                onClick={()=>navigate('/create-edit-shop')}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {/* You can add your registered shop items list here below */}
      {myShopData && (
        <div className="mt-10">
          <h2 className="text-xl font-bold">Welcome back, {myShopData.name}!</h2>
          {/* Your Shop Items Code Here */}
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;