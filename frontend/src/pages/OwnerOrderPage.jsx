import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaStore, FaUser, FaPhone, FaMapMarkerAlt, FaCheckCircle, FaReceipt } from 'react-icons/fa';

const OwnerOrderPage = () => {
  const [shopOrders, setShopOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerOrders();
  }, []);

  const fetchOwnerOrders = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/orders/owner-dashboard', { withCredentials: true });
      if (res.data.success) setShopOrders(res.data.orders);
    } catch (err) {
      console.error("Error sourcing metrics database:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (masterOrderId, subOrderId, currentTargetValue) => {
    try {
      const res = await axios.put('http://localhost:8000/api/orders/update-status', {
        masterOrderId,
        subOrderId,
        status: currentTargetValue
      }, { withCredentials: true });

      if (res.data.success) {
        // Optimistically update target dashboard array row instances
        setShopOrders((prev) =>
          prev.map((item) =>
            item.subOrderId === subOrderId ? { ...item, status: currentTargetValue } : item
          )
        );
      }
    } catch (err) {
      alert("Failed to update status changes securely.");
    }
  };

  if (loading) return <div className="text-center py-20 font-black text-gray-400">Loading Incoming Shop Orders...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 min-h-screen bg-neutral-50 font-sans">
      
      {/* Title Panel Banner */}
      <div className="flex items-center gap-3 mb-8 border-b pb-4 border-neutral-200">
        <div className="p-3 bg-[#ff4d2d] rounded-2xl text-white shadow-md shadow-orange-500/20">
          <FaStore size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-neutral-800 tracking-tight">My Kitchen Orders</h1>
          <p className="text-xs text-neutral-400 font-medium">Manage inbound requests and control processing stages live</p>
        </div>
      </div>

      {shopOrders.length === 0 ? (
        <div className="text-center bg-white p-16 rounded-[2rem] border border-neutral-200/60 text-neutral-400 font-bold shadow-sm">
          No items ordered from your shop location yet.
        </div>
      ) : (
        <div className="space-y-6">
          {shopOrders.map((order) => (
            <div 
              key={order.subOrderId} 
              className="bg-white rounded-3xl border border-neutral-200/70 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 relative overflow-hidden"
            >
              {/* Premium Top Line Accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-neutral-100" />

              {/* Customer Sourcing Block Identity Area */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-start border-b border-neutral-100 pb-4 mb-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-base font-black text-neutral-800">
                    <FaUser className="text-neutral-400" size={14} />
                    <h2>{order.customer?.name || "Anonymous Customer"}</h2>
                  </div>
                  <p className="text-xs text-neutral-400 font-medium">{order.customer?.email}</p>
                  {order.customer?.phone && (
                    <div className="flex items-center gap-1 text-xs text-neutral-500 pt-0.5">
                      <FaPhone size={10} className="text-neutral-400" /> <span>{order.customer.phone}</span>
                    </div>
                  )}
                </div>

                {/* Delivery Target Addresses Row block */}
                <div className="max-w-xs md:text-right space-y-1">
                  <div className="flex items-center md:justify-end gap-1 text-xs text-neutral-500 font-medium">
                    <FaMapMarkerAlt className="text-orange-500" size={12} />
                    <span className="truncate">{order.deliveryAddress?.text}</span>
                  </div>
                  <p className="text-[10px] font-mono text-neutral-400">
                    Lat: {order.deliveryAddress?.lat?.toFixed(4)}, Lon: {order.deliveryAddress?.lon?.toFixed(4)}
                  </p>
                </div>
              </div>

              {/* Center Ordered Items Image Badge Wrapper Grid (Matching Provided Reference Image Profile) */}
              <div className="flex flex-wrap gap-4 items-center mb-6">
                {order.items.map((itemGroup, idx) => {
                  const name = itemGroup.item?.name || "Menu Item";
                  const image = itemGroup.item?.image;
                  return (
                    <div 
                      key={idx} 
                      className="inline-flex flex-col items-center p-3 bg-neutral-50 rounded-2xl border border-neutral-200/50 text-center min-w-[120px] max-w-[140px]"
                    >
                      {image ? (
                        <img src={image} alt={name} className="w-16 h-16 rounded-xl object-cover shadow-sm border border-white" />
                      ) : (
                        <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center"><FaReceipt size={20}/></div>
                      )}
                      <span className="text-xs font-extrabold text-neutral-800 truncate w-full mt-2">{name}</span>
                      <span className="text-[10px] text-neutral-400 font-bold mt-0.5">
                        Qty: {itemGroup.quantity} <span className="text-neutral-300">×</span> ₹{itemGroup.price}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Foot Controls containing explicit payment modes and reactive dropdown pipeline selectors */}
              <div className="bg-neutral-50 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 border border-neutral-100">
                <div className="flex gap-4 items-center">
                  <div className="text-xs text-neutral-500">
                    Payment Method: <strong className="text-neutral-700 block uppercase text-[10px] tracking-wider">{order.paymentMethod || "COD"}</strong>
                  </div>
                  <div className="text-xs text-neutral-500 border-l pl-4 border-neutral-200">
                    Shop Subtotal: <strong className="text-base font-black text-neutral-800 block">₹{order.subTotal}</strong>
                  </div>
                </div>

                {/* Dropdown Pipeline State Selector Action Modals */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400">Order Stage Status:</label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.masterOrderId, order.subOrderId, e.target.value)}
                    className="bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-700 shadow-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
                  >
                    <option value="Pending">Pending ⏳</option>
                    <option value="Preparing">Preparing 🍳</option>
                    <option value="Out for Delivery">Out for Delivery 🛵</option>
                    <option value="Completed">Completed ✅</option>
                  </select>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerOrderPage;