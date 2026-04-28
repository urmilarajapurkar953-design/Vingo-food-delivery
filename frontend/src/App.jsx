import React from 'react'
import { Route, Routes } from 'react-router-dom'
import signUp from './pages/signUp'
import signIn from './pages/signIn'

const App = () => {
  return (
    <Routes>
      <Route path="/signup" element={<signUp />} />
      <Route path="/signin" element={<signIn />} />
      
    </Routes>
  )
}

export default App
