import { configureStore } from '@reduxjs/toolkit'
import userSlice from './user.slice'
export const store = configureStore({
    reducer: {
        User: userSlice
    },
    devTools: true
    
})
console.log("Store initialized:", store.getState());