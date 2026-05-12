import { createSlice } from "@reduxjs/toolkit";

const ownerSlice = createSlice({
  name: "owner",
  initialState: {
    myShopData: null,
    loading: true, // Start as true to prevent "Add Shop" flicker
  },
  reducers: {
    setMyShopData: (state, action) => {
      // Ensure we extract the shop object if nested
      state.myShopData = action.payload?.shop || action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setMyShopData, setLoading } = ownerSlice.actions;
export default ownerSlice.reducer;