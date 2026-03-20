"use client";

import { useState } from "react";
import { ArrowLeft, Save, Search, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createReservation } from "@/app/treatments/new/actions";

type Customer = {
  id: string;
  name: string;
  name_kana: string | null;
  phone: string | null;
};

type Staff = {
  id: string;
  name: string;
};

export default function ReservationForm({ 
  customers, 
  staffList,
  initialCustomerId
}: { 
  customers: Customer[], 
  staffList: Staff[],
  initialCustomerId?: string
}) {
  const [isNewCustomer, setIsNewCustomer] = useState(initialCustomerId ? false : true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || "");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);

  const today = new Date().toISOString().split("T")[0];

  // 顧客のフィルタリング
  const filteredCustomers = customers.filter(c => 
    c.name.includes(searchQuery) || 
    (c.name_kana && c.name_kana.includes(searchQuery))
  ); // 制限を解除して全員表示対象にする

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-8 bg-white min-h-screen">
      <header className="space-y-4">
        <Link href="/treatments" className="inline-flex items-center text-sm font-medium text-[var(--salon-purple)] hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          カレンダーへ戻る
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 border-l-4 border-[var(--salon-purple)] pl-3">新規予約の登録</h1>
      </header>

      {/* モード切り替えボタン */}
      <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-inner">
        <button
          type="button"
          onClick={() => setIsNewCustomer(true)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black rounded-lg transition-all",
            isNewCustomer 
              ? "bg-white text-[var(--salon-purple)] shadow-sm scale-[1.02]" 
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <UserPlus className="w-4 h-4" />
          新規 (初回)
        </button>
        <button
          type="button"
          onClick={() => setIsNewCustomer(false)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black rounded-lg transition-all",
            !isNewCustomer 
              ? "bg-white text-[var(--salon-purple)] shadow-sm scale-[1.02]" 
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Users className="w-4 h-4" />
          2回目以降
        </button>
      </div>

      <div className="bg-gray-50 border rounded-xl overflow-hidden shadow-sm">
        <form action={createReservation} className="p-6 space-y-6">
          <input type="hidden" name="is_new_customer" value={isNewCustomer.toString()} />
          
          <div className="grid grid-cols-1 gap-6">
            
            {/* お客様選択・入力エリア */}
            <div className="space-y-3" key={isNewCustomer ? "new" : "existing"}>
              <Label className="font-bold text-gray-700">お客様情報</Label>
              
              {isNewCustomer ? (
                <div className="space-y-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-blue-600">お名前 (必須)</Label>
                    <Input name="new_customer_name" placeholder="例: 脱毛 太郎" required className="h-11 bg-white border-blue-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-blue-600">フリガナ</Label>
                      <Input name="new_customer_kana" placeholder="例: ダツモウ タロウ" className="h-11 bg-white border-blue-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-blue-600">電話番号</Label>
                      <Input name="new_customer_phone" placeholder="090-xxxx-xxxx" className="h-11 bg-white border-blue-200" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 検索機能 */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="名前・フリガナで検索..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-11 pl-10 bg-white"
                    />
                  </div>

                  {/* 検索結果リスト (簡易セレクトボックス) */}
                  <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar border rounded-lg p-2 bg-white">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(c => (
                        <label 
                          key={c.id} 
                          className={cn(
                            "flex items-center justify-between p-3 rounded-md border cursor-pointer transition-all hover:bg-gray-50",
                            selectedCustomerId === c.id ? "border-[var(--salon-purple)] bg-[var(--salon-purple)]/5 ring-1 ring-[var(--salon-purple)]/20" : "border-gray-100"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-gray-800">{c.name}</span>
                            <span className="text-[10px] text-gray-400">{c.name_kana || "-"}</span>
                          </div>
                          <input 
                            type="radio" 
                            name="customer_id" 
                            value={c.id || ""} 
                            checked={selectedCustomerId === c.id}
                            onChange={() => setSelectedCustomerId(c.id || "")}
                            className="w-4 h-4 accent-[var(--salon-purple)]"
                            required={!isNewCustomer}
                          />
                        </label>
                      ))
                    ) : (
                      <p className="text-center py-4 text-sm text-gray-400">見つかりませんでした</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 日時設定 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-gray-700">予約日</Label>
                <Input type="date" name="visit_date" defaultValue={today} required className="h-12 bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-gray-700">時間</Label>
                <Input type="time" name="visit_time" required className="h-12 bg-white" />
              </div>
            </div>

            {/* 担当者 */}
            <div className="space-y-3">
              <Label className="font-bold text-gray-700">担当スタッフ</Label>
              <div className="grid grid-cols-3 gap-2">
                <label className="cursor-pointer">
                  <input type="radio" name="staff_id" value="" defaultChecked className="peer sr-only" />
                  <div className="h-11 flex items-center justify-center border rounded-lg text-xs font-bold text-gray-500 peer-checked:bg-[var(--salon-purple)] peer-checked:text-white peer-checked:border-[var(--salon-purple)] transition-all">未定</div>
                </label>
                {staffList?.map(s => (
                  <label key={s.id} className="cursor-pointer">
                    <input type="radio" name="staff_id" value={s.id} className="peer sr-only" />
                    <div className="h-11 flex items-center justify-center border rounded-lg text-xs font-bold text-gray-500 peer-checked:bg-[var(--salon-purple)] peer-checked:text-white peer-checked:border-[var(--salon-purple)] transition-all">{s.name}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* 予約時の施術内容 (プルダウン化 & ポイント選択) */}
            <div className="space-y-3">
              <Label className="font-bold text-[var(--salon-purple)]">予約時の施術内容 (カレンダー表示)</Label>
              <select
                className="w-full h-12 bg-white border-2 border-[var(--salon-purple)]/30 rounded-lg px-3 focus:border-[var(--salon-purple)] outline-none font-medium"
                value={selectedCourse}
                onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCourse(val);
                    if (val !== "ポイント施術") {
                        setSelectedPoints([]);
                    }
                }}
              >
                <option value="">選択してください</option>
                <hr />
                <option value="全身脱毛">全身脱毛</option>
                <option value="フェイスセット">フェイスセット</option>
                <option value="VIOセット">VIOセット</option>
                <option value="腰から下セット">腰から下セット</option>
                <option value="首から下セット">首から下セット</option>
                <hr />
                <option value="ポイント施術">ポイント施術 (部位を選択する)</option>
              </select>

              {/* ポイント施術選択時の部位チップ */}
              {selectedCourse === "ポイント施術" && (
                <div className="p-4 bg-white border border-dashed border-[var(--salon-purple)]/30 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] font-bold text-[var(--salon-purple)]">部位を選択してください (複数可)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "おでこ", "ほほ", "口周り", "あご", "くび",
                      "肩回り", "脇", "乳首", "胸", "お腹", "背中", "お尻",
                      "もも", "ひざ", "すね", "足首から先",
                      "Vライン", "Iライン", "Oライン", "睾丸", "陰茎"
                    ].map(part => (
                      <button
                        key={part}
                        type="button"
                        onClick={() => {
                          setSelectedPoints(prev => 
                            prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
                          );
                        }}
                        className={cn(
                          "px-3 py-1.5 text-[11px] font-bold rounded-full border transition-all active:scale-95",
                          selectedPoints.includes(part)
                            ? "bg-[var(--salon-purple)] text-white border-[var(--salon-purple)] shadow-sm"
                            : "bg-white text-gray-500 border-gray-200 hover:border-[var(--salon-purple)]/50"
                        )}
                      >
                        {part}
                      </button>
                    ))}
                  </div>
                  {selectedPoints.length > 0 && (
                      <p className="text-[10px] text-gray-400 font-bold">選択中: {selectedPoints.join("、")}</p>
                  )}
                </div>
              )}

              {/* 実際に送信される値 */}
              <input 
                type="hidden" 
                name="reserved_content" 
                value={selectedCourse === "ポイント施術" ? selectedPoints.join("、") : selectedCourse} 
              />
              <p className="text-[10px] text-gray-500 font-medium">※カレンダー上で [ ] 内に表示される内容です</p>
            </div>

            {/* メモ */}
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">特記・メモ</Label>
              <Textarea 
                name="notes" 
                placeholder="備考があれば入力してください" 
                className="bg-white min-h-[80px]"
              />
            </div>
          </div>

          <div className="pt-4 pb-2">
            <Button type="submit" className="w-full h-14 bg-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/90 text-white font-bold text-lg rounded-xl shadow-lg transition-all active:scale-[0.98] gap-2">
              <Save className="w-5 h-5" />
              予約を確定する
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
