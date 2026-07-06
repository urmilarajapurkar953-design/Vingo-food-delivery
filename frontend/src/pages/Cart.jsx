import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaPlus, FaMinus, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { addToCart, decrementQuantity, removeFromCart } from '../redux/user.Slice';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { cartItem } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const totalPrice = cartItem.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const DELIVERY_FEE = totalPrice >= 500 ? 0 : 40;
  
  const finalTotal = totalPrice + DELIVERY_FEE;

  if (cartItem.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fff9f6]">
        <h2 className="text-2xl font-bold text-gray-800">Your cart is empty</h2>
        <button 
          onClick={() => navigate('/home')}
          className="mt-4 text-[#ff4d2d] font-bold flex items-center gap-2"
        >
          <FaArrowLeft /> Go back to menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff9f6] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-gray-800 mb-8">My Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItem.map((item) => (
              <div key={item._id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-gray-100">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-2xl" />
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{item.name}</h3>
                  <p className="text-[#ff4d2d] font-black text-sm">₹{item.price}</p>
                </div>

                <div className="flex items-center bg-gray-100 rounded-xl px-2 py-1">
                  <button onClick={() => dispatch(decrementQuantity(item._id))} className="p-2 text-gray-600"><FaMinus size={10} /></button>
                  <span className="px-3 font-bold">{item.quantity}</span>
                  <button onClick={() => dispatch(addToCart(item))} className="p-2 text-gray-600"><FaPlus size={10} /></button>
                </div>

                <button 
                  onClick={() => dispatch(removeFromCart(item._id))}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            ))}

            {totalPrice < 500 && (
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl text-xs font-bold text-neutral-600">
                💡 Add <span className="text-[#ff4d2d]">₹{500 - totalPrice}</span> more to unlock <span className="text-green-600 font-extrabold">FREE DELIVERY</span>!
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm h-fit border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Summary</h2>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-bold">₹{totalPrice}</span>
            </div>
            <div className="flex justify-between mb-4 pb-4 border-b border-gray-100">
              <span className="text-gray-500">Delivery Fee</span>
              {DELIVERY_FEE === 0 ? (
                <span className="text-green-600 font-black tracking-wide bg-green-50 px-2 py-0.5 rounded text-xs uppercase">FREE</span>
              ) : (
                <span className="text-gray-800 font-bold">₹{DELIVERY_FEE}</span>
              )}
            </div>
            <div className="flex justify-between mb-6">
              <span className="text-lg font-bold">Total</span>
              <span className="text-lg font-black text-[#ff4d2d]">₹{finalTotal}</span>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full bg-[#ff4d2d] text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-[#e64429] transition-all"
            >
              Proceed to CheckOut
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
