import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaArrowRight, FaMapMarkerAlt, FaStore, FaReceipt } from 'react-icons/fa';

const OrderPlaced = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const masterOrder = location.state?.orders?.[0];
  const shopOrdersList = masterOrder?.shopOrders || [];

  return (
    <div className="min-h-screen bg-[#fff9f6] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-xl shadow-orange-900/5 border border-orange-100/40 p-6 md:p-10 text-center relative overflow-hidden">
        
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 via-[#ff4d2d] to-red-500" />

        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 text-5xl mb-4 animate-pulse shadow-inner">
            <FaCheckCircle />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
            Order Confirmed!
          </h1>
          <p className="text-sm text-gray-500 max-w-sm">
            Your items are being prepared by the shops. Check your precise order summary below.
          </p>
        </div>

        {shopOrdersList.length > 0 && (
          <div className="text-left mb-8 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <FaStore className="text-[#ff4d2d]" /> Ordered From ({shopOrdersList.length} {shopOrdersList.length === 1 ? 'Shop' : 'Shops'})
              </h2>
              <span className="text-xs bg-orange-50 text-[#ff4d2d] font-bold px-2.5 py-1 rounded-full border border-orange-100/60">
                Split Items Sourcing
              </span>
            </div>
            
            {shopOrdersList.map((subOrder, idx) => {
              
              const exactShopName = subOrder.shop?.name || `Shop ID: ...${String(subOrder.shop?._id || subOrder.shop).slice(-6)}`;
              const shopImage = subOrder.shop?.image;

              return (
                <div 
                  key={subOrder._id || idx} 
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-orange-500/20 transition-all duration-300 overflow-hidden"
                >
                  <div className="p-4 flex gap-4 items-center bg-gradient-to-r from-gray-50/50 to-transparent">
                    {shopImage ? (
                      <img 
                        src={shopImage} 
                        alt={exactShopName} 
                        className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500">
                        <FaStore size={18} />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-extrabold text-gray-800 truncate">
                        {exactShopName}
                      </h3>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                          {masterOrder?.status || 'Processing'}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">
                          {subOrder.shopOrderItems?.length || 0} {subOrder.shopOrderItems?.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-gray-900 block">
                        ₹{subOrder.subTotal}
                      </span>
                    </div>
                  </div>

                 
                  {subOrder.shopOrderItems?.length > 0 && (
                    <div className="px-4 pb-3 pt-2 bg-gray-50/30 border-t border-gray-50/50 space-y-1.5">
                      {subOrder.shopOrderItems.map((orderItem, itemIdx) => {
                       
                        const exactItemName = orderItem.item?.name || `Item ID: ...${String(orderItem.item?._id || orderItem.item).slice(-6)}`;
                        
                        return (
                          <div key={orderItem._id || itemIdx} className="flex justify-between text-xs text-gray-600 font-medium">
                            <span className="truncate max-w-[75%]">
                              {exactItemName}
                              <span className="text-orange-500 font-bold ml-1.5">×{orderItem.quantity}</span>
                            </span>
                            <span className="text-gray-700 font-semibold">₹{orderItem.price * orderItem.quantity}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {masterOrder && (
          <div className="bg-gray-50/60 rounded-2xl p-4 border border-gray-100 text-left mb-8 text-xs space-y-2.5">
            <h4 className="font-bold text-gray-700 flex items-center gap-1.5 border-b border-gray-200/60 pb-1.5 mb-2">
              <FaReceipt className="text-gray-400" /> Delivery & Payment Receipt
            </h4>
            
            {masterOrder.deliveryAddress?.text && (
              <div className="flex gap-1.5 text-gray-600 mb-1.5">
                <FaMapMarkerAlt className="text-gray-400 mt-0.5 flex-shrink-0" size={12} />
                <span className="leading-relaxed">
                  Delivering to: <strong className="text-gray-800 font-bold">{masterOrder.deliveryAddress.text}</strong>
                </span>
              </div>
            )}
            
            <div className="flex justify-between text-gray-600 pt-1">
              <span>Payment Mode</span>
              <span className="font-extrabold text-gray-800 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">
                {masterOrder.paymentMethod || 'COD'}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-gray-200">
              <span className="text-sm font-extrabold text-gray-800">Total Bill Amount</span>
              <span className="text-lg font-black text-[#ff4d2d]">₹{masterOrder.totalAmount}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            onClick={() => navigate('/home')}
            className="w-full bg-[#ff4d2d] hover:bg-[#e64429] text-white py-4 rounded-2xl font-bold shadow-md shadow-orange-500/10 transition-all active:scale-[0.98] text-sm"
          >
            Order More Food
          </button>
          
          <button
            onClick={() => navigate('/my-orders')} 
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
          >
            <span>Track Delivery</span>
            <FaArrowRight className="text-xs text-gray-400" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderPlaced;
