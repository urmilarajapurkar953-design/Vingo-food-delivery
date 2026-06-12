import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { FaMapMarkerAlt, FaStore, FaMoneyBillWave, FaClock, FaShippingFast, FaMap, FaLock, FaUndo, FaTimes, FaCreditCard, FaWallet, FaCoins } from 'react-icons/fa';
import { useSelector } from 'react-redux'; 
import axios from 'axios'; 
import { serverUrl } from '../App';
import toast from 'react-hot-toast';

const axiosClient = axios;

const DeliveryBoy = () => {
  const { socket } = useSocket();
  const [availableJobs, setAvailableJobs] = useState([]);
  
  // 🌟 PERSISTENCE STEP 1: Initialize activeDelivery state directly from localStorage fallback if available
  const [activeDelivery, setActiveDelivery] = useState(() => {
    const savedRun = localStorage.getItem('current_active_delivery_run');
    return savedRun ? JSON.parse(savedRun) : null;
  });
  
  const [loadingId, setLoadingId] = useState(null);
  const [completing, setCompleting] = useState(false); 

  // 🔒 SECURE DOORSTEP OTP FLOW STATE FIELDS
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [resending, setResending] = useState(false);

  const { userData, loading } = useSelector((state) => state.user || {});
  const driverId = userData?._id;

  // FIXED ARRANGEMENT VALUE CONFIGURATION FOR EARNINGS
  const DELIVERY_FEE_PAYOUT = 80;

  // 🌟 DYNAMIC ORDER VALUE + APP PLATFORM FEES CALCULATION UTILITY
  const calculateTotalOrderValue = (orderObj) => {
    if (!orderObj) return 0;
    
    // Fallback extraction tree for basic amount
    const baseValue = orderObj.totalAmount || orderObj.subTotal || orderObj.orderValue || orderObj.total || orderObj.amount || 0;
    
    // If order price is less than 500, apply the 40 rupees app fee
    if (baseValue > 0 && baseValue < 500) {
      return baseValue + 40;
    }
    return baseValue;
  };

  // 🌟 ROBUST CASE-INSENSITIVE PAYMENT METHOD CHECKER
  const checkIfCOD = (paymentMethodString) => {
    if (!paymentMethodString) return false;
    const normalized = paymentMethodString.toLowerCase();
    return normalized.includes('cod') || normalized.includes('cash');
  };

  // 🌟 PERSISTENCE STEP 2: Sync activeDelivery to localStorage whenever it changes
  useEffect(() => {
    if (activeDelivery) {
      localStorage.setItem('current_active_delivery_run', JSON.stringify(activeDelivery));
    } else {
      localStorage.removeItem('current_active_delivery_run');
    }
  }, [activeDelivery]);

  // 🌟 PERSISTENCE STEP 3: Query the backend on mount/refresh to find any already accepted runs
  useEffect(() => {
    const fetchExistingJobs = async () => {
      if (!driverId) return;
      try {
        // Fetch available job feeds
        const response = await axiosClient.get(`${serverUrl}/api/delivery/available-jobs`, { withCredentials: true });
        if (response.data.success) {
          setAvailableJobs(response.data.jobs || []);
          
          if (response.data.activeJob) {
            const activeJobData = response.data.activeJob;
            setActiveDelivery({
              ...activeJobData,
              subTotal: activeJobData.subTotal || activeJobData.orderValue || activeJobData.masterOrderId?.subTotal || activeJobData.orderId?.subTotal,
              savedShopName: activeJobData.shopName || activeJobData.shop?.name || activeJobData.items?.[0]?.shopId?.name,
              savedShopAddress: activeJobData.shopAddress || activeJobData.shop?.address || activeJobData.items?.[0]?.shopId?.address || activeJobData.storeAddress,
              paymentMethod: activeJobData.paymentMethod || activeJobData.orderId?.paymentMethod || activeJobData.masterOrderId?.paymentMethod
            });
          }
        }
      } catch (error) {
        console.error("Error fetching initialized jobs:", error);
      }
    };
    fetchExistingJobs();
  }, [driverId, loading]); 

  useEffect(() => {
    if (!socket) return;

    socket.on('newDeliveryJobAvailable', (jobData) => {
      setAvailableJobs((prevJobs) => {
        const currentIncomingId = jobData.subOrderId || jobData.assignmentId || jobData._id;
        if (prevJobs.some(job => (job.subOrderId || job.assignmentId || job._id) === currentIncomingId)) return prevJobs;
        return [jobData, ...prevJobs];
      });
      toast(`New delivery job available nearby!`, { icon: '📦', position: 'bottom-right' });
    });

    socket.on('removeDeliveryJobCard', (data) => {
      const targetRemoveId = data.subOrderId || data.assignmentId || data._id;
      setAvailableJobs((prevJobs) => prevJobs.filter(job => (job.subOrderId || job.assignmentId || job._id) !== targetRemoveId));
    });

    return () => {
      socket.off('newDeliveryJobAvailable');
      socket.off('removeDeliveryJobCard');
    };
  }, [socket]);

  // =========================================================================
  // ⚡ BACKGROUND GPS SENSOR: STREAMS TELEMETRY COORDINATES TO THE CUSTOMER
  // =========================================================================
  useEffect(() => {
    if (!activeDelivery) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentCoordinates = [latitude, longitude];

        if (socket) {
          socket.emit('shareRiderLocationUpdate', {
            assignmentId: activeDelivery.assignmentId || activeDelivery._id || activeDelivery.subOrderId,
            coords: currentCoordinates
          });
        }
      },
      (error) => {
        console.log("Telemetry engine background pings running.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [activeDelivery, socket]);

  const handleAcceptJob = async (jobObject) => {
    if (activeDelivery) {
      toast.error("You cannot accept another job until your current delivery is successful!");
      return;
    }

    if (!jobObject) {
      toast.error("Unable to read job data context payload.");
      return;
    }

    const targetId = jobObject.subOrderId || jobObject.masterOrderId || jobObject.assignmentId || jobObject._id;
    
    if (!targetId) {
      toast.error("Invalid Request ID reference.");
      return;
    }

    setLoadingId(targetId);
    try {
      const response = await axiosClient.post(`${serverUrl}/api/delivery/accept-job`, 
        { 
          assignmentId: targetId,
          shopOrderId: jobObject.subOrderId || targetId 
        }, 
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("Job accepted! Drive safely.");
        
        const acceptedJob = {
          ...(response.data.assignment || {}),
          ...jobObject, 
          savedShopName: jobObject.shopName || jobObject.shop?.name || jobObject.items?.[0]?.shopId?.name,
          savedShopAddress: jobObject.shopAddress || jobObject.shop?.address || jobObject.items?.[0]?.shopId?.address || jobObject.storeAddress,
          paymentMethod: jobObject.paymentMethod
        };
        setActiveDelivery(acceptedJob);
        setAvailableJobs((prevJobs) => 
          prevJobs.filter(job => (job.subOrderId || job.masterOrderId || job.assignmentId || job._id) !== targetId)
        );
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Could not accept this job.";
      toast.error(errorMsg);
    } finally {
      setLoadingId(null);
    }
  };

  const handleInitializeDropoff = async (isResend = false) => {
    if (!activeDelivery) return;
    
    if (isResend) setResending(true);
    else setCompleting(true);

    const activeTrackingId = activeDelivery.assignmentId || activeDelivery._id || activeDelivery.subOrderId;

    try {
      const response = await axiosClient.post(`${serverUrl}/api/delivery/send-otp`, 
        { assignmentId: activeTrackingId },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(isResend ? "New code sent to customer email!" : "Verification pin sent to customer!");
        setShowOtpModal(true);
      }
    } catch (error) {
      console.error("Failed to route token drop-off trigger:", error);
      toast.error(error.response?.data?.message || "Error processing delivery verification request.");
    } finally {
      setCompleting(false);
      setResending(false);
    }
  };

  const handleVerifyOtpAndComplete = async (e) => {
    e.preventDefault();
    if (!activeDelivery) return;
    if (otpInput.length !== 6) return toast.error("Please provide the complete 6-digit pin.");

    setCompleting(true);
    const activeTrackingId = activeDelivery.assignmentId || activeDelivery._id || activeDelivery.subOrderId;

    try {
      const response = await axiosClient.post(`${serverUrl}/api/delivery/verify-otp`, 
        { 
          assignmentId: activeTrackingId,
          inputOTP: otpInput
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("Doorstep OTP verified! Order completed successfully.");
        setShowOtpModal(false);
        setOtpInput('');
        setActiveDelivery(null); 
      }
    } catch (error) {
      console.error("Validation submission crash:", error);
      toast.error(error.response?.data?.message || "Invalid validation token code.");
    } finally {
      setCompleting(false);
    }
  };

  const handleOpenGoogleMapsNavigation = () => {
    if (!activeDelivery) return;

    const rawAddress = activeDelivery.savedShopAddress || activeDelivery.shopAddress || activeDelivery.shop?.address || "";
    const originShop = encodeURIComponent(rawAddress);
    const destLat = activeDelivery.deliveryAddress?.lat;
    const destLng = activeDelivery.deliveryAddress?.lng;
    const destText = encodeURIComponent(activeDelivery.deliveryAddress?.text || activeDelivery.deliveryAddress || "");

    let googleMapsUrl = "";

    if (destLat && destLng) {
      googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originShop}&destination=${destLat},${destLng}&travelmode=driving`;
    } else if (destText) {
      googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originShop}&destination=${destText}&travelmode=driving`;
    }

    if (googleMapsUrl) {
      window.open(googleMapsUrl, '_blank');
    } else {
      toast.error("Could not find address information to generate route.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-[80px] pt-6 px-4 md:px-8 pb-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT / MIDDLE COLUMN: FEED --- */}
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
              <p className="text-gray-400 text-sm max-w-sm mt-1">Orders marked as "Out for Delivery" will pop up here instantly.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-orange-600 tracking-wider uppercase">Offers In Your Radius ({availableJobs.length})</h2>
                {activeDelivery && (
                  <span className="text-xs text-red-500 font-extrabold bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 animate-pulse">
                    Feed Locked: Run Active
                  </span>
                )}
              </div>
              {availableJobs.map((job, index) => {
                const uniqueKeyId = job.subOrderId || job.assignmentId || job._id || `offer-card-${index}`;
                
                // 🌟 FIX: Implemented Case-Insensitive Payment Matching Check
                const isJobCOD = checkIfCOD(job.paymentMethod);
                
                // 🌟 FIX: Compute base order values with automated platform fee logic appended
                const totalFoodValueWithFees = calculateTotalOrderValue(job);

                return (
                  <div key={uniqueKeyId} className={`bg-white rounded-2xl border p-6 shadow-sm transition-all flex flex-col justify-between gap-4 md:flex-row md:items-center ${activeDelivery ? 'border-gray-100 opacity-65' : 'border-gray-100 hover:shadow-md'}`}>
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-orange-50 text-[#ff4d2d] mt-0.5">
                          <FaStore size={16} />
                        </div>
                        <div>
                          <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Pickup Location</span>
                          <h4 className="font-bold text-gray-800 text-base leading-tight mt-0.5">
                            {job.shopName || job.shop?.name || job.items?.[0]?.shopId?.name || "Store Merchant"}
                          </h4>
                          <p className="text-sm text-gray-500 truncate max-w-[350px] md:max-w-[450px]">
                            {job.shopAddress || job.shop?.address || job.items?.[0]?.shopId?.address || job.storeAddress || "Address details missing"}
                          </p>
                        </div>
                      </div>

                      <div className="w-full border-t border-dashed border-gray-100 my-1"></div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-500 mt-0.5">
                          <FaMapMarkerAlt size={16} />
                        </div>
                        <div>
                          <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Delivery Drop-off</span>
                          <p className="text-sm font-semibold text-gray-700 mt-0.5">{job.deliveryAddress?.text || job.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 min-w-[190px]">
                      <div className="text-left md:text-center w-full space-y-1">
                        
                        <span className="text-[10px] text-emerald-600 uppercase font-black tracking-wider block md:text-center">Your Earning</span>
                        <div className="text-2xl font-black text-emerald-600 flex items-center justify-start md:justify-center gap-1 bg-emerald-50 px-3 py-1 rounded-xl w-fit mx-auto border border-emerald-100">
                          <FaCoins className="text-emerald-500 text-lg" /> ₹{DELIVERY_FEE_PAYOUT}
                        </div>

                        {/* 🌟 APPLIED PLATFORM SURCHARGE CALCULATION REFLECTION */}
                        <div className="text-[11px] text-gray-400 mt-1 block md:text-center">
                          Total Amount: <span className="font-bold text-gray-600">₹{totalFoodValueWithFees}</span>
                        </div>

                        <div className={`mt-1.5 flex items-center justify-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border mx-auto w-fit ${
                          isJobCOD 
                            ? "bg-amber-50 text-amber-700 border-amber-200" 
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {isJobCOD ? <FaWallet size={10} /> : <FaCreditCard size={10} />}
                          {isJobCOD ? " COD " : "Prepaid System"}
                        </div>
                      </div>

                      <button
                        disabled={loadingId !== null || activeDelivery !== null}
                        onClick={() => handleAcceptJob(job)}
                        className={`w-full max-w-[150px] font-bold py-3 px-4 rounded-xl transition-all text-sm tracking-wide ${
                          activeDelivery 
                            ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none" 
                            : "bg-[#ff4d2d] text-white shadow-lg hover:bg-[#e03d1e] disabled:bg-gray-300 cursor-pointer"
                        }`}
                      >
                        {loadingId === (job.subOrderId || job.assignmentId || job._id) 
                          ? 'Claiming...' 
                          : activeDelivery 
                          ? 'Locked' 
                          : 'Accept Job'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: ACTIVE RUN WORKSPACE --- */}
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
                    <FaClock className="animate-spin text-orange-500" /> In-Route To Customer
                  </div>
                </div>

                {/* RESTRUCTURED FINANCIAL ACCOUNTING BLOCK */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 shadow-inner">
                  
                  {/* Payout Metric Row */}
                  <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <FaCoins className="text-emerald-600" /> Your Clear Payout:
                    </span>
                    <span className="text-lg font-black text-emerald-700">₹{DELIVERY_FEE_PAYOUT}</span>
                  </div>

                  <div className="border-t border-dashed border-gray-200 my-1"></div>

                  {/* 🌟 FIX: Applied case-insensitive checker and dynamic total logic to active container card layout */}
                  {(() => {
                    const isActiveCOD = checkIfCOD(activeDelivery.paymentMethod);
                    const activeTotalWithFees = calculateTotalOrderValue(activeDelivery);

                    return (
                      <div className={`p-3 rounded-xl border flex flex-col gap-1 ${
                        isActiveCOD
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-blue-50 border-blue-200 text-blue-900"
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-black opacity-70 tracking-wider flex items-center gap-1">
                            {isActiveCOD ? (
                              <><FaWallet className="text-amber-600" /> COLLECT DOORSTEP CASH:</>
                            ) : (
                              <><FaCreditCard className="text-blue-600" /> DIGITAL PREPAID ORDER:</>
                            )}
                          </span>
                          <span className="text-sm font-black font-mono">
                            ₹{activeTotalWithFees}
                          </span>
                        </div>

                        <p className="text-[10px] font-medium opacity-75 leading-tight mt-1">
                          {isActiveCOD
                            ? "*Collect this full amount from customer before unlocking the drop-off OTP code."
                            : "*Customer paid online already. No cash collection required."}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Store Pickup</label>
                    <p className="font-bold text-gray-800 text-sm mt-0.5">
                      {activeDelivery.savedShopName || 
                       activeDelivery.shopName || 
                       activeDelivery.shop?.name || 
                       activeDelivery.items?.[0]?.shopId?.name || 
                       "Partner Store"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activeDelivery.savedShopAddress ||
                       activeDelivery.shopAddress || 
                       activeDelivery.shop?.address || 
                       activeDelivery.items?.[0]?.shopId?.address || 
                       activeDelivery.storeAddress ||
                       "Address details missing"}
                    </p>
                  </div>

                  <div className="h-[20px] border-l-2 border-dashed border-gray-200 ml-3"></div>

                  <div>
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Customer Destination</label>
                    <p className="font-semibold text-gray-700 text-xs mt-0.5">{activeDelivery.deliveryAddress?.text || activeDelivery.deliveryAddress}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    onClick={handleOpenGoogleMapsNavigation} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border-none"
                  >
                    <FaMap size={12} />
                    Open Route in Google Maps
                  </button>
                  
                  <button 
                    disabled={completing}
                    onClick={() => handleInitializeDropoff(false)} 
                    className="w-full bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-emerald-600 disabled:bg-gray-300 transition-all shadow-md flex items-center justify-center cursor-pointer border-none"
                  >
                    {completing ? 'Sending OTP...' : 'Confirm Drop-off / Complete Run'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* =========================================================================
      // 🔒 SECURE INTERACTIVE DOORSTEP OTP OVERLAY SHEET MODAL LAYER
      // ========================================================================= */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-6 md:p-8 text-center shadow-2xl relative border border-gray-50">
            
            <button 
              onClick={() => { setShowOtpModal(false); setOtpInput(''); }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer"
            >
              <FaTimes size={16} />
            </button>

            <div className="w-14 h-14 bg-orange-50 text-[#ff4d2d] rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
              <FaLock />
            </div>
            
            <h3 className="text-xl font-black text-gray-900 mb-1">Doorstep Code Verification</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-6">
              Ask the customer for the 6-digit verification code sent directly to their registered email profile box.
            </p>

            <form onSubmit={handleVerifyOtpAndComplete} className="space-y-4">
              <input
                type="text"
                maxLength="6"
                placeholder="••••••"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))} 
                className="w-full text-center text-2xl font-black tracking-[12px] bg-gray-50 border-2 border-gray-100 focus:border-[#ff4d2d] focus:bg-white rounded-2xl p-3.5 outline-none transition-all"
                autoFocus
              />

              <button
                type="submit"
                disabled={completing || otpInput.length !== 6}
                className="w-full bg-[#ff4d2d] hover:bg-[#e64429] text-white py-3.5 rounded-xl font-bold transition-all disabled:bg-gray-300 disabled:text-gray-400 shadow-md text-sm cursor-pointer border-none"
              >
                {completing ? "Verifying Token..." : "Unlock & Release Order"}
              </button>
            </form>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 text-xs">
              <button 
                type="button"
                disabled={resending}
                onClick={() => handleInitializeDropoff(true)}
                className="text-gray-500 hover:text-gray-800 font-bold flex items-center gap-1.5 transition-colors disabled:text-gray-300 bg-transparent border-none cursor-pointer"
              >
                <FaUndo className={resending ? "animate-spin" : ""} /> {resending ? "Sending..." : "Resend PIN"}
              </button>
              <button 
                type="button"
                onClick={() => { setShowOtpModal(false); setOtpInput(''); }}
                className="text-red-400 hover:text-red-600 font-medium transition-colors bg-transparent border-none cursor-pointer"
              >
                Cancel 
              </button>
            </div>
          </div>
        </div>
      )}f
    </div>
  );
};

export default DeliveryBoy;