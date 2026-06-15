import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { serverUrl } from '../App';
import { FaCalendarAlt, FaMoneyBillWave, FaCreditCard, FaStore, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { MdDoneAll } from 'react-icons/md';

const DeliveryHistory = () => {
  const [historyGroups, setHistoryGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalDeliveries, setTotalDeliveries] = useState(0);

useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/orders/rider-history`, { withCredentials: true });
        if (res.data.success) {
          const deliveriesCount = res.data.history.length;
          setTotalDeliveries(deliveriesCount);
          setTotalEarnings(deliveriesCount * 80);
          groupDataByDate(res.data.history);
        }
      } catch (err) {
        console.error("Failed to load historical rider logs:", err);
      } finally {
        // ✅ CHANGE THIS LINE FROM loading(false) TO setLoading(false)
        setLoading(false); 
      }
    };
    fetchHistory();
  }, []);
  const groupDataByDate = (data) => {
    const groups = {};
    
    // Get calendar markers for Today and Yesterday
    const todayStr = new Date().toLocaleDateString('en-IN');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-IN');

    data.forEach(order => {
      const orderDateObj = new Date(order.completedAt);
      const orderDateStr = orderDateObj.toLocaleDateString('en-IN');
      
      let bucketLabel = orderDateStr;
      if (orderDateStr === todayStr) {
        bucketLabel = "Today";
      } else if (orderDateStr === yesterdayStr) {
        bucketLabel = "Yesterday";
      }

      if (!groups[bucketLabel]) {
        groups[bucketLabel] = {
          label: bucketLabel,
          dateKey: orderDateStr,
          orders: [],
          dailyEarnings: 0 // Will accumulate ₹80 per order in this bucket
        };
      }
      
      groups[bucketLabel].orders.push(order);
      // 💰 Increment daily payout by ₹80 for this order assignment
      groups[bucketLabel].dailyEarnings += 80;
    });

    setHistoryGroups(groups);
  };

  if (loading) {
    return <div className="text-center py-24 font-bold text-gray-400">Loading Delivery History logs...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 min-h-screen bg-gray-50 mt-[80px]">
      
      {/* Overview Analytics Bar */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Deliveries</span>
          <span className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-1.5 mt-1">
            <MdDoneAll className="text-emerald-500" /> {totalDeliveries} Completed
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Payout Earnings</span>
          <span className="text-2xl md:text-3xl font-black text-[#ff4d2d] mt-1">
            ₹{totalEarnings.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
        <FaCalendarAlt className="text-[#ff4d2d]" /> Historical Logs Summary
      </h2>

      {Object.keys(historyGroups).length === 0 ? (
        <div className="text-center bg-white p-12 rounded-3xl border text-gray-400 font-medium">
          No delivery history recorded yet.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.values(historyGroups).map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              
              {/* Chronological Header Row */}
              <div className="flex justify-between items-end bg-gray-100/70 p-3 rounded-xl border border-gray-200/40">
                <span className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ff4d2d]" />
                  {group.label} {group.label !== "Today" && group.label !== "Yesterday" ? "" : `(${group.dateKey})`}
                </span>
                <span className="text-xs font-bold text-gray-500">
                  Daily Payout: <strong className="text-gray-800 text-sm font-black">₹{group.dailyEarnings.toLocaleString('en-IN')}</strong>
                </span>
              </div>

              {/* Order Cards loop inside current specific date group */}
              <div className="space-y-4">
                {group.orders.map((order, oIdx) => {
                  const isCOD = order.paymentMethod?.toUpperCase() === 'COD' || order.paymentMethod?.toLowerCase().includes('cash');
                  const formattedTime = new Date(order.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

                  return (
                    <div key={oIdx} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                      
                      {/* Top Shop Line */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-2.5">
                          {order.shopImage ? (
                            <img src={order.shopImage} className="w-9 h-9 rounded-xl object-cover border" alt="" />
                          ) : (
                            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-[#ff4d2d]"><FaStore size={16}/></div>
                          )}
                          <div>
                            <h4 className="text-sm font-black text-gray-800">{order.shopName}</h4>
                            <p className="text-[11px] text-gray-400 font-mono">ID: #{order.subOrderId.substring(18)}</p>
                          </div>
                        </div>

                        {/* Timestamp badge */}
                        <div className="text-right flex flex-col items-end">
                          <span className="text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 flex items-center gap-1">
                            <FaClock size={10} className="text-gray-400" /> {formattedTime}
                          </span>
                        </div>
                      </div>

                      {/* Menu Item Breakdowns Tray */}
                      <div className="bg-neutral-50/50 rounded-xl p-3 border border-neutral-100/50 space-y-1.5">
                        {order.items.map((item, iIdx) => (
                          <div key={iIdx} className="flex justify-between text-xs text-gray-600">
                            <span>{item.name} <strong className="text-gray-400">× {item.quantity}</strong></span>
                            <span className="font-medium text-gray-700">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Dropoff location details block */}
                      <div className="text-xs text-gray-500 flex items-start gap-1.5 bg-gray-50/30 p-2 rounded-lg truncate">
                        <FaMapMarkerAlt className="text-gray-400 shrink-0 mt-0.5" size={12} />
                        <span>Dropoff: <strong className="text-gray-700 font-medium">{order.deliveryAddress}</strong></span>
                      </div>

                      {/* Bottom Balance Strip */}
                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wider ${
                          isCOD ? 'bg-amber-50 text-amber-700 border-amber-200/70' : 'bg-green-50 text-green-700 border-green-200/70'
                        }`}>
                          {isCOD ? <FaMoneyBillWave size={12} /> : <FaCreditCard size={12} />}
                          {isCOD ? "Collect Cash on Delivery" : "Online Prepaid"}
                        </span>

                        <div className="text-xs text-gray-400 font-bold flex flex-col items-end gap-0.5">
                          <div>Food Bill Amount: <span className="font-bold text-gray-700">₹{order.amount}</span></div>
                          <div className="text-xs text-gray-500 font-bold">
                            Your Delivery Fee: <span className="text-base font-black text-emerald-600 ml-1">₹80</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryHistory;