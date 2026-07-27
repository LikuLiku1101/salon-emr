"use client";

import { useState, useEffect } from "react";
import { Search, FileText, MessageCircle, Filter, Clock, ArrowDownAZ, CalendarClock } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Customer {
  id: string;
  name: string;
  name_kana: string;
  gender: string | null;
  line_user_id?: string;
  contracts: Array<{
    id: string;
    course_name: string;
    status: string;
    installments: number;
    created_at: string;
  }>;
  treatments: Array<{
    contract_id: string;
    status: string;
    visit_date?: string;
    visit_time?: string;
  }>;
}

const KANA_ROWS = ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ"];

const getKanaRow = (kana: string | null): string => {
  if (!kana) return "その他";
  const first = kana.charAt(0);
  
  const map: Record<string, string> = {
    // あ行
    'あ': 'あ', 'い': 'あ', 'う': 'あ', 'え': 'あ', 'お': 'あ',
    'ア': 'あ', 'イ': 'あ', 'ウ': 'あ', 'エ': 'あ', 'オ': 'あ',
    // か行
    'か': 'か', 'き': 'か', 'く': 'か', 'け': 'か', 'こ': 'か',
    'が': 'か', 'ぎ': 'か', 'ぐ': 'か', 'げ': 'か', 'ご': 'か',
    'カ': 'か', 'キ': 'か', 'ク': 'か', 'ケ': 'か', 'コ': 'か',
    'ガ': 'か', 'ギ': 'か', 'グ': 'か', 'ゲ': 'か', 'ゴ': 'か',
    // さ行
    'さ': 'さ', 'し': 'さ', 'す': 'さ', 'せ': 'さ', 'そ': 'さ',
    'ざ': 'さ', 'じ': 'さ', 'ず': 'さ', 'ぜ': 'さ', 'ぞ': 'さ',
    'サ': 'さ', 'シ': 'さ', 'ス': 'さ', 'セ': 'さ', 'ソ': 'さ',
    'ザ': 'さ', 'ジ': 'さ', 'ズ': 'さ', 'ゼ': 'さ', 'ゾ': 'さ',
    // た行
    'た': 'た', 'ち': 'た', 'つ': 'た', 'て': 'た', 'と': 'た',
    'だ': 'た', 'ぢ': 'た', 'づ': 'た', 'で': 'た', 'ど': 'た',
    'タ': 'た', 'チ': 'た', 'ツ': 'た', 'テ': 'た', 'ト': 'た',
    'ダ': 'た', 'ヂ': 'た', 'ヅ': 'た', 'デ': 'た', 'ド': 'た',
    // な行
    'な': 'な', 'に': 'な', 'ぬ': 'な', 'ね': 'な', 'の': 'な',
    'ナ': 'な', 'ニ': 'な', 'ヌ': 'な', 'ネ': 'な', 'ノ': 'な',
    // は行
    'は': 'は', 'ひ': 'は', 'ふ': 'は', 'へ': 'は', 'ほ': 'は',
    'ば': 'は', 'び': 'は', 'ぶ': 'は', 'べ': 'は', 'ぼ': 'は',
    'ぱ': 'は', 'ぴ': 'は', 'ぷ': 'は', 'ぺ': 'は', 'ぽ': 'は',
    'ハ': 'は', 'ヒ': 'は', 'フ': 'は', 'ヘ': 'は', 'ホ': 'は',
    'バ': 'は', 'ビ': 'は', 'ブ': 'は', 'ベ': 'は', 'ボ': 'は',
    'パ': 'は', 'ピ': 'は', 'プ': 'は', 'ペ': 'は', 'ポ': 'は',
    // ま行
    'ま': 'ま', 'み': 'ま', 'む': 'ま', 'め': 'ま', 'も': 'ま',
    'マ': 'ま', 'ミ': 'ま', 'ム': 'ま', 'メ': 'ま', 'モ': 'ま',
    // や行
    'や': 'や', 'ゆ': 'や', 'よ': 'や',
    'ヤ': 'や', 'ユ': 'や', 'ヨ': 'や',
    // ら行
    'ら': 'ら', 'り': 'ら', 'る': 'ら', 'れ': 'ら', 'ろ': 'ら',
    'ラ': 'ら', 'リ': 'ら', 'ル': 'ら', 'レ': 'ら', 'ロ': 'ら',
    // わ行
    'わ': 'わ', 'を': 'わ', 'ん': 'わ',
    'ワ': 'わ', 'ヲ': 'わ', 'ン': 'わ'
  };

  return map[first] || "その他";
};

