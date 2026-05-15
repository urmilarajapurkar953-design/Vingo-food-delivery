import { createSlice } from "@reduxjs/toolkit";

const mapSlice = createSlice({
  name: 'map', // Added name property
  initialState: {
    location: {
      lat: localStorage.getItem("mapLat") || null,
      lon: localStorage.getItem("mapLon") || null
    },
    address: localStorage.getItem("mapAddress") || null
  },
  reducers: {
    setLocation: (state, action) => {
      const { lat, lon } = action.payload;
      state.location.lat = lat;
      state.location.lon = lon;
      // Save to localStorage
      localStorage.setItem("mapLat", lat);
      localStorage.setItem("mapLon", lon);
    },
    setAddress: (state, action) => { // Fixed spelling to "setAddress"
      state.address = action.payload;
      localStorage.setItem("mapAddress", action.payload);
    }
  },
});

export const { setLocation, setAddress } = mapSlice.actions;
export default mapSlice.reducer;