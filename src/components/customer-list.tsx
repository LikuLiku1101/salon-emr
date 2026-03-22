"use client";

import { useState, useEffect } from "react";
import { Search, FileText } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Reset loading state when page changes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const filteredCustomers = customers.filter(c => 
    c.name.includes(searchQuery) || 
    (c.name_kana && c.name_kana.includes(searchQuery))
  );

  // グループ化
  const groupedCustomers = KANA_ROWS.reduce((acc, row) => {
    acc[row] = filteredCustomers.filter(c => getKanaRow(c.name_kana) === row);
    return acc;
  }, {} as Record<string, Customer[]>);

  // その他グループ
  const others = filteredCustomers.filter(c => !KANA_ROWS.includes(getKanaRow(c.name_kana)));

  const renderCustomerRow = (c: Customer) => {
    // 有効な契約を優先し、最新のもの1つを表示
    const displayContract = c.contracts?.sort((a: any, b: any) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })[0];

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
        <TableCell className="px-2 py-3">
          <div className="font-black text-xs sm:text-base text-gray-800 leading-tight">{c.name}</div>
          <div className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">
            {c.name_kana || "-"}
          </div>
        </TableCell>
        <TableCell className="px-2 py-3">
          {statusBadge}
        </TableCell>
        <TableCell className="text-right px-2 py-3">
          <Link href={`/customers/${c.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 sm:w-auto sm:px-3 hover:bg-[var(--salon-purple)]/5 hover:text-[var(--salon-purple)] font-black text-xs">
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
      
      {/* 検索バー */}
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[var(--salon-purple)] transition-colors" />
        <Input
          type="search"
          placeholder="お名前やフリガナで検索..."
          className="pl-11 h-14 bg-white border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-[var(--salon-purple)]/20 transition-all text-base sm:text-lg font-bold"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {searchQuery ? (
          // 検索結果 (フラットリスト)
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-gray-100">
                <TableHead className="font-black text-gray-400 text-xs px-2 py-4">お名前</TableHead>
                <TableHead className="font-black text-gray-400 text-xs px-2 py-4">契約状況</TableHead>
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
