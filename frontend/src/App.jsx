import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom' // Added Navigate
import { Toaster } from 'react-hot-toast'
import SignUp from './pages/signUp'
import SignIn from './pages/signIn'
import ForgotPassword from './pages/forgotPassword'

export const serverUrl = 'http://localhost:8000'

function App() {
  return (
    <>
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
      
      <Routes>
        {/* Fix: Define the root path */}
        <Route path="/" element={<Navigate to="/signin" />} />
        
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        {/* Keeping your alias just in case */}
        <Route path="/sign-in" element={<SignIn />} /> 
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Optional: Catch-all route for 404 errors */}
        <Route path="*" element={<div className="flex items-center justify-center h-screen">404 - Page Not Found</div>} />
      </Routes>
    </>
  )
}

export default App