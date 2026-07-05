import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { serverUrl } from '../App';
import { setAddress ,setLocation } from '../redux/mapSlice';



function useUpdateLocation() {
    const dispatch = useDispatch();
    const { userData } = useSelector((state) => state.user);

    useEffect(() => {
        if (!userData?._id) return;
        const updateLocation = async (lat, lon) => {
            try {
                const result = await axios.post(`${serverUrl}/api/user/update-location`, { lat, lon }, {
                    withCredentials: true
                });
                console.log(result.data);
            } catch (error) {
                console.error("Error updating location:", error);
            }
        };

        const watchId = navigator.geolocation.watchPosition((pos) => {
            updateLocation(pos.coords.latitude, pos.coords.longitude);
        });

       
        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [userData]);
}

export default useUpdateLocation;
