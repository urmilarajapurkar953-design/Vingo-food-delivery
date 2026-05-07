import React, { useState } from 'react';
import { FaUtensils } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setMyShopData } from '../redux/ownerSlice';
// Fixed the missing serverUrl import
import { serverUrl } from '../main';

const AddItem = () => {
    const dispatch = useDispatch();
    
    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [category, setCategory] = useState('');
    const [foodType, setFoodType] = useState('veg');
    const [backendImage, setBackendImage] = useState(null);
    const [frontendImage, setFrontendImage] = useState(null);

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

            dispatch(setMyShopData(result.data));
            alert("Item Added Successfully!");
        } catch (error) {
            console.log(error);
            alert("Error: " + error.response?.data?.message || "Something went wrong");
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
                            placeholder='Enter Item Name' 
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white'
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            required
                        />
                    </div>

                    {/* Food Image Input and BIG PREVIEW */}
                    <div>
                        <label className='block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-tight'>Food Image</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            className='w-full px-2 py-1 border rounded-lg text-sm text-gray-500 file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700'
                            onChange={handleImage}
                        />
                        
                        {/* This is the part that makes the photo look big like your shop photo */}
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
                            placeholder='0' 
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500'
                            onChange={(e) => setPrice(e.target.value)}
                            value={price}
                            required
                        />
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className='block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-tight'>Select Category</label>
                        <select 
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white text-sm'
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
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white text-sm'
                            onChange={(e) => setFoodType(e.target.value)}
                            value={foodType}
                        >
                            <option value="veg">veg</option>
                            <option value="non veg">non veg</option>
                        </select>
                    </div>

                    {/* Save Button */}
                    <button 
                        type="submit"
                        className='w-full bg-[#ff4d2d] text-white py-3 rounded-lg font-bold shadow-md hover:bg-orange-600 transition-all duration-200 mt-2'
                    >
                        Save
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddItem;