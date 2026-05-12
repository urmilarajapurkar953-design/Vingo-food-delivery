import React, { useState } from 'react';
import { FaUtensils, FaSpinner } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setMyShopData } from '../redux/ownerSlice';
import { serverUrl } from '../main';
import { toast } from 'react-hot-toast';
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
    const [loading, setLoading] = useState(false);

    const categories = ["Snacks", "Main Course", "Desserts", "Pizza", "Burgers", "Sandwiches", "South Indian", "North Indian", "Chinese", "Fast Food", "Others"];

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBackendImage(file);
            setFrontendImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading("Adding item...");
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("category", category);
            formData.append("foodType", foodType);
            formData.append("price", price);
            if (backendImage) formData.append("image", backendImage);

            const result = await axios.post(`${serverUrl}/api/item/add-item`, formData, { withCredentials: true });
            dispatch(setMyShopData(result.data.shop || result.data));
            toast.success("Success!", { id: toastId });
            navigate('/home');
        } catch (error) {
            toast.error("Failed to add item", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='min-h-screen bg-[#fff9f6] flex justify-center items-center p-4'>
            <div className='w-full max-w-md bg-white shadow-lg rounded-2xl p-8'>
                <h2 className='text-2xl font-bold text-center mb-6'>Add Food Item</h2>
                <form onSubmit={handleSubmit} className='space-y-4'>
                    <input type="text" placeholder='Item Name' className='w-full p-2 border rounded' onChange={(e) => setName(e.target.value)} required />
                    <input type="file" onChange={handleImage} className='w-full text-sm' />
                    {frontendImage && <img src={frontendImage} className='h-40 w-full object-cover rounded' />}
                    <input type="number" placeholder='Price' className='w-full p-2 border rounded' onChange={(e) => setPrice(e.target.value)} required />
                    <select className='w-full p-2 border rounded' onChange={(e) => setCategory(e.target.value)} required>
                        <option value="">Select Category</option>
                        {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                    <select className='w-full p-2 border rounded' onChange={(e) => setFoodType(e.target.value)}>
                        <option value="veg">Veg</option>
                        <option value="non veg">Non Veg</option>
                    </select>
                    <button type="submit" disabled={loading} className='w-full bg-[#ff4d2d] text-white py-3 rounded-lg font-bold'>
                        {loading ? <FaSpinner className="animate-spin mx-auto" /> : "Save Item"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddItem;