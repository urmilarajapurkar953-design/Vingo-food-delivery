import { configureStore } from '@reduxjs/toolkit'
import userSlice from './user.slice'
import ownerSlice from './ownerSlice'

export const store = configureStore({
    reducer: {
        user: userSlice,
        owner: ownerSlice
    },
    devTools: true
    
})
console.log("Store initialized:", store.getState());