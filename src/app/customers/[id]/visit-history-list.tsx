"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import DeleteTreatmentButton from "./delete-button";

interface VisitHistoryListProps {
  treatments: any[];
  customerId: string;
}

export default function VisitHistoryList({ treatments, customerId }: VisitHistoryListProps) {
  const router = useRouter();

  if (treatments.length === 0) {
    return (
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden overflow-x-auto">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-bold">
                来店履歴はまだありません。
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-bold w-[120px] px-4">来店日</TableHead>
            <TableHead className="font-bold px-4">内容・部位</TableHead>
            <TableHead className="font-bold w-[120px] px-4">支払い</TableHead>
            <TableHead className="font-bold w-[100px] px-4">担当</TableHead>
            <TableHead className="text-right font-bold w-[100px] px-4">詳細</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {treatments.map((t) => (
            <TableRow 
              key={t.id} 
              className="hover:bg-gray-50/50 cursor-pointer"
              onClick={() => router.push(`/treatments/${t.id}`)}
            >
              <TableCell className="px-4 py-3">
                <div className="font-black text-gray-800">
                  {format(new Date(t.visit_date), "yyyy/MM/dd")}
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[var(--salon-purple)]">
                    {t.reserved_content}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {t.treatment_details && t.treatment_details.length > 0 ? (
                      t.treatment_details.map((d: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="px-1.5 py-0 text-[10px] h-4 bg-gray-100 text-gray-600 border-none font-bold">
                          {d.body_part}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400 italic font-medium">なし</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  {t.payment_status === '本日一括支払い' ? (
                    <Badge className="bg-[var(--salon-purple)] text-white text-[9px] h-4 px-1 leading-none font-bold w-fit">
                      本日一括
                    </Badge>
                  ) : t.payment_status === '一括支払い済み' ? (
                    <Badge variant="outline" className="text-[var(--salon-teal-dark)] border-[var(--salon-teal)] bg-[var(--salon-teal)]/5 text-[9px] h-4 px-1 leading-none font-bold w-fit">
                      一括消化
                    </Badge>
                  ) : t.payment_status === '都度' ? (
                    <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50 text-[9px] h-4 px-1 leading-none font-bold w-fit">
                      都度払い
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold italic">未入力</span>
                  )}
                  {t.payment_amount ? (
                    <span className="text-[11px] font-black text-gray-700">¥{t.payment_amount.toLocaleString()}</span>
                  ) : (
                    t.payment_status === '一括支払い済み' && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">DIGEST</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-600 font-bold">
                <div className="flex flex-col">
                  <span>{(t.staff as any)?.name || "未定"}</span>
                  <span className="text-[9px] text-[var(--salon-teal-dark)] bg-[var(--salon-teal)]/10 px-1 rounded-sm w-fit leading-none mt-1 py-0.5">
                    {t.visit_count}回目
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <div onClick={(e) => { e.stopPropagation(); }}>
                    <DeleteTreatmentButton 
                      treatmentId={t.id} 
                      customerId={customerId} 
                      visitDate={format(new Date(t.visit_date), "yyyy/MM/dd")} 
                    />
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[var(--salon-purple)] transition-colors" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
