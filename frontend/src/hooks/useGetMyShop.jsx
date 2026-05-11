import { useEffect } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setMyShopData } from '../redux/ownerSlice';
import { serverUrl } from '../App';

const useGetMyShop = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchMyShop = async () => {
            try {
                // Update this line to include /v1/shops
                const response = await axios.get(`${serverUrl}/api/v1/shops/get-my`, {
                    withCredentials: true
                });
                
                if (response.data) {
                    dispatch(setMyShopData(response.data));
                }
            } catch (error) {
                // This is where your console error was coming from
                console.error("Error fetching shop data:", error);
            }
        };

        fetchMyShop();
    }, [dispatch]);
};

export default useGetMyShop;