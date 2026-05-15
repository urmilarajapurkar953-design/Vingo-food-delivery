import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaMapMarkerAlt, FaMoneyBillWave, FaCreditCard, FaSearch, FaCrosshairs } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import  clearCart  from '../redux/user.Slice'; // Kept exactly as you requested

const CheckOut = () => {
  const { cartItem, currentAddress } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentAddress) {
      setDeliveryAddress(currentAddress);
    }
  }, [currentAddress]);

  const subtotal = cartItem.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = 40; 
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!deliveryAddress || deliveryAddress.trim() === "") {
      return toast.error("Please provide a delivery address");
    }

    setLoading(true);
    try {
      const orderData = {
        paymentMethod,
        deliveryAddress: {
          text: deliveryAddress,
        },
        items: cartItem.map(item => ({
          product: item._id,
          quantity: item.quantity
        })),
        totalAmount: total
      };

      const response = await axios.post('http://localhost:8000/api/orders/place', orderData, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success("Order Placed Successfully!");
        dispatch(clearCart());
        navigate('/home');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Order failed");
    } finally {
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
            {/* Input field for manual editing */}
            <input 
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter your delivery address..."
              className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm text-gray-600 focus:outline-none focus:border-orange-500"
            />
            
            {/* YOUR SEARCH ICON (Orange Button) */}
            <button 
              type="button"
              className="bg-orange-500 p-3 rounded-xl text-white hover:bg-orange-600 transition-colors"
            >
              <FaSearch />
            </button>

            {/* LIVE LOCATION ICON (Blue Button) */}
            <button 
              type="button"
              onClick={() => setDeliveryAddress(currentAddress)}
              title="Use current location"
              className="bg-blue-500 p-3 rounded-xl text-white hover:bg-blue-600 transition-colors"
            >
              <FaCrosshairs />
            </button>
          </div>

          <div className="w-full h-40 bg-gray-200 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100">
             <img src="https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/80.23,25.44,12/600x200?access_token=YOUR_MAP_TOKEN" alt="map" className="w-full h-full object-cover" />
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
                <p className="text-[10px] text-gray-500">Pay when food arrives</p>
              </div>
            </div>
            <div 
              onClick={() => setPaymentMethod('Online')}
              className={`cursor-pointer p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${paymentMethod === 'Online' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}
            >
              <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><FaCreditCard /></div>
              <div>
                <p className="font-bold text-sm">UPI / Cards</p>
                <p className="text-[10px] text-gray-500">Pay securely online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="mb-8">
          <h2 className="font-bold mb-4">Order Summary</h2>
          <div className="space-y-3 border-t border-b border-dashed border-gray-200 py-4">
            {cartItem.map(item => (
               <div key={item._id} className="flex justify-between text-sm">
                 <span className="text-gray-600">{item.name} × {item.quantity}</span>
                 <span className="font-medium">₹{item.price * item.quantity}</span>
               </div>
            ))}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-bold">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery Fee</span>
              <span className="font-bold">₹{deliveryFee}</span>
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <span className="text-lg font-bold text-red-500">Total</span>
            <span className="text-lg font-black text-red-500">₹{total}</span>
          </div>
        </div>

        <button 
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-[#ff4d2d] text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:bg-gray-400"
        >
          {loading ? "Processing..." : "Place Order"}
        </button>
      </div>
    </div>
  );
};

export default CheckOut;