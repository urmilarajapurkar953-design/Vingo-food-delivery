import axios from 'axios'
import { useEffect } from 'react'
import { serverUrl } from '../main' // Ensure this matches your server URL location
import { useDispatch } from 'react-redux'
import { setMyShopData } from '../redux/ownerSlice';

function useGetMyShop() {
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/shop/get-my`, {
          withCredentials: true,
        })

        console.log("API Response:", result.data)
        
        // 1. Safely handle the data using Optional Chaining (?.)
        // 2. If result.data is null/undefined, default to an empty object {}
        const shopData = result.data?.shop || result.data || {};
        
        dispatch(setMyShopData(shopData))

      } catch (error) {
        console.error("Error fetching shop data:", error)
        // Set to empty object or null depending on how your UI handles "no shop"
        dispatch(setMyShopData({})) 
      }
    }

    fetchShop()
  }, [dispatch]) 
}

export default useGetMyShop