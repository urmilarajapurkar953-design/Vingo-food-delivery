import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaStore, FaArrowRight, FaShoppingBag } from 'react-icons/fa';

const OrderPlaced = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve the created orders array from the navigation state payload
  const createdOrders = location.state?.orders || [];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
        
        {/* Success Icon Animation Wrapper */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-green-50 rounded-full text-green-500 text-6xl animate-bounce">
            <FaCheckCircle />
          </div>
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2">
          Order Placed Successfully!
        </h1>
        <p className="text-sm text-gray-500 mb-8 px-4">
          Thank you for your purchase. Your payment went through and our partner kitchens have started preparing your food.
        </p>

        {/* Zomato-Style Split Order Status Monitor Card */}
        {createdOrders.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-4 text-left border border-gray-100 mb-8 space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <FaShoppingBag /> Consolidating Shipments ({createdOrders.length})
            </h2>
            
            {createdOrders.map((order, idx) => (
              <div 
                key={order._id || idx} 
                className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-500 text-xs">
                    <FaStore />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      Kitchen Ref: ...{String(order.shop || order._id).slice(-6)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Status: <span className="text-amber-500 font-medium">{order.status || 'Pending'}</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-gray-900">
                  ₹{order.totalAmount}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Control Directives */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/home')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
          >
            Go Back Home
          </button>
          
          <button
            onClick={() => navigate('/orders')} // Adjust this route path to match your tracking/history view page
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
          >
            <span>Track Live Deliveries</span>
            <FaArrowRight className="text-xs" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderPlaced;