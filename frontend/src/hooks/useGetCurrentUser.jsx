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
        dispatch(setLoading(true))

        const result = await axios.get(`${serverUrl}/api/user/current`, {
          withCredentials: true,
        })

        console.log("API Response:", result.data)
        
        const userData = result.data.user || result.data
        dispatch(setUserData(userData))

      } catch (error) {
        console.error("Error fetching current user:", error)
        dispatch(setUserData(null)) 
      }
    }

    fetchUser()
  }, [dispatch]) 
}

export default useGetCurrentUser
