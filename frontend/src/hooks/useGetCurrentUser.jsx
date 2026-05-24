import axios from 'axios'
import { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch } from 'react-redux'
import { setUserData, setLoading } from '../redux/user.Slice'

function useGetCurrentUser() {
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Enforce the loading barrier before kicking off our async call
        dispatch(setLoading(true))

        const result = await axios.get(`${serverUrl}/api/user/current`, {
          withCredentials: true,
        })

        console.log("API Response:", result.data)
        
        const userData = result.data.user || result.data
        dispatch(setUserData(userData))

      } catch (error) {
        console.error("Error fetching current user:", error)
        // If 401 or network error happens, turn off loading and clean down any partial state
        dispatch(setUserData(null)) 
      }
    }

    fetchUser()
  }, [dispatch]) 
}

export default useGetCurrentUser