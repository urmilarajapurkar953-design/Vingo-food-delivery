import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentCity, setCurrentState, setCurrentAddress } from '../redux/user.Slice'

function useGetCity() {
  const dispatch = useDispatch()
  const { currentCity } = useSelector(state => state.user)

  useEffect(() => {
    // Only run if we don't have a city yet
    if (currentCity) return;

    if (!navigator.geolocation) {
      dispatch(setCurrentCity("")); // Set to empty string, not "Unknown"
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const result = await axios.get(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${import.meta.env.VITE_GEOAPIKEY}`
        )

        const data = result?.data?.results?.[0];
        // If Geoapify fails, use an empty string so the backend returns "all" shops
        const cityName = data?.city || data?.village || ""; 
        
        dispatch(setCurrentCity(cityName));
        dispatch(setCurrentState(data?.state || ""));
        dispatch(setCurrentAddress(data?.formatted || ""));

      } catch (error) {
        console.error("Error fetching city:", error);
        dispatch(setCurrentCity("")); 
      }
    }, () => {
      dispatch(setCurrentCity("")); // If user denies, set to empty to show all shops
    });
  }, [dispatch]); // Removed currentCity from dependencies to prevent loops
}

export default useGetCity