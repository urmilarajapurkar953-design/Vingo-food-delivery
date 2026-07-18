import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaStore, FaUser, FaPhone, FaMapMarkerAlt, FaClock, FaReceipt, FaCircle, FaBell } from 'react-icons/fa';

import { useSocket } from '../context/SocketContext';

const OwnerOrderPage = ({ currentOwnerId }) => { 
  const [shopOrders, setShopOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLiveIndicator, setNewLiveIndicator] = useState(0); 
  
  const [localStatuses, setLocalStatuses] = useState({});
  const [isSavingMap, setIsSavingMap] = useState({});

  const { socket } = useSocket();

  useEffect(() => {
    fetchOwnerOrders();

    if (!socket) return;

    socket.off('newOrderReceived');

    socket.on('newOrderReceived', (incomingOrder) => {
      console.log("📨 Live Order received inside kitchen context:", incomingOrder);
      
      const rawPayment = 
        incomingOrder.paymentMethod || 
        incomingOrder.paymentMode || 
        "Online Payment";

      let cleanPaymentString = "Online Payment";
      if (rawPayment) {
        const normalized = String(rawPayment).toLowerCase();
        if (normalized.includes('cod') || normalized.includes('cash')) {
          cleanPaymentString = "Cash on Delivery";
        }
      }

      const mappedLiveOrder = {
        ...incomingOrder,
        paymentMethod: cleanPaymentString,
        paymentMode: cleanPaymentString
      };
      
      setNewLiveIndicator(prev => prev + 1);
      setShopOrders(prev => [mappedLiveOrder, ...prev]);
      
      setLocalStatuses(prev => ({ 
        ...prev, 
        [incomingOrder.subOrderId]: incomingOrder.status || "Pending" 
      }));
    });

    return () => {
      socket.off('newOrderReceived');
    };
  }, [socket]);

  const fetchOwnerOrders = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/orders/owner-dashboard', { withCredentials: true });
      if (res.data.success) {
        const formattedOrders = res.data.orders.map(order => {
          const rawMethod = order.paymentMethod || order.paymentMode || "Online Payment";
          const isCOD = String(rawMethod).toLowerCase().includes('cod') || String(rawMethod).toLowerCase().includes('cash');
          return {
            ...order,
            paymentMethod: isCOD ? "Cash on Delivery" : "Online Payment"
          };
        });

        setShopOrders(formattedOrders);
        
        const statusMap = {};
        formattedOrders.forEach(order => {
          statusMap[order.subOrderId] = order.status || "Pending";
        });
        setLocalStatuses(statusMap);
      }
    } catch (err) {
      console.error("Error sourcing metrics database:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDropdownSelection = (subOrderId, selectedValue) => {
    setLocalStatuses(prev => ({
      ...prev,
      [subOrderId]: selectedValue
    }));
  };

  const handleCommitStatusUpdate = async (masterOrderId, subOrderId) => {
    const targetStatus = localStatuses[subOrderId];
    setIsSavingMap(prev => ({ ...prev, [subOrderId]: true }));
    try {
      const res = await axios.put('http://localhost:8000/api/orders/update-status', {
        masterOrderId,
        subOrderId,
        status: targetStatus
      }, { withCredentials: true });

      if (res.data.success) {
        setShopOrders((prev) =>
          prev.map((item) =>
            item.subOrderId === subOrderId ? { ...item, status: targetStatus } : item
          )
        );

        // ⚡ REAL-TIME DISPATCH: Alert the driver network if status is 'Out for Delivery'
        if (targetStatus === 'Out for Delivery' && socket) {
          const contextualOrder = shopOrders.find(item => item.subOrderId === subOrderId);
          if (contextualOrder) {
            socket.emit('joinRoom', masterOrderId.toString()); 
            
            const rawPayment = contextualOrder.paymentMethod || contextualOrder.paymentMode || "Online Payment";
            const dynamicPaymentMethod = String(rawPayment).toLowerCase().includes("cod") || String(rawPayment).toLowerCase().includes("cash") ? "COD" : "Online";

            const dispatchJobPayload = {
              _id: subOrderId, 
              subOrderId: subOrderId,
              masterOrderId: masterOrderId,
              shopName: contextualOrder.shopName || contextualOrder.shop?.name || "Store Merchant",
              shopAddress: contextualOrder.shopAddress || contextualOrder.shop?.address || "Store Address",
              deliveryAddress: contextualOrder.deliveryAddress,
              subTotal: contextualOrder.subTotal || contextualOrder.orderValue || 0,
              paymentMethod: dynamicPaymentMethod,
              createdAt: new Date().toISOString()
            };

            socket.emit('shareRiderLocationUpdate', {
              assignmentId: "delivery_drivers_room",
              isGlobalBroadcastJob: true, 
              jobData: dispatchJobPayload
            });
            
            console.log("🛵 Sent real-time dispatch request alert payload downstream:", dispatchJobPayload);
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save status changes securely.");
    } finally {
      setIsSavingMap(prev => ({ ...prev, [subOrderId]: false }));
    }
  };

  const formatOrderTime = (timestampString) => {
    if (!timestampString) return "Just now";
    const dateObj = new Date(timestampString);
    return dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getBadgeStyle = (status) => {
    switch(status) {
      case 'Preparing': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Out for Delivery': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  if (loading) return <div className="text-center py-20 font-black text-gray-400">Loading Incoming Shop Orders...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 min-h-screen bg-neutral-50 font-sans mt-[80px]">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 border-neutral-200 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#ff4d2d] rounded-2xl text-white shadow-md shadow-orange-500/20">
            <FaStore size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-neutral-800 tracking-tight">My Kitchen Orders</h1>
            <p className="text-xs text-neutral-400 font-medium">Manage order tracks and update preparation status stages live</p>
          </div>
        </div>

        {newLiveIndicator > 0 && (
          <button 
            onClick={() => setNewLiveIndicator(0)}
            className="bg-red-500 text-white flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black animate-bounce shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
          >
            <FaBell className="animate-pulse" />
            <span>{newLiveIndicator} New Orders Received! Click to Clear</span>
          </button>
        )}
      </div>

      {shopOrders.length === 0 ? (
        <div className="text-center bg-white p-16 rounded-[2rem] border border-neutral-200/60 text-neutral-400 font-bold shadow-sm">
          No items ordered from your shop location yet.
        </div>
      ) : (
        <div className="space-y-6">
          {shopOrders.map((order) => {
            const currentChosenStatus = localStatuses[order.subOrderId] || order.status || 'Pending';
            const hasUnsavedChanges = currentChosenStatus !== order.status;
            const isCurrentlySaving = isSavingMap[order.subOrderId] || false;

            const orderSubTotal = Number(order.subTotal || 0);
            const displayTotal = orderSubTotal >= 500 ? orderSubTotal : orderSubTotal + 40;

            return (
              <div 
                key={order.subOrderId} 
                className={`bg-white rounded-3xl border transition-all duration-300 p-6 relative overflow-hidden ${
                  hasUnsavedChanges ? 'border-orange-300 ring-2 ring-orange-500/5 shadow-md' : 'border-neutral-200/70 shadow-sm'
                }`}
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-neutral-100" />

                <div className="flex flex-col md:flex-row md:justify-between md:items-start border-b border-neutral-100 pb-4 mb-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-base font-black text-neutral-800">
                      <FaUser className="text-neutral-400" size={14} />
                      <h2>{order.customer?.fullName || order.customer?.name || "Customer Account"}</h2>
                    </div>
                    <p className="text-xs text-neutral-400 font-medium">{order.customer?.email}</p>
                    {order.customer?.phone && (
                      <div className="flex items-center gap-1 text-xs text-neutral-500 pt-0.5">
                        <FaPhone size={10} className="text-neutral-400" /> <span>{order.customer.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="max-w-xs md:text-right space-y-1.5">
                    <div className="flex items-center md:justify-end gap-1 text-xs text-neutral-600 font-bold">
                      <FaMapMarkerAlt className="text-orange-500 shrink-0" size={12} />
                      <span className="truncate">{order.deliveryAddress?.text}</span>
                    </div>
                    <div className="flex items-center md:justify-end gap-1 text-[11px] font-semibold text-neutral-400">
                      <FaClock size={11} className="text-neutral-300" />
                      <span>Ordered: {formatOrderTime(order.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center mb-6">
                  {order.items && order.items.map((itemGroup, idx) => {
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

                <div className="bg-neutral-50 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 border border-neutral-100">
                  <div className="flex gap-4 items-center flex-wrap">
                    <div className="text-xs text-neutral-500">
                      Payment Method: 
                      <strong className="text-neutral-700 block uppercase text-[10px] tracking-wider mt-0.5">
                        {order.paymentMethod}
                      </strong>
                    </div>
                    
                    <div className="text-xs text-neutral-500 border-l pl-4 border-neutral-200">
                      Total Amount: 
                      <strong className="text-base font-black text-neutral-800 block">
                        ₹{displayTotal}
                      </strong>
                      {orderSubTotal >= 500 && (
                        <span className="text-[9px] text-emerald-600 font-bold block tracking-wide">
                          🎉 FREE DELIVERY APPLIED
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-neutral-500 border-l pl-4 border-neutral-200 flex items-center gap-2">
                      <span>Current Status:</span> 
                      <span className={`px-3 py-1 font-extrabold rounded-full text-[11px] border flex items-center gap-1.5 ${getBadgeStyle(order.status)}`}>
                        <FaCircle size={6} className={order.status === 'Preparing' ? 'animate-pulse' : ''} />
                        {order.status || 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-auto sm:ml-0">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400">Change To:</label>
                      <select
                        value={currentChosenStatus}
                        onChange={(e) => handleDropdownSelection(order.subOrderId, e.target.value)}
                        className="bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-700 shadow-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
                      >
                        <option value="Pending">Pending ⏳</option>
                        <option value="Preparing">Preparing 🍳</option>
                        <option value="Out for Delivery">Out for Delivery 🛵</option>
                      </select>
                    </div>

                    <button
                      disabled={!hasUnsavedChanges || isCurrentlySaving}
                      onClick={() => handleCommitStatusUpdate(order.masterOrderId, order.subOrderId)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        hasUnsavedChanges 
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10 hover:bg-orange-600 active:scale-95 cursor-pointer' 
                          : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      }`}
                    >
                      {isCurrentlySaving ? "Saving..." : "Update Stage"}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OwnerOrderPage;
