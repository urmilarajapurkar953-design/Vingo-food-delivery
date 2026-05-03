import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setCity } from '../redux/user.slice' 

function useGetCity() {
  const dispatch = useDispatch()
  // Pull city from state to check if we already have it
  const { userData, city } = useSelector(state => state.User)

  useEffect(() => {
    // 1. If city already exists and isn't a placeholder, don't ask again.
    // This stops the browser from auto-blocking you for "spamming" requests.
    if (city && city !== "Unknown Location" && city !== "Location Denied") {
      return;
    }

    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser.");
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        
        const result = await axios.get(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${import.meta.env.VITE_GEOAPIKEY}`
        )

        const cityName = result?.data?.results?.[0]?.city || result?.data?.results?.[0]?.village || "Unknown Location";
        
        console.log("Detected City:", cityName);
        dispatch(setCity(cityName));

      } catch (error) {
        console.error("Error fetching city name:", error);
      }
    }, (error) => {
      console.error("Geolocation Error:", error.message);
      
      // 2. Set a fallback state so the UI knows permission was denied
      if (error.code === 1) { // PERMISSION_DENIED
        dispatch(setCity("Location Denied"));
      }
    }, geoOptions);
    
    // 3. Add 'city' to dependencies so the effect re-evaluates correctly
  }, [userData, dispatch, city]); 
}

export default useGetCity