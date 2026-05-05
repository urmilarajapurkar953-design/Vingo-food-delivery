import React, { useState } from 'react';
import { IoIosArrowRoundBack } from "react-icons/io";
import { FaUtensils } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { setMyShopData } from '../redux/ownerSlice';
import axios from 'axios';

const serverUrl = "http://localhost:8000";

function CreateEditShop() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    
    const { userData, currentCity, currentState, currentAddress } = useSelector((state) => state.user || {});
    const { myShopData } = useSelector((state) => state.owner || {});

    // Form State
    const [formData, setFormData] = useState({
        name: myShopData?.name || '',
        // Use the variables we just pulled from Redux
        city: myShopData?.city || currentCity || '',
        state: myShopData?.state || currentState || '',
        address: myShopData?.address || currentAddress || '',
    });

    const [imagePreview, setImagePreview] = useState(myShopData?.image || null);
    const [imageFile, setImageFile] = useState(null);

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
        try {
            // 2. Changed variable name to 'data' to avoid shadowing your state 'formData'
            const data = new FormData();
            data.append("name", formData.name);
            data.append("city", formData.city);
            data.append("state", formData.state);
            data.append("address", formData.address);
            
            if (imageFile) {
                data.append("image", imageFile);
            }

            // 3. Use the new 'data' variable here
            const result = await axios.post(`${serverUrl}/api/shop/create-edit`, data, { 
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" } // Good practice for file uploads
            });

            dispatch(setMyShopData(result.data));
            console.log("Shop created/updated successfully:", result.data);
            navigate('/dashboard'); // Optional: redirect after success

        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    const inputStyle = "w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-[#ff4d2d] transition-colors duration-200 text-gray-700";

    return (
        <div className='flex justify-center flex-col items-center p-6 bg-gradient-to-br from-orange-50 relative to-white min-h-screen'>
            
            {/* Back Button */}
            <div 
                className='absolute top-[20px] left-[20px] z-[10] mb-[10px] cursor-pointer'
                onClick={() => navigate(-1)}
            >
                <IoIosArrowRoundBack size={45} className='text-[#ff4d2d]' />
            </div>

            {/* Form Container */}
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
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g. Krishna Bakery"
                            className={inputStyle}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Shop Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImage}
                            className={`${inputStyle} file:hidden cursor-pointer`}
                        />
                        {imagePreview && (
                            <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                placeholder="City"
                                className={inputStyle}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">State</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                placeholder="State"
                                className={inputStyle}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Full Address</label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Complete address with landmark"
                            rows="2"
                            className={`${inputStyle} resize-none`}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#ff4d2d] cursor-pointer text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[#e64429] hover:shadow-orange-200 transition-all duration-300 mt-2"
                    >
                        Save Shop Details
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateEditShop;