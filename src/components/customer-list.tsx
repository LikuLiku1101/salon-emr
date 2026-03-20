"use client";

import { useState } from "react";
import { Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

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

export default function CustomerList({ customers }: { customers: Customer[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = customers.filter(c => 
    c.name.includes(searchQuery) || 
    (c.name_kana && c.name_kana.includes(searchQuery))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="お名前やフリガナで検索..."
            className="pl-8 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-bold">お名前 / フリガナ</TableHead>
              <TableHead className="font-bold">契約状況</TableHead>
              <TableHead className="text-right font-bold">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((c) => {
                // 有効な契約を優先し、最新のもの1つを表示
                const displayContract = c.contracts?.sort((a: any, b: any) => {
                  if (a.status === 'active' && b.status !== 'active') return -1;
                  if (a.status !== 'active' && b.status === 'active') return 1;
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })[0];

                let statusBadge = <span className="text-xs text-muted-foreground italic">契約なし</span>;

                if (displayContract) {
                  const usedCount = c.treatments?.filter((t: any) => 
                    t.contract_id === displayContract.id && t.status !== 'キャンセル'
                  ).length || 0;
                  
                  const total = displayContract.installments || 1;
                  const isCompleted = usedCount >= total;

                  if (isCompleted) {
                    statusBadge = (
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-500 border-gray-200">
                        {displayContract.course_name} ({total}回消化済み)
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold bg-[var(--salon-teal)]/10 text-[var(--salon-teal-dark)] border-[var(--salon-teal)]/20 w-fit">
                          {displayContract.course_name}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--salon-purple)] ml-1">
                          残り {total - usedCount} 回 / {total}回中
                        </span>
                      </div>
                    );
                  }
                }

                return (
                  <TableRow key={c.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="font-black text-gray-800">{c.name}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                        {c.name_kana || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {statusBadge}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/customers/${c.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 hover:bg-[var(--salon-purple)]/5 hover:text-[var(--salon-purple)] font-bold">
                          <FileText className="h-4 w-4 mr-2" />
                          詳細/カルテ
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  {searchQuery ? "一致するお客様が見つかりません。" : "顧客データがまだありません。"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
