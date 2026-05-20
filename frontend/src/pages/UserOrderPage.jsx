import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { FaClock, FaCheckCircle, FaTruck, FaUtensils, FaMapMarkerAlt } from 'react-icons/fa';

const UserOrderPage = ({ currentUser }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserOrders();

    // Establish WebSocket listener directly linked to client account Context Room
    if (!currentUser?._id) return;
    const socket = io('http://localhost:8000');
    socket.emit('joinUserRoom', currentUser._id);

    socket.on('orderStatusUpdated', (data) => {
      // Functional state updating loops update specific sub-order target values cleanly
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order._id === data.masterOrderId) {
            const updatedShopOrders = order.shopOrders.map((shopOrder) => {
              if (shopOrder._id === data.subOrderId) {
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

    return () => socket.disconnect();
  }, [currentUser]);

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
      'Out for Delivery': 'bg-blue-50 text-blue-700 border-blue-200',
      Completed: 'bg-green-50 text-green-700 border-green-200'
    };
    return `px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.Pending}`;
  };

  if (loading) return <div className="text-center py-20 font-bold text-gray-500">Loading Order Records...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
        <FaClock className="text-orange-500" /> My Orders Tracking System
      </h1>

      {orders.length === 0 ? (
        <div className="text-center bg-white p-12 rounded-3xl shadow-sm border text-gray-400 font-medium">
          You haven't placed any orders yet.
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((masterOrder) => (
            <div key={masterOrder._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Card Meta Header */}
              <div className="bg-gray-50/60 p-4 border-b border-gray-100 flex flex-wrap justify-between items-center text-xs text-gray-500 gap-2">
                <div>
                  ID: <span className="font-mono text-gray-700">{masterOrder._id}</span>
                </div>
                <div className="font-semibold text-gray-700">
                  {new Date(masterOrder.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Loop Split Shop Segments Separately */}
              <div className="p-5 space-y-6">
                {masterOrder.shopOrders.map((shopOrder) => (
                  <div key={shopOrder._id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        {shopOrder.shop?.image && (
                          <img src={shopOrder.shop.image} className="w-8 h-8 rounded-lg object-cover" alt="" />
                        )}
                        <h3 className="text-sm font-extrabold text-gray-800">{shopOrder.shop?.name || 'Partner Shop'}</h3>
                      </div>
                      <span className={getStatusBadge(shopOrder.status)}>
                        {shopOrder.status || 'Pending'}
                      </span>
                    </div>

                    {/* Shop Unique Ordered Grid System Items layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
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

              {/* Card Summary Line */}
              <div className="bg-gradient-to-r from-orange-50/20 to-transparent px-5 py-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-3">
                <div className="text-xs text-gray-500 flex items-center gap-1.5 max-w-sm truncate">
                  <FaMapMarkerAlt className="text-gray-400" />
                  <span>To: <strong>{masterOrder.deliveryAddress?.text}</strong></span>
                </div>
                <div className="text-sm text-gray-800 font-bold">
                  Total Paid: <span className="text-lg font-black text-[#ff4d2d]">₹{masterOrder.totalAmount}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrderPage;