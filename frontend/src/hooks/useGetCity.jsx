import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setCurrentCity, setCurrentState, setCurrentAddress } from '../redux/user.Slice';
import { setLocation, setAddress } from '../redux/mapSlice';

const useGetCity = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // 🌟 Initialize with cached local storage data to make loading instantaneous
    const cachedCity = localStorage.getItem('vingo_cached_city');
    const cachedAddress = localStorage.getItem('vingo_cached_address');
    const cachedState = localStorage.getItem('vingo_cached_state');

    if (cachedCity) dispatch(setCurrentCity(cachedCity));
    if (cachedAddress) {
      dispatch(setCurrentAddress(cachedAddress));
      dispatch(setAddress(cachedAddress));
    }
    if (cachedState) dispatch(setCurrentState(cachedState));

    const fetchLocation = async () => {
      try {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;

          dispatch(setLocation({ lat: latitude, lon: longitude }));

          const response = await axios.get(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${import.meta.env.VITE_GEOAPIKEY}`
          );

          if (response.data && response.data.results && response.data.results.length > 0) {
            const addressData = response.data.results[0]; 
            const fullAddress = addressData.formatted;
            const finalCity = addressData.city || addressData.county || "";

            // Update Redux
            dispatch(setCurrentCity(finalCity));
            dispatch(setCurrentState(addressData.state));
            dispatch(setCurrentAddress(fullAddress)); 
            dispatch(setAddress(fullAddress));   
            
            // 🌟 Save to cache for the user's next visit
            if (finalCity) localStorage.setItem('vingo_cached_city', finalCity);
            if (fullAddress) localStorage.setItem('vingo_cached_address', fullAddress);
            if (addressData.state) localStorage.setItem('vingo_cached_state', addressData.state);
          }
        }, (geoErr) => {
          console.warn("Geolocation access denied/failed:", geoErr);
          // Fallback if user blocks location permissions but cache is empty
          if (!localStorage.getItem('vingo_cached_city')) {
            dispatch(setCurrentCity("Unknown Location"));
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