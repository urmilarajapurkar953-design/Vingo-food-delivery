import { configureStore } from '@reduxjs/toolkit'
import userSlice from './user.Slice'
import ownerSlice from './ownerSlice'
// 1. You MUST import the mapSlice reducer here
import mapSlice from './mapSlice' 

export const store = configureStore({
    reducer: {
        user: userSlice,
        owner: ownerSlice,
        map: mapSlice // Now this will work
    },
    devTools: true
})

console.log("Store initialized:", store.getState());