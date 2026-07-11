import React, { useState, useEffect } from 'react';
import { FaUtensils, FaSpinner } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setMyShopData } from '../redux/ownerSlice';
import { serverUrl } from '../main';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; 

const EditItem = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { itemId } = useParams();

    const [currentItem, setCurrentItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [name, setName] = useState("");
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

    useEffect(() => {
        const handleGetItemById = async () => {
            try {
                setIsLoading(true);
                const result = await axios.get(`${serverUrl}/api/item/get-by-id/${itemId}`, { withCredentials: true });
                setCurrentItem(result.data);
            } catch (error) {
                console.log("Error fetching item by ID:", error);
                toast.error("Failed to load item details"); 
            } finally {
                setIsLoading(false);
            }
        }
        handleGetItemById();
    }, [itemId]);

    useEffect(() => {
        if (currentItem) {
            setName(currentItem.name || '');
            setPrice(currentItem.price || 0);
            setCategory(currentItem.category || '');
            setFoodType(currentItem.foodType || 'veg');
            setFrontendImage(currentItem.image || '');
        }
    }, [currentItem]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!category) {
            return toast.error("Please select a category");
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading("Updating item..."); 
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("category", category);
            formData.append("foodType", foodType);
            formData.append("price", price);
            
            if (backendImage) {
                formData.append("image", backendImage);
            }

            const result = await axios.put(`${serverUrl}/api/item/edit-item/${itemId}`, formData, {
                withCredentials: true
            });

            dispatch(setMyShopData(result.data));
            
            toast.success("Item Updated Successfully!", { id: loadingToast }); 
            navigate('/home'); 
        } catch (error) {
            console.log(error);
            const message = error.response?.data?.message || "Something went wrong";
            toast.error(message, { id: loadingToast }); 
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-[#fff9f6]">
                <FaSpinner className="animate-spin text-[#ff4d2d] text-4xl mb-4" />
                <p className="text-gray-600 font-medium">Fetching item details...</p>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-[#fff9f6] flex justify-center items-center p-4 py-10'>
            <div className='w-full max-w-md bg-white shadow-lg rounded-2xl p-8 border border-gray-100'>
                <div className='flex flex-col items-center text-center mb-6'>
                    <div className='bg-orange-50 p-4 rounded-full mb-2'>
                        <FaUtensils className='text-[#ff4d2d] w-8 h-8' />
                    </div>
                    <h2 className='text-2xl font-bold text-gray-800'>Edit Food Item</h2>
                </div>

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                        <label className='block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-tight'>Name</label>
                        <input 
                            type="text" 
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white'
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            required
                        />
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-tight'>Food Image</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            className='w-full px-2 py-1 border rounded-lg text-sm text-gray-500 file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700'
                            onChange={handleImage}
                        />
                        {frontendImage && (
                            <div className='mt-3 w-full h-44 overflow-hidden rounded-lg border border-gray-100 shadow-sm'>
                                <img src={frontendImage} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-tight'>Price</label>
                        <input 
                            type="number" 
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500'
                            onChange={(e) => setPrice(e.target.value)}
                            value={price}
                            required
                        />
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-tight'>Category</label>
                        <select 
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white text-sm'
                            onChange={(e) => setCategory(e.target.value)}
                            value={category}
                            required
                        >
                            <option value="">Select Category</option>
                            {categories.map((cate, index) => (
                                <option value={cate} key={index}>{cate}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-tight'>Food Type</label>
                        <select 
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white text-sm'
                            onChange={(e) => setFoodType(e.target.value)}
                            value={foodType}
                        >
                            <option value="veg">Veg</option>
                            <option value="non veg">Non Veg</option>
                        </select>
                    </div>

                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full text-white py-3 rounded-lg font-bold shadow-md transition-all mt-2 flex justify-center items-center gap-2 ${
                            isSubmitting ? 'bg-orange-400 cursor-not-allowed' : 'bg-[#ff4d2d] hover:bg-orange-600'
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <FaSpinner className="animate-spin" /> Saving Changes...
                            </>
                        ) : (
                            'Update Item'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditItem;
