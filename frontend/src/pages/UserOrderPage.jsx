import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaClock, FaUtensils, FaMapMarkerAlt, FaCheckCircle, FaPizzaSlice, FaTruck, FaStoreAlt, FaMap } from 'react-icons/fa';

import OrderTrackingMap from '../components/OrderTrackingMap';
// Pull Shared Named Hook from Hooks Folder
import { useSocket } from '../hooks/useSocket';

const UserOrderPage = ({ currentUser }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Track which master order card has its route map currently visible (Stored as a safe string)
  const [activeMapOrderId, setActiveMapOrderId] = useState(null);
  
  // Initialize Router context for redirection routing hooks
  const navigate = useNavigate();
  
  // Inject background pipeline hook instance
  const { socket } = useSocket();

  useEffect(() => {
    fetchUserOrders();

    if (!socket) return;

    socket.on('orderStatusUpdated', (data) => {
      console.log("⚡ Real-time stage status catch on user client:", data);
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          const hasSubOrder = order.shopOrders?.some(sub => sub._id.toString() === data.subOrderId.toString());
          
          if (order._id.toString() === data.masterOrderId.toString() || hasSubOrder) {
            const updatedShopOrders = order.shopOrders.map((shopOrder) => {
              if (shopOrder._id.toString() === data.subOrderId.toString()) {
                return { ...shopOrder, status: data.newStatus };
              }
              return shopOrder;
            });
            return { ...order, shopOrders: updatedShopOrders };
          }
          return order;
        })
      );
    });

    return () => {
      socket.off('orderStatusUpdated');
    };
  }, [socket]);

  const fetchUserOrders = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/orders/user-history', { withCredentials: true });
      if (res.data.success) setOrders(res.data.orders);
    } catch (err) {
      console.error("Error loading history records:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-amber-50 text-amber-700 border-amber-200',
      Preparing: 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse',
      Kitchen: 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse',
      'Driver Assigned': 'bg-blue-50 text-blue-700 border-blue-200',
      'Out for Delivery': 'bg-blue-50 text-blue-700 border-blue-200',
      'On Way': 'bg-blue-50 text-blue-700 border-blue-200',
      Completed: 'bg-green-50 text-green-700 border-green-200',
      Delivered: 'bg-green-50 text-green-700 border-green-200'
    };
    return `px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.Pending}`;
  };

  const renderTrackingTimeline = (currentStatus) => {
    const stages = [
      { key: ['Pending'], icon: FaClock, label: 'Placed' },
      { key: ['Preparing', 'Kitchen'], icon: FaPizzaSlice, label: 'Kitchen' },
      { key: ['Driver Assigned', 'Out for Delivery', 'On Way'], icon: FaTruck, label: 'On Way' },
      { key: ['Completed', 'Delivered'], icon: FaCheckCircle, label: 'Delivered' }
    ];

    // Check if the order route is finished
    const isFullyDelivered = ['Completed', 'Delivered'].includes(currentStatus);
    const currentIdx = stages.findIndex(s => s.key.includes(currentStatus));

    return (
      <div className="flex items-center justify-between max-w-xl mx-auto my-6 px-4">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          
          // If completely delivered, drop active line progress metrics to false
          const isDone = isFullyDelivered ? false : idx <= currentIdx;
          const isActive = isFullyDelivered ? false : idx === currentIdx;

          return (
            <div key={idx} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center relative">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    isFullyDelivered 
                      ? 'bg-neutral-50 border-neutral-200 text-neutral-400' 
                      : isDone 
                        ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20' 
                        : 'bg-white border-gray-200 text-gray-300'
                  } ${isActive ? 'ring-4 ring-orange-100 animate-bounce' : ''}`}
                >
                  <Icon size={14} className={isActive && (currentStatus === 'Preparing' || currentStatus === 'Kitchen') ? 'animate-spin-slow' : ''} />
                </div>
                <span className={`text-[10px] font-black mt-1.5 transition-colors duration-300 ${
                  isFullyDelivered 
                    ? 'text-neutral-400 font-medium' 
                    : isDone ? 'text-orange-600' : 'text-gray-400'
                }`}>
                  {stage.label}
                </span>
              </div>
              
              {idx < stages.length - 1 && (
                <div className="flex-1 h-1 mx-2 rounded-full bg-gray-100 overflow-hidden relative -mt-3">
                  <div 
                    className="absolute top-0 left-0 bottom-0 bg-orange-500 transition-all duration-700"
                    style={{ width: isDone && idx < currentIdx ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="text-center py-20 font-bold text-gray-500">Loading Order Records...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 min-h-screen bg-gray-50 mt-[80px]">
      <h1 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
        <FaClock className="text-orange-500" /> My Orders Tracking System
      </h1>

      {orders.length === 0 ? (
        <div className="text-center bg-white p-12 rounded-3xl shadow-sm border text-gray-400 font-medium">
          You haven't placed any orders yet.
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((masterOrder) => {
            const currentOrderIdStr = String(masterOrder._id);
            const isMapActive = activeMapOrderId === currentOrderIdStr;

            // 1. Check if any sub-order within this master block is currently in transit
            const trackableSubOrder = masterOrder.shopOrders?.find(sub => 
              ['Driver Assigned', 'Out for Delivery', 'On Way'].includes(sub.status)
            );

            // 2. Check if all items in this order are already finished/delivered
            const isEverythingDelivered = masterOrder.shopOrders?.every(sub => 
              ['Completed', 'Delivered'].includes(sub.status)
            );

            return (
              <div key={masterOrder._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                
                <div className="bg-gray-50/60 p-4 border-b border-gray-100 flex flex-wrap justify-between items-center text-xs text-gray-500 gap-2">
                  <div>
                    ID: <span className="font-mono text-gray-700">{masterOrder._id}</span>
                  </div>
                  <div className="font-semibold text-gray-700">
                    {new Date(masterOrder.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-5 space-y-8">
                  {masterOrder.shopOrders.map((shopOrder) => (
                    <div key={shopOrder._id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                      
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          {shopOrder.shop?.image ? (
                            <img src={shopOrder.shop.image} className="w-8 h-8 rounded-lg object-cover" alt="" />
                          ) : (
                            <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400"><FaStoreAlt size={14}/></div>
                          )}
                          <h3 className="text-sm font-extrabold text-gray-800">{shopOrder.shop?.name || 'Partner Shop'}</h3>
                        </div>
                        <span className={getStatusBadge(shopOrder.status)}>
                          {shopOrder.status || 'Pending'}
                        </span>
                      </div>

                      {renderTrackingTimeline(shopOrder.status || 'Pending')}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2 mt-4">
                        {shopOrder.shopOrderItems.map((itemObj, idx) => (
                          <div key={idx} className="flex gap-3 items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50">
                            {itemObj.item?.image ? (
                              <img src={itemObj.item.image} alt="" className="w-12 h-12 rounded-xl object-cover border" />
                            ) : (
                              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500"><FaUtensils size={14}/></div>
                            )}
                            <div>
                              <p className="text-xs font-bold text-gray-800">{itemObj.item?.name || 'Menu Item'}</p>
                              <p className="text-[11px] text-gray-400">Qty: <span className="text-gray-700 font-bold">{itemObj.quantity}</span> × ₹{itemObj.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Address and Actions Bar */}
                <div className="bg-gradient-to-r from-orange-50/20 to-transparent px-5 py-4 border-t border-gray-100 flex flex-col gap-4">
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="text-xs text-gray-500 flex items-center gap-1.5 max-w-sm truncate">
                      <FaMapMarkerAlt className="text-gray-400" />
                      <span>To: <strong>{masterOrder.deliveryAddress?.text}</strong></span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      
                      {/* CRITICAL ACTION: Only render map navigation button frames if the order is NOT completely delivered */}
                      {!isEverythingDelivered && (
                        <>
                          {trackableSubOrder ? (
                            <button 
                              onClick={() => navigate(`/order-tracking/${masterOrder._id}/${trackableSubOrder._id}`)}
                              className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-4 py-2 rounded-xl transition-all cursor-pointer select-none relative z-30 shadow-md shadow-orange-500/20 animate-pulse border-none"
                            >
                              <FaTruck size={12} className="animate-bounce" />
                              <span>Track Delivery Boy</span>
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveMapOrderId(isMapActive ? null : currentOrderIdStr);
                              }}
                              className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl border border-orange-200 transition-colors cursor-pointer select-none relative z-30"
                            >
                              <FaMap size={12} />
                              <span>{isMapActive ? "Close Map Route" : "Open Map Route Direction"}</span>
                            </button>
                          )}
                        </>
                      )}

                      <div className="text-sm text-gray-800 font-bold">
                        Total Paid: <span className="text-lg font-black text-[#ff4d2d]">₹{masterOrder.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fallback inline direction block helper if clicked, not dispatched, and not finished */}
                  {isMapActive && !trackableSubOrder && !isEverythingDelivered && (
                    <div className="mt-2 w-full min-h-[400px] h-[400px] block bg-white rounded-2xl border border-gray-100 overflow-hidden relative shadow-md">
                      <OrderTrackingMap 
                        customerCoords={[
                          masterOrder.deliveryAddress?.lat || 19.0820, 
                          masterOrder.deliveryAddress?.lng || 72.8888
                        ]} 
                        initialRiderCoords={[19.0760, 72.8777]} 
                      />
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserOrderPage;