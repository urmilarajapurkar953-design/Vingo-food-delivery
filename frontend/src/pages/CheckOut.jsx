import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaMapMarkerAlt, FaMoneyBillWave, FaCreditCard, FaSearch, FaCrosshairs } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// Redux Actions
import { clearCart } from '../redux/user.Slice'; 
import { setLocation, setAddress } from '../redux/mapSlice';

// Leaflet Imports
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function RecenterMap({ lat, lon, forceUpdate }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.flyTo([lat, lon], 15, {
        animate: true,
        duration: 1.5
      });
    }
  }, [lat, lon, forceUpdate, map]);
  return null;
}

const CheckOut = () => {
  const { cartItem, currentAddress, userData } = useSelector((state) => state.user);
  const { location } = useSelector((state) => state.map);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [forceMapUpdate, setForceMapUpdate] = useState(0);

  useEffect(() => {
    if (currentAddress) setDeliveryAddress(currentAddress);
  }, [currentAddress]);

  // --- MULTI-SHOP DYNAMIC DELIVERY FEE CALCULATIONS WITH WAIVER ---
  const subtotal = cartItem.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  const uniqueShops = [...new Set(cartItem.map(item => item.shop || item.shopId).filter(Boolean))];
  const totalShopsCount = uniqueShops.length > 0 ? uniqueShops.length : 1;
  
  // 🌟 DYNAMIC THRESHOLD RULE: If subtotal >= 500, delivery fee is dropped entirely
  const deliveryFee = subtotal >= 500 ? 0 : totalShopsCount * 40; 
  const total = subtotal + deliveryFee;

  const handleSearchAddress = async () => {
    if (!deliveryAddress || deliveryAddress.trim().length < 3) {
      return toast.error("Please enter a valid address to search.");
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(deliveryAddress)}&apiKey=${import.meta.env.VITE_GEOAPIKEY}`
      );

      if (response.data.features && response.data.features.length > 0) {
        const { lat, lon, formatted } = response.data.features[0].properties;
        
        dispatch(setLocation({ lat, lon }));
        dispatch(setAddress(formatted));
        setDeliveryAddress(formatted);
        setForceMapUpdate(prev => prev + 1);
        
        toast.success("Map centered on location");
      } else {
        toast.error("Location not found.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to search location.");
    } finally {
      loading && setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cartItem || cartItem.length === 0) {
      return toast.error("Your cart is empty.");
    }

    if (!deliveryAddress || deliveryAddress.trim().length < 5) {
      return toast.error("Please enter a valid delivery address.");
    }

    const baseOrderPayload = {
      items: cartItem.map(item => ({
        product: item._id, 
        quantity: item.quantity
      })),
      deliveryAddress: {
        text: deliveryAddress, 
        lat: location.lat || 19.2812, 
        lon: location.lon || 72.8554  
      },
      totalAmount: total 
    };

    if (paymentMethod === 'Online') {
      handleOnlinePaymentFlow(baseOrderPayload);
    } else {
      handleCodPaymentFlow(baseOrderPayload);
    }
  };

  const handleCodPaymentFlow = async (payload) => {
    setLoading(true);
    try {
      const finalPayload = { ...payload, paymentMethod: 'COD' };
      console.log("🚀 Placing COD Order payload:", finalPayload);

      const response = await axios.post("http://localhost:8000/api/orders/place", finalPayload, {
        withCredentials: true 
      });

      if (response.data.success) {
        toast.success("Order placed successfully!");
        dispatch(clearCart());
        navigate('/order-placed', { state: { orders: response.data.orders } });
      }
    } catch (error) {
      console.error("COD completion failed:", error);
      alert(error.response?.data?.message || "Something went wrong while executing checkout.");
    } finally {
      setLoading(false);
    }
  };

  const handleOnlinePaymentFlow = async (payload) => {
    setLoading(true);
    try {
      const { data } = await axios.post("http://localhost:8000/api/payment/razor-order", { amount: total }, {
        withCredentials: true
      });

      if (!data || !data.razorpayOrder) {
        throw new Error("Failed to initialize Razorpay transaction token reference.");
      }

      const { razorpayOrder } = data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "YOUR_TEST_KEY_ID",
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Vingo",
        description: "Secure Order Checkout",
        order_id: razorpayOrder.id,
        handler: async function (paymentResponse) {
          try {
            setLoading(true);
            const verifyRes = await axios.post("http://localhost:8000/api/payment/verify", {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            }, { withCredentials: true });

            if (verifyRes.data.success) {
              const finalPayload = { 
                ...payload, 
                paymentMethod: 'Online', 
                paymentStatus: 'Paid',
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id
              };

              const orderResponse = await axios.post("http://localhost:8000/api/orders/place", finalPayload, {
                withCredentials: true 
              });

              if (orderResponse.data.success) {
                toast.success("Online payment captured & order placed!");
                dispatch(clearCart());
                navigate('/order-placed', { state: { orders: orderResponse.data.orders } });
              }
            }
          } catch (err) {
            console.error("Signature processing failure:", err);
            toast.error(err.response?.data?.message || "Verification tracking error window.");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: userData?.fullName || userData?.name || "",
          email: userData?.email || "",
          contact: userData?.phone || ""
        },
        theme: {
          color: "#ff4d2d"
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const razorpayModal = new window.Razorpay(options);
      razorpayModal.open();

    } catch (error) {
      console.error("Online launch route failed:", error);
      toast.error(error.response?.data?.message || "Failed initializing payment gateway infrastructure.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        {/* Delivery Location Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-gray-800 font-bold mb-3">
            <FaMapMarkerAlt className="text-orange-500" />
            <span>Delivery Location</span>
          </div>
          
          <div className="flex gap-2 mb-4">
            <input 
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Search or type address..."
              className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm text-gray-600 focus:outline-none focus:border-orange-500"
            />
            
            <button 
              type="button" 
              onClick={handleSearchAddress}
              disabled={loading}
              className="bg-orange-500 p-3 rounded-xl text-white hover:bg-orange-600 transition-colors disabled:bg-gray-400"
            >
              <FaSearch />
            </button>

            <button 
              type="button"
              onClick={() => {
                setDeliveryAddress(currentAddress);
                setForceMapUpdate(prev => prev + 1); 
              }}
              className="bg-blue-500 p-3 rounded-xl text-white hover:bg-blue-600 transition-colors"
            >
              <FaCrosshairs />
            </button>
          </div>

          <div className="w-full h-64 bg-gray-200 rounded-2xl overflow-hidden border border-gray-100 z-0">
            {location.lat && location.lon ? (
              <MapContainer 
                center={[location.lat, location.lon]} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true} 
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <Marker position={[location.lat, location.lon]} />
                <RecenterMap lat={location.lat} lon={location.lon} forceUpdate={forceMapUpdate} />
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Detecting location on map...
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Section */}
        <div className="mb-8">
          <h2 className="font-bold mb-4">Payment Method</h2>
          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => setPaymentMethod('COD')}
              className={`cursor-pointer p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${paymentMethod === 'COD' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}
            >
              <div className="bg-green-100 p-2 rounded-lg text-green-600"><FaMoneyBillWave /></div>
              <div>
                <p className="font-bold text-sm">Cash on Delivery</p>
                <p className="text-[10px] text-gray-500">Pay at your doorstep</p>
              </div>
            </div>
            <div 
              onClick={() => setPaymentMethod('Online')}
              className={`cursor-pointer p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${paymentMethod === 'Online' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}
            >
              <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><FaCreditCard /></div>
              <div>
                <p className="font-bold text-sm">UPI / Cards</p>
                <p className="text-[10px] text-gray-500">Secure online payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-8">
          <h2 className="font-bold mb-4">Order Summary</h2>
          <div className="space-y-3 border-t border-b border-dashed border-gray-200 py-4 text-sm">
            {cartItem.map(item => (
               <div key={item._id} className="flex justify-between">
                 <span className="text-gray-600">{item.name} × {item.quantity}</span>
                 <span className="font-medium">₹{item.price * item.quantity}</span>
               </div>
            ))}
            <div className="flex justify-between pt-2">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-bold">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">
                Delivery Fee {totalShopsCount > 1 && deliveryFee > 0 && `(${totalShopsCount} Shops)`}
              </span>
              {deliveryFee === 0 ? (
                <span className="text-green-600 font-black tracking-wide bg-green-50 px-2 py-0.5 rounded text-xs uppercase">FREE</span>
              ) : (
                <span className="font-bold text-gray-800">₹{deliveryFee}</span>
              )}
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <span className="text-lg font-bold text-red-500">Total</span>
            <span className="text-xl font-black text-red-500">₹{total}</span>
          </div>
        </div>

        {/* Dynamic Action Button */}
        <button 
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-[#ff4d2d] text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:bg-gray-400"
        >
          {loading ? (
            "Processing Order..."
          ) : paymentMethod === 'Online' ? (
            "Pay and Place Order"
          ) : (
            "Place Order"
          ) }
        </button>
      </div>
    </div>
  );
};

export default CheckOut;