import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaPhoneAlt, FaUser, FaStoreAlt, FaBox, FaMapMarkerAlt, FaMotorcycle } from 'react-icons/fa';
import OrderTrackingMap from '../components/OrderTrackingMap';
import { useSocket } from '../hooks/useSocket';

const OrderTrackingPage = () => {
  const { masterOrderId, subOrderId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTargetOrderDetails();

    if (!socket) return;

    // Real-time listener for live status and location streams
    socket.on('orderStatusUpdated', (data) => {
      if (data.subOrderId.toString() === subOrderId.toString()) {
        setOrderData(prev => ({
          ...prev,
          status: data.newStatus
        }));
      }
    });

    return () => {
      socket.off('orderStatusUpdated');
    };
  }, [socket, subOrderId]);

  const fetchTargetOrderDetails = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/orders/user-history', { withCredentials: true });
      if (res.data.success) {
        // Find the precise suborder mapping match
        const master = res.data.orders.find(o => o._id.toString() === masterOrderId.toString());
        const subOrder = master?.shopOrders.find(s => s._id.toString() === subOrderId.toString());
        
        if (subOrder) {
          setOrderData({
            ...subOrder,
            deliveryAddress: master.deliveryAddress,
            totalPaid: master.totalAmount,
            createdAt: master.createdAt
          });
        }
      }
    } catch (err) {
      console.error("Error pulling dedicated track layout details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 font-bold text-gray-500">Loading live radar stream...</div>;
  if (!orderData) return <div className="text-center py-20 text-gray-400">Tracking file could not be verified.</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 min-h-screen bg-gray-50 mt-[50px]">
      
      {/* Top Header Navigation bar */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <FaArrowLeft size={14} /> Back to My Orders
        </button>
        <div className="text-right">
          <span className="text-xs text-gray-400 font-mono block">Sub-Order ID: {subOrderId}</span>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            Live Streaming Mode
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Informational Sidebar panel column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Section A: Active Delivery Partner Card */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-xs font-black text-gray-400 tracking-wider uppercase mb-4 flex items-center gap-1.5">
              <FaMotorcycle className="text-orange-500" /> Delivery Agent Details
            </h2>
            {orderData.deliveryBoy ? (
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md shadow-orange-500/10">
                    {orderData.deliveryBoy.name?.charAt(0).toUpperCase() || <FaUser size={16} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-800">{orderData.deliveryBoy.name}</h4>
                    <p className="text-xs text-gray-400 font-medium">{orderData.deliveryBoy.phone || '+91 98765 43210'}</p>
                  </div>
                </div>
                <a 
                  href={`tel:${orderData.deliveryBoy.phone || '9876543210'}`}
                  className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  <FaPhoneAlt size={14} />
                </a>
              </div>
            ) : (
              <div className="text-center py-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-amber-700 text-xs font-bold animate-pulse">
                Waiting for rider to accept request...
              </div>
            )}
          </div>

          {/* Section B: Store & Merchant Metadata */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div>
              <h2 className="text-xs font-black text-gray-400 tracking-wider uppercase mb-3 flex items-center gap-1.5">
                <FaStoreAlt /> Pick up Location
              </h2>
              <h3 className="text-sm font-extrabold text-gray-800">{orderData.shop?.name || 'Partner Shop'}</h3>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">{orderData.shop?.address || 'Khari Talao, Bhayander East, Mira-Bhayander - 401107'}</p>
            </div>
            
            <hr className="border-gray-100" />

            <div>
              <h2 className="text-xs font-black text-gray-400 tracking-wider uppercase mb-3 flex items-center gap-1.5">
                <FaMapMarkerAlt /> Drop off Destination
              </h2>
              <p className="text-xs text-gray-700 font-bold leading-relaxed">{orderData.deliveryAddress?.text}</p>
            </div>
          </div>

          {/* Section C: Basket Summary */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-xs font-black text-gray-400 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <FaBox /> Items Package
            </h2>
            <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
              {orderData.shopOrderItems?.map((itemObj, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50/60 p-2.5 rounded-xl border border-gray-100/50">
                  <div className="flex items-center gap-2.5">
                    {itemObj.item?.image && (
                      <img src={itemObj.item.image} alt="" className="w-9 h-9 rounded-lg object-cover border" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-gray-800">{itemObj.item?.name || 'Menu Item'}</p>
                      <p className="text-[10px] text-gray-400">Qty: {itemObj.quantity}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-700">₹{itemObj.price * itemObj.quantity}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Live Interactive Navigation Route Radar Map box column */}
        <div className="lg:col-span-2 h-[500px] lg:h-auto min-h-[500px] bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
          <OrderTrackingMap 
            customerCoords={[
              orderData.deliveryAddress?.lat || 19.0820, 
              orderData.deliveryAddress?.lng || 72.8888
            ]} 
            initialRiderCoords={[19.0760, 72.8777]} 
          />
        </div>

      </div>
    </div>
  );
};

export default OrderTrackingPage;