export default function CustomerList({ customers }: { customers: Customer[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<"kana" | "recent" | "upcoming">("kana");
  const [filterHasContract, setFilterHasContract] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Reset loading state when page changes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  // 顧客ごとに最終来店日と契約状況を計算
  const processedCustomers = customers.map(c => {
    // 最終来店日の計算 (今日以前の最も新しい来店日)
    const today = new Date().toISOString().split("T")[0];
    const pastVisits = (c.treatments || [])
      .filter(t => t.visit_date && t.visit_date <= today && t.status !== 'キャンセル' && t.status !== '無断キャンセル')
      .map(t => t.visit_date as string)
      .sort((a, b) => b.localeCompare(a));
    const lastVisitDate = pastVisits.length > 0 ? pastVisits[0] : null;

    // 次回予約の計算 (今日以降の最も古い来店日)
    const futureVisits = (c.treatments || [])
      .filter(t => t.visit_date && t.visit_date >= today && t.status !== 'キャンセル' && t.status !== '無断キャンセル')
      .sort((a, b) => {
        const dateA = a.visit_date!;
        const dateB = b.visit_date!;
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        const timeA = a.visit_time || "23:59";
        const timeB = b.visit_time || "23:59";
        return timeA.localeCompare(timeB);
      });
    const nextVisit = futureVisits.length > 0 ? futureVisits[0] : null;

    // 表示する契約を決定
    const displayContract = c.contracts?.sort((a: any, b: any) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })[0];

    // 契約が有効（未消化）かどうか
    let hasActiveContract = false;
    if (displayContract) {
      const usedCount = c.treatments?.filter((t: any) => 
        t.contract_id === displayContract.id && t.status !== 'キャンセル'
      ).length || 0;
      const total = displayContract.installments || 1;
      hasActiveContract = usedCount < total;
    }

    return { ...c, lastVisitDate, nextVisit, displayContract, hasActiveContract };
  });

  // フィルタリング
  let filteredCustomers = processedCustomers.filter(c => 
    (c.name.includes(searchQuery) || (c.name_kana && c.name_kana.includes(searchQuery))) &&
    (!filterHasContract || c.hasActiveContract)
  );

  // ソート
  if (sortMode === "recent") {
    filteredCustomers = filteredCustomers.sort((a, b) => {
      if (!a.lastVisitDate) return 1;
      if (!b.lastVisitDate) return -1;
      return b.lastVisitDate.localeCompare(a.lastVisitDate);
    });
  } else if (sortMode === "upcoming") {
    filteredCustomers = filteredCustomers.sort((a, b) => {
      if (!a.nextVisit) return 1;
      if (!b.nextVisit) return -1;
      const dateA = a.nextVisit.visit_date || "";
      const dateB = b.nextVisit.visit_date || "";
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a.nextVisit.visit_time || "23:59";
      const timeB = b.nextVisit.visit_time || "23:59";
      return timeA.localeCompare(timeB);
    });
  }

  // グループ化 (五十音順モードの場合のみ使用)
  const groupedCustomers = KANA_ROWS.reduce((acc, row) => {
    acc[row] = filteredCustomers.filter(c => getKanaRow(c.name_kana) === row).sort((a, b) => (a.name_kana || "").localeCompare(b.name_kana || ""));
    return acc;
  }, {} as Record<string, (Customer & { lastVisitDate: string | null; nextVisit: any; displayContract: any; hasActiveContract: boolean })[]>);

  // その他グループ
  const others = filteredCustomers.filter(c => !KANA_ROWS.includes(getKanaRow(c.name_kana))).sort((a, b) => (a.name_kana || "").localeCompare(b.name_kana || ""));

  const renderCustomerRow = (c: Customer & { lastVisitDate: string | null; nextVisit: any; displayContract: any; hasActiveContract: boolean }) => {
    const displayContract = c.displayContract;

    let statusBadge = <span className="text-xs text-muted-foreground italic tracking-tight">契約なし</span>;

    if (displayContract) {
      const usedCount = c.treatments?.filter((t: any) => 
        t.contract_id === displayContract.id && t.status !== 'キャンセル'
      ).length || 0;
      
      const total = displayContract.installments || 1;
      const isCompleted = usedCount >= total;

      if (isCompleted) {
        statusBadge = (
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-700 leading-tight">
              {displayContract.course_name}
            </span>
            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
              ({total}回消化済み)
            </span>
          </div>
        );
      } else {
        statusBadge = (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[9px] font-bold bg-[var(--salon-teal)]/10 text-[var(--salon-teal-dark)] border-[var(--salon-teal)]/20 w-fit leading-tight mb-0.5">
              {displayContract.course_name}
            </span>
            <span className="text-[10px] font-black text-[var(--salon-purple)] whitespace-nowrap">
              残{total - usedCount}回 | {total}回中
            </span>
          </div>
        );
      }
    }

    return (
      <TableRow 
        key={c.id} 
        className="hover:bg-gray-50/50 cursor-pointer border-gray-100"
        onClick={() => {
          setIsLoading(true);
          router.push(`/customers/${c.id}`);
        }}
      >
        <TableCell className="px-2 py-3 w-[30%] min-w-[140px]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-black text-xs sm:text-base text-gray-800 leading-tight">{c.name}</div>
            {c.gender === '女性' && (
              <span className="bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded text-[9px] font-bold border border-pink-100 whitespace-nowrap">女性</span>
            )}
            {c.gender === '男性' && (
              <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[9px] font-bold border border-blue-100 whitespace-nowrap">男性</span>
            )}
            {c.line_user_id && (
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-black border border-emerald-100 whitespace-nowrap">
                <MessageCircle className="w-2.5 h-2.5 fill-emerald-600/10" />
                LINE
              </div>
            )}
          </div>
          <div className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">
            {c.name_kana || "-"}
          </div>
        </TableCell>
        <TableCell className="px-2 py-3 w-[25%] min-w-[120px]">
          {statusBadge}
        </TableCell>
        <TableCell className="px-2 py-3 w-[30%] min-w-[140px]">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
              <span className="text-gray-400 font-bold bg-gray-100 px-1.5 rounded-sm whitespace-nowrap">直近</span>
              <span className={c.lastVisitDate ? "text-gray-700 font-bold" : "text-gray-300 italic font-medium"}>
                {c.lastVisitDate ? new Date(c.lastVisitDate).toLocaleDateString("ja-JP", { month: 'short', day: 'numeric' }) : "なし"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
              <span className="text-[var(--salon-purple)]/70 font-bold bg-[var(--salon-purple)]/10 px-1.5 rounded-sm whitespace-nowrap">次回</span>
              <span className={c.nextVisit ? "text-[var(--salon-purple)] font-bold" : "text-gray-300 italic font-medium"}>
                {c.nextVisit ? (
                  `${new Date(c.nextVisit.visit_date).toLocaleDateString("ja-JP", { month: 'short', day: 'numeric' })}${c.nextVisit.visit_time ? ` ${c.nextVisit.visit_time.substring(0, 5)}` : ''}`
                ) : "なし"}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right px-2 py-3 w-[15%]">
          <Link href={`/customers/${c.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 sm:w-auto sm:px-3 hover:bg-[var(--salon-purple)]/5 hover:text-[var(--salon-purple)] font-black text-xs shrink-0">
              <FileText className="h-4 w-4 sm:mr-1.5 shrink-0" />
              <span className="hidden sm:inline">詳細</span>
            </Button>
          </Link>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6 relative">
      {isLoading && <LoadingSpinner />}
      
      {/* コントロールパネル */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* 検索バー */}
        <div className="relative group flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[var(--salon-purple)] transition-colors" />
          <Input
            type="search"
            placeholder="お名前やフリガナで検索..."
            className="pl-11 h-12 bg-white border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[var(--salon-purple)]/20 transition-all text-sm sm:text-base font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 shrink-0">
          {/* ソートセレクタ */}
          <div className="relative">
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as "kana" | "recent" | "upcoming")}
              className="appearance-none h-12 pl-10 pr-8 rounded-xl border border-gray-200 bg-white text-sm font-bold shadow-sm focus:ring-2 focus:ring-[var(--salon-purple)]/20 text-gray-700 w-[140px]"
            >
              <option value="kana">あいうえお順</option>
              <option value="recent">最終来店順</option>
              <option value="upcoming">次回予約順</option>
            </select>
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              {sortMode === "kana" ? <ArrowDownAZ className="h-4 w-4" /> : 
               sortMode === "recent" ? <Clock className="h-4 w-4" /> :
               <CalendarClock className="h-4 w-4" />}
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
          </div>

          {/* 契約中フィルター */}
          <Button
            variant={filterHasContract ? "default" : "outline"}
            onClick={() => setFilterHasContract(!filterHasContract)}
            className={`h-12 px-4 gap-2 font-bold rounded-xl shadow-sm border-gray-200 shrink-0 ${
              filterHasContract ? "bg-[var(--salon-purple)] text-white hover:bg-[var(--salon-purple)]/90" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">契約中のみ</span>
            <span className="sm:hidden">契約中</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {searchQuery || sortMode === "recent" || sortMode === "upcoming" ? (
          // 検索結果 または 直近来店順/次回予約順 (フラットリスト)
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-gray-100">
                <TableHead className="font-black text-gray-400 text-xs px-2 py-4">お名前・性別</TableHead>
                <TableHead className="font-black text-gray-400 text-xs px-2 py-4">契約状況</TableHead>
                <TableHead className="font-black text-gray-400 text-xs px-2 py-4">来店状況</TableHead>
                <TableHead className="text-right font-black text-gray-400 text-xs px-2 py-4">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(renderCustomerRow)
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-gray-400 font-bold italic">
                    一致するお客様が見つかりません。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          // 通常時 (行別アコーディオン)
          <Accordion className="divide-y divide-gray-50">
            {KANA_ROWS.map((row) => {
              const rowCustomers = groupedCustomers[row];
              if (rowCustomers.length === 0) return null;

              return (
                <AccordionItem key={row} value={row} className="border-none px-4">
                  <AccordionTrigger className="py-5 hover:no-underline hover:opacity-70 transition-opacity">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[var(--salon-purple)]/5 flex items-center justify-center text-[var(--salon-purple)] font-black text-lg">
                        {row}
                      </div>
                      <span className="font-black text-gray-900 text-lg">
                        {row}行
                        <span className="ml-2 text-xs text-gray-400 font-bold">({rowCustomers.length}名)</span>
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="rounded-xl border border-gray-50 overflow-hidden shadow-sm">
                      <Table>
                        <TableBody>
                          {rowCustomers.map(renderCustomerRow)}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}

            {others.length > 0 && (
              <AccordionItem value="others" className="border-none px-4">
                <AccordionTrigger className="py-5 hover:no-underline">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-black text-lg">
                      他
                    </div>
                    <span className="font-black text-gray-900 text-lg">
                      その他
                      <span className="ml-2 text-xs text-gray-400 font-bold">({others.length}名)</span>
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                    <div className="rounded-xl border border-gray-50 overflow-hidden shadow-sm">
                      <Table>
                        <TableBody>
                          {others.map(renderCustomerRow)}
                        </TableBody>
                      </Table>
                    </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </div>
    </div>
  );
}
