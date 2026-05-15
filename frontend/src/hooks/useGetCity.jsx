import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setCurrentCity, setCurrentState, setCurrentAddress } from '../redux/user.Slice';
import { setLocation, setAddress } from '../redux/mapSlice';

const useGetCity = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;

          dispatch(setLocation({ lat: latitude, lon: longitude }));

          const response = await axios.get(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${import.meta.env.VITE_GEOAPIKEY}`
          );

          // FIX: Geoapify with &format=json uses 'results', not 'features'
          if (response.data && response.data.results && response.data.results.length > 0) {
            const addressData = response.data.results[0]; // In JSON format, properties are at the top level
            const fullAddress = addressData.formatted;

            dispatch(setCurrentCity(addressData.city));
            dispatch(setCurrentState(addressData.state));
            dispatch(setCurrentAddress(fullAddress)); 
            dispatch(setAddress(fullAddress));        
          }
        });
      } catch (error) {
        console.error("Error fetching city:", error);
      }
    };

    fetchLocation();
  }, [dispatch]);
};

export default useGetCity;