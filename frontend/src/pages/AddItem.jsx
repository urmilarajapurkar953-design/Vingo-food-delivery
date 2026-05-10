import React, { useState } from 'react';
import { FaUtensils, FaSpinner } from 'react-icons/fa'; // Added FaSpinner
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setMyShopData } from '../redux/ownerSlice';
import { serverUrl } from '../main';
import { toast } from 'react-hot-toast'; // Recommended for better feedback
import { useNavigate } from 'react-router-dom';

const AddItem = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [category, setCategory] = useState('');
    const [foodType, setFoodType] = useState('veg');
    const [backendImage, setBackendImage] = useState(null);
    const [frontendImage, setFrontendImage] = useState(null);
    
    // --- NEW LOADING STATE ---
    const [loading, setLoading] = useState(false);

    const categories = [
        "Snacks", "Main Course", "Desserts", "Pizza", "Burgers", 
        "Sandwiches", "South Indian", "North Indian", "Chinese", 
        "Fast Food", "Others"
    ];

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBackendImage(file);
            setFrontendImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Start Loading
        setLoading(true);
        const toastId = toast.loading("Adding item to menu...");

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("category", category);
            formData.append("foodType", foodType);
            formData.append("price", price);
            
            if (backendImage) {
                formData.append("image", backendImage);
            }

            const result = await axios.post(`${serverUrl}/api/item/add-item`, formData, {
                withCredentials: true
            });

            // Update Redux
            dispatch(setMyShopData(result.data.shop || result.data));
            
            toast.success("Item Added Successfully!", { id: toastId });
            
            // Redirect back to home/dashboard after success
            setTimeout(() => {
                navigate('/home');
            }, 1500);

        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || "Something went wrong";
            toast.error("Error: " + errorMsg, { id: toastId });
        } finally {
            // Stop Loading
            setLoading(false);
        }
    };

    return (
        <div className='min-h-screen bg-[#fff9f6] flex justify-center items-center p-4 py-10'>
            <div className='w-full max-w-md bg-white shadow-lg rounded-2xl p-8 border border-gray-100'>
                {/* Header Icon and Title */}
                <div className='flex flex-col items-center text-center mb-6'>
                    <div className='bg-orange-50 p-4 rounded-full mb-2'>
                        <FaUtensils className='text-[#ff4d2d] w-8 h-8' />
                    </div>
                    <h2 className='text-2xl font-bold text-gray-800'>Add Food</h2>
                </div>

                <form onSubmit={handleSubmit} className='space-y-4'>
                    {/* Name */}
                    <div>
                        <label className='block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-tight'>Name</label>
                        <input 
                            type="text" 
                            disabled={loading}
                            placeholder='Enter Item Name' 
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white disabled:bg-gray-50'
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            required
                        />
                    </div>

                    {/* Food Image */}
                    <div>
                        <label className='block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-tight'>Food Image</label>
                        <input 
                            type="file" 
                            disabled={loading}
                            accept="image/*"
                            className='w-full px-2 py-1 border rounded-lg text-sm text-gray-500 file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 disabled:opacity-50'
                            onChange={handleImage}
                        />
                        
                        {frontendImage && (
                            <div className='mt-3 w-full h-44 overflow-hidden rounded-lg border border-gray-200 shadow-sm'>
                                <img 
                                    src={frontendImage} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                        )}
                    </div>

                    {/* Price */}
                    <div>
                        <label className='block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-tight'>Price</label>
                        <input 
                            type="number" 
                            disabled={loading}
                            placeholder='0' 
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50'
                            onChange={(e) => setPrice(e.target.value)}
                            value={price}
                            required
                        />
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className='block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-tight'>Select Category</label>
                        <select 
                            disabled={loading}
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white text-sm disabled:bg-gray-50'
                            onChange={(e) => setCategory(e.target.value)}
                            value={category}
                            required
                        >
                            <option value="">select Category</option>
                            {categories.map((cate, index) => (
                                <option value={cate} key={index}>{cate}</option>
                            ))}
                        </select>
                    </div>

                    {/* Food Type Selection */}
                    <div>
                        <label className='block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-tight'>Select Food Type</label>
                        <select 
                            disabled={loading}
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white text-sm disabled:bg-gray-50'
                            onChange={(e) => setFoodType(e.target.value)}
                            value={foodType}
                        >
                            <option value="veg">veg</option>
                            <option value="non veg">non veg</option>
                        </select>
                    </div>

                    {/* Save Button with Loading State */}
                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 ${loading ? 'bg-orange-300' : 'bg-[#ff4d2d] hover:bg-orange-600'} text-white py-3 rounded-lg font-bold shadow-md transition-all duration-200 mt-2`}
                    >
                        {loading ? (
                            <>
                                <FaSpinner className="animate-spin" />
                                Adding Item...
                            </>
                        ) : (
                            "Save"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddItem;