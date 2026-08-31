"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, User, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export function StaffReportCard({
  staff,
  reservations,
  activeTab
}: {
  staff: { name: string; sales: number; days: number; payroll: number; transport: number };
  reservations: any[];
  activeTab: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const staffReservations = reservations.filter(r => {
    const rStaffName = Array.isArray(r.staff) ? r.staff[0]?.name : (r.staff as any)?.name || "担当不明";
    return rStaffName === staff.name;
  });

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2 cursor-pointer hover:bg-white hover:shadow-md transition-all active:scale-[0.98]"
      >
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-gray-700 text-lg">{staff.name}</span>
          <span className="text-xs font-bold text-gray-400 text-right">
            売上: ¥{staff.sales.toLocaleString()} <br className="sm:hidden" />({staff.days}日出勤)
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 font-bold">給与 (歩合)</span>
          <span className="font-bold">¥{staff.payroll.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 font-bold">交通費</span>
          <span className="font-bold">¥{staff.transport.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-sm font-bold pt-2 mt-2 border-t border-gray-200">
          <span className="text-[var(--salon-purple)]">報酬総額</span>
          <span className="text-[var(--salon-purple)] text-lg">¥{(staff.payroll + staff.transport).toLocaleString()}</span>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-slate-50 max-h-[85vh] flex flex-col">
          <DialogHeader className="bg-white p-4 border-b border-gray-100 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-gray-800">
              {staff.name} の予約一覧
              <Badge variant="secondary" className="ml-2 font-bold">{staffReservations.length}件</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            {staffReservations.map((res: any) => {
              const isPast = res.visit_date < new Date().toISOString().split('T')[0] || 
                             (res.visit_date === new Date().toISOString().split('T')[0] && (res.payment_status || (res.treatment_details && res.treatment_details.length > 0)));
              const isDone = isPast && res.status !== 'キャンセル' && (res.payment_status || (res.treatment_details && res.treatment_details.length > 0));
              const isCancelled = res.status === 'キャンセル';
              
              let content = "";
              if (res.contracts?.course_name) content = res.contracts.course_name;
              else if (res.reserved_content) content = res.reserved_content;
              else if (res.treatment_details?.length > 0) content = res.treatment_details.map((d: any) => d.body_part).join("、");
              else content = "未定";

              let amount = res.payment_amount || 0;
              if (activeTab === 'projected' && amount === 0 && !isDone && !isCancelled) {
                 amount = res.projectedAmount || 0;
              } else if (res.contracts?.total_amount > 0 && res.contracts?.installments > 1 && (res.payment_status || '').includes('一括')) {
                 amount = Math.floor(res.contracts.total_amount / res.contracts.installments);
              }

              return (
                <div key={res.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isCancelled ? (
                        <Badge variant="destructive" className="font-bold text-[10px]">キャンセル</Badge>
                      ) : isDone ? (
                        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-bold border border-green-100">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 施術済
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full text-xs font-bold border border-orange-100">
                          <Clock className="w-3.5 h-3.5" /> 未施術
                        </div>
                      )}
                      <div className="flex items-center text-sm font-bold text-gray-500 gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {res.visit_date}
                      </div>
                    </div>
                    <div className="font-black text-[var(--salon-purple)]">
                      ¥{amount.toLocaleString()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-black text-gray-800">
                        {Array.isArray(res.customers) ? res.customers[0]?.name : res.customers?.name || "お名前未登録"} 様
                      </span>
                    </div>
                    <div className="text-sm font-bold text-gray-500 pl-6 leading-snug">
                      {content}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {staffReservations.length === 0 && (
              <p className="text-center text-gray-400 font-bold py-8">予約がありません</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
