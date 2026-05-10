import React from 'react'
import { useSelector } from 'react-redux'
import UserDashboard from '../components/UserDashboard'
import OwnerDashboard from '../components/OwnerDashboard'
import DeliveryBoy from '../components/DeliveryBoy'

function Home() {
  const { userData } = useSelector((state) => state.user);

  // 1. If still loading or fetch failed
  if (!userData) {
    
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-xl animate-pulse">Loading User Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-[100vw] min-h-[100vh] pt-[100px] flex flex-col items-center bg-[#fff9f6]">
      {userData.role === "user" && <UserDashboard />}
      {userData.role === "owner" && <OwnerDashboard />}
      {userData.role === "deliveryBoy" && <DeliveryBoy />}
    </div>
  );
}
export default Home