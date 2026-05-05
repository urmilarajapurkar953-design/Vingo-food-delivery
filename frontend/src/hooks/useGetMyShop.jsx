import axios from 'axios'
import { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/user.slice'
import { setMyShopData } from '../redux/ownerSlice';

function useGetMyShop() {
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/shop/get-my`, {
          withCredentials: true,
        })

        // Check if your backend sends { user: {...} } or just {...}
        // If the console.log shows an object WITH a user property, use result.data.user
        console.log("API Response:", result.data)
        
        const userData = result.data.user || result.data
        dispatch(setMyShopData(userData))

      } catch (error) {
        // If unauthorized (401), ensure userData is null so app doesn't hang
        console.error("Error fetching current user:", error)
        dispatch(setMyShopData(null))
      }
    }

    fetchShop()
  }, [dispatch]) // Added dispatch to dependency array for best practice
}

export default useGetMyShop