import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/85 backdrop-blur-md animate-in fade-in duration-150">
      {/* 画面上部のプログレスバー */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-purple-100/80 overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-[var(--salon-purple)]/20 via-[var(--salon-purple)] to-[var(--salon-purple)]/20 animate-pulse" />
      </div>

      {/* 中央のミニマルでモダンなスピナー */}
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative w-14 h-14 flex items-center justify-center">
          {/* 外側の淡いリング */}
          <div className="absolute inset-0 rounded-full border-2 border-[var(--salon-purple)]/15" />
          {/* 回転する極細リング */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--salon-purple)] border-r-[var(--salon-purple)]/40 animate-spin" />
          {/* 内側の柔らかなグローとSイニシャル */}
          <div className="w-9 h-9 rounded-full bg-[var(--salon-purple)]/[0.06] flex items-center justify-center">
            <span className="text-sm font-black tracking-tighter text-[var(--salon-purple)] select-none">
              S
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-black tracking-[0.28em] text-gray-700 uppercase">
            SHINE
          </span>
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-[var(--salon-purple)]/60 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 rounded-full bg-[var(--salon-purple)]/60 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 rounded-full bg-[var(--salon-purple)]/60 animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
