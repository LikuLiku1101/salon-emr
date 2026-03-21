import React from 'react';
import Image from 'next/image';

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative flex flex-col items-center">
        {/* User Provided Loading GIF */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 overflow-hidden rounded-2xl">
          <Image 
            src="/loading.gif" 
            alt="Loading..." 
            fill
            unoptimized
            className="object-contain"
          />
        </div>
        
        {/* Optional: Simple brand text if needed, but keeping it clean for now */}
      </div>
    </div>
  );
}
