import React, { useState, useEffect } from 'react';
import { IoIosArrowRoundBack } from "react-icons/io";
import { FaUtensils, FaSpinner } from "react-icons/fa"; 
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setMyShopData } from '../redux/ownerSlice';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const serverUrl = "http://localhost:8000";

function CreateEditShop() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { currentCity, currentState, currentAddress } = useSelector((state) => state.user || {});
    const { myShopData } = useSelector((state) => state.owner || {});

    const [formData, setFormData] = useState({
        name: '',
        city: '',
        state: '',
        address: '',
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (myShopData) {
            setFormData({
                name: myShopData.name || '',
                city: myShopData.city || '',
                state: myShopData.state || '',
                address: myShopData.address || '',
            });
            setImagePreview(myShopData.image || null);
        } else {
            setFormData(prev => ({
                ...prev,
                city: currentCity || '',
                state: currentState || '',
                address: currentAddress || '',
            }));
        }
    }, [myShopData, currentCity, currentState, currentAddress]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(myShopData ? "Updating shop..." : "Creating shop...");

    const data = new FormData();
    data.append("name", formData.name);
    data.append("city", formData.city);
    data.append("state", formData.state);
    data.append("address", formData.address);
    
    if (imageFile) {
        data.append("image", imageFile);
    }

    try {
        const result = await axios.post(`${serverUrl}/api/v1/shops/create-edit`, data, { 
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" }
        });

        const updatedShopBase = result.data.shop || result.data;

        const finalData = {
            ...updatedShopBase,
            _id: updatedShopBase._id || updatedShopBase.id || myShopData?._id,
            items: (updatedShopBase.items && updatedShopBase.items.length > 0 && typeof updatedShopBase.items[0] === 'object') 
                ? updatedShopBase.items 
                : (myShopData?.items || [])
        };

        dispatch(setMyShopData(finalData));
        
        toast.success(myShopData ? "Shop updated successfully!" : "Shop created successfully!", { id: toastId });

        navigate('/home'); 

    } catch (error) {
        console.error("Form Submission Error:", error.response?.data || error.message);
        const errorMsg = error.response?.data?.message || "Failed to save shop";
        toast.error(errorMsg, { id: toastId });
    } finally {
        setLoading(false);
    }
};
    const inputStyle = "w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-[#ff4d2d] transition-colors duration-200 text-gray-700";

    return (
        <div className='flex justify-center flex-col items-center p-6 bg-gradient-to-br from-orange-50 relative to-white min-h-screen'>
            <div className='absolute top-[20px] left-[20px] z-[10] cursor-pointer' onClick={() => navigate(-1)}>
                <IoIosArrowRoundBack size={45} className='text-[#ff4d2d]' />
            </div>

            <div className='max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 border border-orange-100'>
                <div className='flex flex-col items-center mb-6'>
                    <div className='bg-orange-100 p-4 rounded-full mb-4'>
                        <FaUtensils className='text-[#ff4d2d] w-12 h-12' />
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900">
                        {myShopData ? "Edit Shop" : "Add Shop"} 
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Shop Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={inputStyle} required />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Shop Image</label>
                        <input type="file" accept="image/*" name="image" onChange={handleImage} className={`${inputStyle} file:hidden cursor-pointer`} />
                        {imagePreview && (
                            <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" className={inputStyle} required />
                        <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="State" className={inputStyle} required />
                    </div>

                    <textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Address" rows="2" className={`${inputStyle} resize-none`} required />

                    <button 
                        type="submit" 
                        disabled={loading} 
                        className={`w-full flex items-center justify-center gap-2 ${loading ? 'bg-orange-300' : 'bg-[#ff4d2d] hover:bg-[#e64429]'} text-white font-bold py-3 rounded-xl shadow-lg transition-all duration-300 mt-2`}
                    >
                        {loading ? (
                            <>
                                <FaSpinner className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            myShopData ? "Update Shop Details" : "Save Shop Details"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateEditShop;
