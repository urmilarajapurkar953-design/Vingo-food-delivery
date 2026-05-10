import React from 'react';
import { FaPen, FaTrash } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // FIXED: Added missing import
import { setMyShopData } from '../redux/ownerSlice';
import { serverUrl } from '../main'; // FIXED: Added missing import
import { toast } from 'react-hot-toast'; // Added for feedback

const OwnerItemCard = (props) => {
    const itemData = props.data || props.item || props;
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleDelete = async () => {
        // FIXED: Added a confirmation so you don't delete by mistake
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        const toastId = toast.loading("Deleting item...");
        try {
            // FIXED: Changed Data._id to itemData._id
            const result = await axios.get(`${serverUrl}/api/item/delete/${itemData._id}`, { 
                withCredentials: true 
            });

            // FIXED: Your backend now returns the full shop object, update Redux
            dispatch(setMyShopData(result.data.shop || result.data));
            toast.success("Item deleted successfully", { id: toastId });
            
        } catch (error) {
            console.log("Error deleting item:", error);
            toast.error("Failed to delete item", { id: toastId });
        }
    }

    if (!itemData || !itemData.name) {
        return null; 
    }

    const { name, category, foodType, price, image } = itemData;

    return (
        <div className='w-full max-w-3xl bg-white shadow-sm rounded-2xl overflow-hidden border-2 border-transparent flex items-center p-3 sm:p-4 hover:border-[#ff4d2d] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 mb-4 cursor-default group'>
            
            {/* Left Side: Image */}
            <div className='w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100 shadow-inner'>
                <img 
                    src={image} 
                    alt={name} 
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500' 
                />
            </div>

            {/* Right Side: Content */}
            <div className='ml-4 sm:ml-6 flex-grow flex flex-col justify-between self-stretch'>
                <div>
                    <div className='flex justify-between items-start'>
                        <h3 className='text-lg sm:text-xl font-bold text-gray-800 group-hover:text-[#ff4d2d] transition-colors capitalize leading-tight'>
                            {name}
                        </h3>
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded-md font-bold tracking-wider border ${
                            foodType?.toLowerCase() === 'veg' 
                            ? 'bg-green-50 text-green-600 border-green-200' 
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                            {foodType}
                        </span>
                    </div>
                    
                    <div className='mt-2 space-y-1 text-sm'>
                        <p className='text-gray-500'>
                            <span className='font-medium text-gray-400 text-xs uppercase tracking-tight'>Category</span>
                            <br />
                            <span className='text-gray-700 font-semibold'>{category}</span>
                        </p>
                    </div>
                </div>

                <div className='flex justify-between items-end mt-2'>
                    <p className='text-[#ff4d2d] font-extrabold text-xl sm:text-2xl'>
                        <span className='text-sm mr-0.5'>₹</span>{price}
                    </p>

                    <div className='flex items-center gap-3 sm:gap-5'>
                        <button 
                            className='p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm'
                            title="Edit Item"
                            onClick={() => navigate(`/edit-item/${itemData._id}`)}
                        >
                            <FaPen size={14} />
                        </button>
                        <button 
                            className='p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-[#ff4d2d] transition-all shadow-sm'
                            title="Delete Item"
                            onClick={handleDelete} // FIXED: Removed unnecessary parameter
                        >
                            <FaTrash size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerItemCard;