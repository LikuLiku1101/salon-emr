import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative flex flex-col items-center">
        {/* Main Spinner Ring */}
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-zinc-100 border-t-[#9515B3] shadow-sm"></div>
        
        {/* Inner Pulsing Circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 animate-pulse rounded-full bg-[#18CC8E]/80"></div>
        </div>

        {/* Loading Text */}
        <p className="mt-6 text-sm font-medium tracking-widest text-[#9515B3] uppercase animate-pulse">
          Loading
        </p>
      </div>
    </div>
  );
}
