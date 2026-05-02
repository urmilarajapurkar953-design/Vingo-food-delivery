import axios from 'axios'
import { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setUserData } from '../redux/user.slice'

function useGetCity() {
  const dispatch = useDispatch()
  const {userData}= useSelector(state=>state.User)
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      console.log(position)
      const latitude = position.coords.latitude
      const longitude = position.coords.longitude
      const result = await axios.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${import.meta.env.VITE_GEOAPIKEY}`)
      console.log(result.data.results[0].city)
      dispatch(setCity(result?.data.features[0].properties.city))
    })
  }, [userData])
}

export default useGetCity