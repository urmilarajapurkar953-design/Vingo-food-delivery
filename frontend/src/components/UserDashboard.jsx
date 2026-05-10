import React, { useRef } from 'react'
import Nav from './Nav.jsx'
import CategoryCard from './CategoryCard.jsx'
import { categories } from '../category.js'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa' 

function UserDashboard() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (direction === 'left') {
      current.scrollBy({ left: -400, behavior: 'smooth' });
    } else {
      current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <div className='w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto'>
      <Nav />
      
      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px] mt-8">
        <h1 className='text-gray-800 text-2xl sm:text-3xl font-bold px-2'>
          Inspiration for your first order
        </h1>

        {/* Main Slider Container */}
        <div className='w-full relative group'>
          
          {/* Left Button - Hidden on small screens, shown on hover/large */}
          <button 
            onClick={() => scroll('left')}
            className='absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white shadow-xl border border-gray-100 text-gray-800 hover:bg-[#ff4d2d] hover:text-white transition-all active:scale-90 hidden md:flex items-center justify-center'
          >
            <FaChevronLeft size={20} />
          </button>

          {/* Scroll Container */}
          <div 
            ref={scrollRef}
            className='w-full flex overflow-x-auto gap-6 py-4 no-scrollbar scroll-smooth px-2'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories && categories.length > 0 ? (
                categories.map((cate, index) => (
                  <CategoryCard data={cate} key={index} />
                ))
            ) : (
                <p className="text-gray-500">Loading categories...</p>
            )}
          </div>

          {/* Right Button */}
          <button 
            onClick={() => scroll('right')}
            className='absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white shadow-xl border border-gray-100 text-gray-800 hover:bg-[#ff4d2d] hover:text-white transition-all active:scale-90 hidden md:flex items-center justify-center'
          >
            <FaChevronRight size={20} />
          </button>

        </div>
      </div>
    </div>
  )
}

export default UserDashboard