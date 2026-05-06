'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function MonthSelector({ currentYear, currentMonth }: { currentYear: number, currentMonth: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const options = [];
  const today = new Date();
  for (let y = today.getFullYear() - 1; y <= today.getFullYear() + 1; y++) {
    for (let m = 1; m <= 12; m++) {
      options.push({ year: y, month: m });
    }
  }

  // 未来すぎるところはカットしてもいいが、一応全部出す
  return (
    <select 
      className="h-10 bg-white border border-gray-200 rounded-lg px-4 font-bold text-sm focus:ring-2 focus:ring-[var(--salon-purple)]/20 outline-none text-gray-700 shadow-sm"
      value={`${currentYear}-${currentMonth}`}
      onChange={(e) => {
        const [y, m] = e.target.value.split('-');
        const params = new URLSearchParams(searchParams.toString());
        params.set('year', y);
        params.set('month', m);
        router.push(`?${params.toString()}`);
      }}
    >
      {options.map(o => (
        <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
          {o.year}年{o.month}月
        </option>
      ))}
    </select>
  );
}
