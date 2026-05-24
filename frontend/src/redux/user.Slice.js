import { createSlice } from "@reduxjs/toolkit";

// 1. Get the cart from storage so it persists on refresh
const savedCart = localStorage.getItem("cartItem");

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    currentCity: null,
    currentState: null,
    currentAddress: null,
    loading: true, // Maintained as true for initial authentication fetch guard
    cartItem: savedCart ? JSON.parse(savedCart) : [] // 2. Initialize with saved data
  },
  reducers: {
    setUserData: (state, action) => { 
      state.userData = action.payload; 
      state.loading = false; // CRITICAL: Marks completion of fetch cycle
    },
    setLoading: (state, action) => {
      state.loading = action.payload; // Allows manual control over loading transitions
    },
    setCurrentCity: (state, action) => { state.currentCity = action.payload; },
    setCurrentState: (state, action) => { state.currentState = action.payload; },
    setCurrentAddress: (state, action) => { state.currentAddress = action.payload; },
    
    addToCart: (state, action) => {
      const item = action.payload;
      const existingItem = state.cartItem.find((i) => i._id === item._id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.cartItem.push({ ...item, quantity: 1 });
      }
      localStorage.setItem("cartItem", JSON.stringify(state.cartItem));
    },

    decrementQuantity: (state, action) => {
      const itemId = action.payload;
      const existingItem = state.cartItem.find((i) => i._id === itemId);
      if (existingItem) {
        if (existingItem.quantity > 1) {
          existingItem.quantity -= 1;
        } else {
          state.cartItem = state.cartItem.filter((i) => i._id !== itemId);
        }
      }
      localStorage.setItem("cartItem", JSON.stringify(state.cartItem));
    },

    removeFromCart: (state, action) => {
      state.cartItem = state.cartItem.filter((item) => item._id !== action.payload);
      localStorage.setItem("cartItem", JSON.stringify(state.cartItem));
    },

    clearCart: (state) => {
      state.cartItem = [];
      localStorage.removeItem("cartItem");
    }
  },
});

// 3. Destructuring and exporting actions securely
export const {
  setUserData,
  setLoading, // Added and exported to manage app authentication barrier cleanly
  setCurrentCity,
  setCurrentState,
  setCurrentAddress, 
  addToCart,
  decrementQuantity,
  removeFromCart,
  clearCart 
} = userSlice.actions;

export default userSlice.reducer;