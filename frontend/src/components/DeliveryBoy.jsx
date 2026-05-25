import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { FaMapMarkerAlt, FaStore, FaMoneyBillWave, FaClock, FaShippingFast } from 'react-icons/fa';
import { useSelector } from 'react-redux'; // ADDED: Pull auth state tracking safely from Redux
import axios from 'axios';
import { serverUrl } from '../App';
import toast from 'react-hot-toast';

const DeliveryBoy = () => {
  const { socket } = useSocket();
  const [availableJobs, setAvailableJobs] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  // ADDED: Track your user slice details directly to prevent unauthenticated initialization requests
  const { userData, loading } = useSelector((state) => state.user || {});
  const driverId = userData?._id;

  // FIXED: Fetch missed, active jobs ONLY when the authenticated driverId is confirmed ready
  useEffect(() => {
    const fetchExistingJobs = async () => {
      // Pause execution if the application is bootstrapping or user data isn't loaded yet
      if (!driverId) {
        console.log("⏳ Delaying API dispatch check: Auth state is still loading...");
        return;
      }

      try {
        console.log(`🚀 Auth validated! Fetching job history manifest context for driver: ${driverId}`);
        const response = await axios.get(`${serverUrl}/api/delivery/available-jobs`, { withCredentials: true });
        if (response.data.success) {
          setAvailableJobs(response.data.jobs);
        }
      } catch (error) {
        console.error("Error fetching initialized jobs:", error);
      }
    };

    fetchExistingJobs();
  }, [driverId, loading]); // ⚡ Triggers automatically the second your async auth state resolves

  // REAL-TIME BROADCAST LISTENER
  useEffect(() => {
    if (!socket) return;

    socket.on('newDeliveryJobAvailable', (jobData) => {
      console.log("🚚 Real-time Alert: New matching broadcast received:", jobData);
      setAvailableJobs((prevJobs) => {
        if (prevJobs.some(job => job.assignmentId === jobData.assignmentId)) return prevJobs;
        return [jobData, ...prevJobs];
      });
      toast(`New delivery job available nearby!`, { icon: '📦', position: 'bottom-right' });
    });

    socket.on('removeDeliveryJobCard', (data) => {
      console.log("❌ Job pulled off market. Removed card ID:", data.assignmentId);
      setAvailableJobs((prevJobs) => prevJobs.filter(job => job.assignmentId !== data.assignmentId));
    });

    return () => {
      socket.off('newDeliveryJobAvailable');
      socket.off('removeDeliveryJobCard');
    };
  }, [socket]);

  const handleAcceptJob = async (assignmentId) => {
    setLoadingId(assignmentId);
    try {
      const response = await axios.post(`${serverUrl}/api/delivery/accept-job`, 
        { assignmentId }, 
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("Job accepted! Drive safely.");
        const acceptedJob = availableJobs.find(job => job.assignmentId === assignmentId);
        setActiveDelivery(acceptedJob);
        setAvailableJobs((prevJobs) => prevJobs.filter(job => job.assignmentId !== assignmentId));
      }
    } catch (error) {
      console.error("Failed to claim job:", error);
      const errorMsg = error.response?.data?.message || "Could not accept this job.";
      toast.error(errorMsg);
      setAvailableJobs((prevJobs) => prevJobs.filter(job => job.assignmentId !== assignmentId));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-[80px] pt-6 px-4 md:px-8 pb-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT / MIDDLE COLUMN: OPEN DISPATCH MARKET FEED --- */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaShippingFast className="text-[#ff4d2d]" /> Driver Dispatch Console
              </h1>
              <p className="text-sm text-gray-500 mt-1">Real-time geo-radar listening for active store requests...</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
            </span>
          </div>

          {availableJobs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200 shadow-sm flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4 text-orange-500 animate-bounce">
                📡
              </div>
              <h3 className="text-lg font-bold text-gray-700">No active store requests nearby</h3>
              <p className="text-gray-400 text-sm max-w-sm mt-1">Orders marked as "Out for Delivery" within 5km will pop up here instantly.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-orange-600 tracking-wider uppercase">Offers In Your Radius ({availableJobs.length})</h2>
              {availableJobs.map((job) => (
                <div key={job.assignmentId} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-orange-50 text-[#ff4d2d] mt-0.5">
                        <FaStore size={16} />
                      </div>
                      <div>
                        <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Pickup Location</span>
                        <h4 className="font-bold text-gray-800 text-base leading-tight mt-0.5">{job.shopName}</h4>
                        <p className="text-sm text-gray-500 truncate max-w-[350px] md:max-w-[450px]">{job.shopAddress}</p>
                      </div>
                    </div>

                    <div className="w-full border-t border-dashed border-gray-100 my-1"></div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-500 mt-0.5">
                        <FaMapMarkerAlt size={16} />
                      </div>
                      <div>
                        <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Delivery Drop-off</span>
                        <p className="text-sm font-semibold text-gray-700 mt-0.5">{job.deliveryAddress?.text}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 min-w-[140px]">
                    <div className="text-left md:text-center">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Order Value</span>
                      <div className="text-xl font-black text-gray-800 flex items-center justify-start md:justify-center gap-1">
                        <FaMoneyBillWave className="text-emerald-500 text-lg" /> ₹{job.subTotal}
                      </div>
                    </div>

                    <button
                      disabled={loadingId !== null}
                      onClick={() => handleAcceptJob(job.assignmentId)}
                      className="w-full max-w-[150px] bg-[#ff4d2d] text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-[#e03d1e] disabled:bg-gray-300 transition-all text-sm tracking-wide"
                    >
                      {loadingId === job.assignmentId ? 'Claiming...' : 'Accept Job'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: ACTIVE MISSION CONTAINER NODE --- */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-[104px]">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              📋 My Active Run
            </h2>

            {!activeDelivery ? (
              <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center">
                <span className="text-4xl mb-2">🛵</span>
                <p className="text-sm font-medium">No active delivery route bound.</p>
                <p className="text-xs text-gray-400 mt-1 px-4">Accept an offer from the feed on the left to lock in a navigation manifest target.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5 pt-4">
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
                    <FaClock className="animate-spin text-orange-500" /> In-Route To Store
                  </div>
                  <span className="text-xs font-black text-orange-700 bg-white border border-orange-200 px-2 py-0.5 rounded shadow-sm">
                    ₹{activeDelivery.subTotal}
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Store Pickup</label>
                    <p className="font-bold text-gray-800 text-sm mt-0.5">{activeDelivery.shopName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{activeDelivery.shopAddress}</p>
                  </div>

                  <div className="h-[20px] border-l-2 border-dashed border-gray-200 ml-3"></div>

                  <div>
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Customer Destination</label>
                    <p className="font-semibold text-gray-700 text-xs mt-0.5">{activeDelivery.deliveryAddress?.text}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    onClick={() => {
                      toast.success("Navigation directions coming soon!");
                    }} 
                    className="w-full bg-gray-800 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-gray-900 transition-all"
                  >
                    Open Map Route Directions
                  </button>
                  <button 
                    onClick={() => {
                      setActiveDelivery(null);
                      toast.success("Delivery completed successfully!");
                    }} 
                    className="w-full bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-emerald-600 transition-all shadow-md"
                  >
                    Confirm Drop-off / Complete Run
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DeliveryBoy;