import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import SignUp from './pages/signUp';
import SignIn from './pages/signIn';
import ForgotPassword from './pages/forgotPassword';
import Home from './pages/Home';
import Nav from './components/Nav';
import useGetCurrentUser from './hooks/useGetCurrentUser';
import { useSelector } from 'react-redux';
import useGetCity from './hooks/useGetCity';
import useGetMyShop from './hooks/useGetMyShop';
import CreateEditShop from './pages/CreateEditShop';
import { useLocation } from 'react-router-dom';
import AddItem from './pages/AddItem';
import EditItem from './pages/EditItem';
import Cart from './pages/Cart';
import CheckOut from './pages/CheckOut';
import OrderPlaced from './pages/OrderPlaced'; 
import UserOrderPage from './pages/UserOrderPage';
import OwnerOrderPage from './pages/OwnerOrderPage';

export const serverUrl = 'http://localhost:8000';

function App() {
  const location = useLocation();
  const hideNavPaths = ['/create-edit-shop', '/checkout', '/order-placed', '/my-orders', '/dashboard/orders'];
  useGetCurrentUser(); 
  useGetCity();
  useGetMyShop();
  
  // Your user data profile is extracted here as 'userData'
  const { userData } = useSelector((state) => state.user || {});

  return (
    <>
      <Toaster />
      
      {/* 1. userData: User must be logged in
          2. !hideNavPaths.includes(...): Current page must NOT be /create-edit-shop or /checkout
      */}
      {userData && !hideNavPaths.includes(location.pathname) && <Nav />} 

      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        
        {/* If no userData, show Auth pages; otherwise go Home */}
        <Route path="/signup" element={!userData ? <SignUp /> : <Navigate to="/home" />} />
        <Route path="/signin" element={!userData ? <SignIn /> : <Navigate to="/home" />} />
        
        {/* If userData exists, show Home; otherwise go to Signin */}
        <Route path="/home" element={userData ? <Home /> : <Navigate to="/signin" />} />
        <Route path="/create-edit-shop" element={userData ? <CreateEditShop /> : <Navigate to="/signin" />} />
        <Route path="/add-item" element={userData ? <AddItem /> : <Navigate to="/signin" />} />
        <Route path="/edit-item/:itemId" element={userData ? <EditItem /> : <Navigate to="/signin" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={userData ? <CheckOut /> : <Navigate to="/signin" />} />
        <Route path="/order-placed" element={userData ? <OrderPlaced /> : <Navigate to="/signin" />} />
        
        {/* FIXED: Replaced 'currentUser' with 'userData' so it references your active Redux state */}
        <Route path="/my-orders" element={userData ? <UserOrderPage currentUser={userData} /> : <Navigate to="/signin" />} />
        <Route path="/dashboard/orders" element={userData ? <OwnerOrderPage /> : <Navigate to="/signin" />} />

        <Route path="*" element={<div>404 - Not Found</div>} />
      </Routes>
    </>
  );
}

export default App;