  import React, { useEffect } from 'react'
  import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
  import { Toaster } from 'react-hot-toast';
  import SignUp from './pages/signUp';
  import SignIn from './pages/signIn';
  import ForgotPassword from './pages/ForgotPassword';
  import Home from './pages/Home';
  import Nav from './components/Nav';
  import useGetCurrentUser from './hooks/useGetCurrentUser';
  import { useSelector } from 'react-redux';
  import useGetCity from './hooks/useGetCity';
  import useGetMyShop from './hooks/useGetMyShop';
  import CreateEditShop from './pages/CreateEditShop';
  import AddItem from './pages/AddItem';
  import EditItem from './pages/EditItem';
  import Cart from './pages/Cart';
  import CheckOut from './pages/CheckOut';
  import OrderPlaced from './pages/OrderPlaced'; 
  import UserOrderPage from './pages/UserOrderPage';
  import OwnerOrderPage from './pages/OwnerOrderPage';
  import useUpdateLocation from './hooks/useUpdateLocation';
  import DeliveryBoy from './components/DeliveryBoy';
  import { SocketProvider } from './context/SocketContext';
  import OrderTrackingPage from './pages/OrderTrackingPage';
  import ShopDetails from './components/ShopDetails'; 
  import SearchPage from './components/SearchPage';
  import DeliveryHistory from './pages/DeliveryHistory';

  export const serverUrl = "https://vingo-food-delivery-backend-tbhw.onrender.com";

  function App() {
    const location = useLocation();
    const navigate = useNavigate();
    
    const hideNavPaths = [
      '/create-edit-shop', 
      '/checkout', 
      '/order-placed', 
      '/my-orders', 
      '/dashboard/orders'
    ];

    useGetCurrentUser(); 
    useGetCity();
    useGetMyShop();
    useUpdateLocation();
    
    const { userData, loading } = useSelector((state) => state.user);

    // CRITICAL TYPO PATCH: Accommodates both "delivery" and your exact backend value "deliveryBoy"
    const userRoleCleaned = userData?.role?.toLowerCase() || userData?.user?.role?.toLowerCase() || "";
    const isDeliveryBoy = userRoleCleaned === "delivery" || userRoleCleaned === "deliveryboy";

    // Debug trace verification logs
    console.log("=== RIDER CONSOLE FIXED CHECK ===");
    console.log("Detected backend role raw value:", userData?.role);
    console.log("Matches evaluation rule now?:", isDeliveryBoy);

    useEffect(() => {
      if (!loading && userData && isDeliveryBoy && location.pathname === '/home') {
        console.log("🔄 Rerouting driver away from consumer landing view...");
        navigate('/delivery/dashboard', { replace: true });
      }
    }, [userData, loading, isDeliveryBoy, location.pathname, navigate]);

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 mt-4 font-semibold">Authenticating user console...</p>
        </div>
      );
    }

    // UPDATED: Dynamically checks explicit paths OR any URL path starting with your tracking engine route
    const shouldHideNav = hideNavPaths.includes(location.pathname) || location.pathname.startsWith('/order-tracking');

    return (
      <SocketProvider>
        {/* 🌟 FIXED: Custom styles injected to push alerts below your navigation bar */}
        <Toaster 
          position="top-center"
          containerStyle={{
            top: 95,          // Clear the navbar height cleanly 
            zIndex: 999999,   // Force stacking priority order over components
          }}
          toastOptions={{
            style: {
              zIndex: 999999, // Ensure individual toast blocks carry the layout override
            }
          }}
        />
        
        {userData && !shouldHideNav && <Nav />} 

        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          
          <Route path="/signup" element={!userData ? <SignUp /> : <Navigate to="/home" />} />
          <Route path="/signin" element={!userData ? <SignIn /> : <Navigate to="/home" />} />
          
          <Route 
            path="/home" 
            element={
              userData ? (
                isDeliveryBoy ? (
                  <Navigate to="/delivery/dashboard" replace />
                ) : (
                  <Home />
                )
              ) : (
                <Navigate to="/signin" />
              )
            } 
          />
          
          <Route path="/create-edit-shop" element={userData ? <CreateEditShop /> : <Navigate to="/signin" />} />
          <Route path="/add-item" element={userData ? <AddItem /> : <Navigate to="/signin" />} />
          <Route path="/edit-item/:itemId" element={userData ? <EditItem /> : <Navigate to="/signin" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={userData ? <CheckOut /> : <Navigate to="/signin" />} />
          <Route path="/order-placed" element={userData ? <OrderPlaced /> : <Navigate to="/signin" />} />
          
          <Route path="/my-orders" element={userData ? <UserOrderPage currentUser={userData} /> : <Navigate to="/signin" />} />
          <Route path="/dashboard/orders" element={userData ? <OwnerOrderPage currentOwnerId={userData?._id} /> : <Navigate to="/signin" />} />
          <Route path="/delivery/dashboard" element={isDeliveryBoy ? <DeliveryBoy /> : <Navigate to="/signin" />} />
          <Route path="/order-tracking/:masterOrderId/:subOrderId" element={<OrderTrackingPage />} />
          <Route path="/shop/:shopId" element={<ShopDetails />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/delivery-history" element={<DeliveryHistory />} />

          <Route path="*" element={<div>404 - Not Found</div>} />
        </Routes>
      </SocketProvider>
    );
  }

  export default App;
