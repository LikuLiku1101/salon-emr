"use client";

import { useState } from "react";
import { Search, UserPlus, FilePlus, ChevronRight, X, User } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createDetailedTreatment } from "@/app/treatments/new/actions";
import { createNewCustomerAndTreatment } from "@/app/treatments/new/customer-actions";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Next.jsのredirect()はエラーを投げるため、それを検知するための関数
const isRedirectError = (error: any) => error?.digest?.startsWith("NEXT_REDIRECT");

interface Customer {
  id: string;
  name: string;
  name_kana: string;
  phone: string;
}

export default function SheetRegistrationForm({ customers }: { customers: Customer[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);

  const filteredCustomers = customers.filter(c => 
    c.name.includes(searchQuery) || 
    (c.name_kana && c.name_kana.includes(searchQuery))
  );

  const handleCreateForExisting = async (id: string) => {
    setSelectedId(id);
    setIsPending(true);
    try {
      await createDetailedTreatment(id);
    } catch (error) {
      if (isRedirectError(error)) {
        // リダイレクトの場合はエラーではないので、isPendingをtrueのままにして遷移を待つ
        return;
      }
      console.error(error);
      toast.error("シートの作成に失敗しました");
      setIsPending(false);
      setSelectedId("");
    }
  };

  const handleNewCustomerSubmit = async (formData: FormData) => {
    setIsPending(true);
    try {
      await createNewCustomerAndTreatment(formData);
    } catch (error) {
      if (isRedirectError(error)) {
        // リダイレクトの場合はエラーではない
        return;
      }
      console.error(error);
      toast.error("新規顧客登録とシート作成に失敗しました");
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 px-4 relative">
      {isPending && <LoadingSpinner />}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-[var(--salon-purple)]">施術シート登録</h1>
        <p className="text-sm text-gray-500 font-bold">どのお客様の施術シートを作成しますか？</p>
      </header>

      {/* モード選択・検索エリア */}
      <div className="space-y-4">
        {!showNewForm ? (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="お客様を検索..."
                className="pl-9 h-11 bg-white rounded-xl border-gray-200 shadow-sm focus:ring-[var(--salon-purple)]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
                onClick={() => setShowNewForm(true)}
                className="h-11 bg-[var(--salon-purple)] hover:bg-[var(--salon-purple-dark)] rounded-xl px-4 font-bold shadow-sm shrink-0"
            >
                <UserPlus className="h-4 w-4 mr-2" />
                新規登録
            </Button>
          </div>
        ) : (
          <div className="bg-white border-2 border-[var(--salon-purple)]/20 p-5 rounded-2xl shadow-lg space-y-4 animate-in slide-in-from-top-2 duration-200">
             <div className="flex items-center justify-between border-b pb-3 mb-1">
                <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                   <UserPlus className="h-5 w-5 text-[var(--salon-purple)]" />
                   新規のお客様を登録して作成
                </h3>
                <button 
                  onClick={() => setShowNewForm(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
             </div>
             
             <form action={handleNewCustomerSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">お名前 (必須)</label>
                        <Input name="name" placeholder="山田 花子" required className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">フリガナ</label>
                        <Input name="name_kana" placeholder="ヤマダ ハナコ" className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">性別</label>
                        <select name="gender" className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm font-bold focus:ring-2 focus:ring-[var(--salon-purple)] focus:border-transparent">
                            <option value="女性">女性</option>
                            <option value="男性">男性</option>
                            <option value="その他">その他</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">電話番号</label>
                        <Input name="phone" placeholder="080-1234-5678" className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full h-12 bg-[var(--salon-purple)] hover:bg-[var(--salon-purple-dark)] text-white font-black text-lg rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  {isPending ? "登録中..." : "登録してシートを作成"}
                </Button>
             </form>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {!showNewForm && (
            <>
            {filteredCustomers.length > 0 ? (
                filteredCustomers.map(c => (
                    <button
                    key={c.id}
                    disabled={isPending}
                    onClick={() => handleCreateForExisting(c.id)}
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl shadow-sm transition-all group active:scale-[0.98]"
                    >
                    <div className="flex flex-col items-start">
                        <span className="font-black text-gray-800 text-lg">{c.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{c.name_kana}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isPending && selectedId === c.id ? (
                        <span className="text-sm font-bold text-[var(--salon-purple)] animate-pulse">作成中...</span>
                        ) : (
                        <div className="flex items-center gap-1 text-[var(--salon-purple)] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            作成する
                            <ChevronRight className="h-4 w-4" />
                        </div>
                        )}
                    </div>
                    </button>
                ))
                ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold mb-4">該当するお客様が見つかりません</p>
                    <Button 
                        onClick={() => setShowNewForm(true)}
                        variant="outline" 
                        className="border-[var(--salon-purple)] text-[var(--salon-purple)] font-bold h-11 px-6 rounded-xl hover:bg-[var(--salon-purple)]/5"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        新規のお客様として登録
                    </Button>
                </div>
                )}
            </>
        )}
      </div>

      <div className="pt-4 text-center">
        <Link href="/treatments" className="text-sm text-gray-400 font-bold hover:text-[var(--salon-purple)] transition-colors">
          ← カレンダーへ戻る
        </Link>
      </div>
    </div>
  );
}
