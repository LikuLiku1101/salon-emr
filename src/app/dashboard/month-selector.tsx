'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function MonthSelector({ currentYear, currentMonth }: { currentYear: number, currentMonth: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const options = [];
  const today = new Date();
  
  // 直近（前後2ヶ月）のオプションを作成
  const recentOptions = [];
  for (let i = -2; i <= 2; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    recentOptions.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  // それ以外のオプションを作成（2年前〜1年後まで）
  const otherOptions = [];
  for (let y = today.getFullYear() - 2; y <= today.getFullYear() + 1; y++) {
    for (let m = 1; m <= 12; m++) {
      if (!recentOptions.find(o => o.year === y && o.month === m)) {
        otherOptions.push({ year: y, month: m });
      }
    }
  }

  const selectedValue = `${currentYear}-${currentMonth}`;
  const isRecentSelected = recentOptions.some(o => `${o.year}-${o.month}` === selectedValue);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [y, m] = val.split('-');
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', y);
    params.set('month', m);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      {/* 直近の月プルダウン */}
      <select 
        className="h-10 bg-white border border-gray-200 rounded-lg px-4 font-bold text-sm focus:ring-2 focus:ring-[var(--salon-purple)]/20 outline-none text-gray-700 shadow-sm"
        value={isRecentSelected ? selectedValue : ""}
        onChange={handleChange}
      >
        {!isRecentSelected && (
          <option value="" disabled>過去・未来の月を表示中</option>
        )}
        {recentOptions.map(o => (
          <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
            {o.year}年{o.month}月
          </option>
        ))}
      </select>

      {/* それ以外の月プルダウン */}
      <select 
        className="h-10 bg-white border border-gray-200 rounded-lg px-3 font-bold text-sm focus:ring-2 focus:ring-[var(--salon-purple)]/20 outline-none text-gray-500 shadow-sm"
        value={!isRecentSelected ? selectedValue : ""}
        onChange={handleChange}
      >
        <option value="" disabled>その他の月...</option>
        {otherOptions.map(o => (
          <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
            {o.year}年{o.month}月
          </option>
        ))}
      </select>
    </div>
  );
}
