"use client";

import { useState, useTransition } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ArrowLeft, Save, Search, UserPlus, Users, MessageCircle } from "lucide-react";
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
  line_user_id: string | null;
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
  const [isSubmitting, startTransition] = useTransition();
  // 初期状態で「名簿から選択 (既にある情報を探す)」を優先する
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || "");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);

  const today = new Date().toISOString().split("T")[0];

  // 顧客のフィルタリング
  const filteredCustomers = customers.filter(c => 
    c.name.includes(searchQuery) || 
    (c.name_kana && c.name_kana.includes(searchQuery)) ||
    (c.phone && c.phone.replace(/[-\s]/g, '').includes(searchQuery.replace(/[-\s]/g, '')))
  );

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-8 bg-white min-h-screen relative">
      {isSubmitting && <LoadingSpinner />}
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
          onClick={() => setIsNewCustomer(false)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black rounded-lg transition-all",
            !isNewCustomer 
              ? "bg-white text-[var(--salon-purple)] shadow-sm scale-[1.02]" 
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Users className="w-4 h-4" />
          名簿から選択
        </button>
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
          新規登録して予約
        </button>
      </div>

      <div className="bg-gray-50 border rounded-xl overflow-hidden shadow-sm">
        <form 
          action={async (formData) => {
            startTransition(async () => {
              try {
                await createReservation(formData);
              } catch (error) {
                console.error(error);
              }
            });
          }} 
          className="p-6 space-y-6"
        >
          <input type="hidden" name="is_new_customer" value={isNewCustomer.toString()} />
          
          <div className="grid grid-cols-1 gap-6">
            
            {/* お客様選択・入力エリア */}
            <div className="space-y-3" key={isNewCustomer ? "new" : "existing"}>
              <div className="flex items-center justify-between">
                <Label className="font-bold text-gray-700">お客様情報</Label>
                {!isNewCustomer && (
                  <span className="text-[10px] text-gray-400 font-medium">※LINE連携済みの方は名簿に既に入っています</span>
                )}
              </div>
              
              {isNewCustomer ? (
                <div className="space-y-4 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-purple-600">お名前 (必須)</Label>
                    <Input name="new_customer_name" placeholder="例: 脱毛 太郎" required className="h-11 bg-white border-purple-200" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-purple-600">フリガナ</Label>
                      <Input name="new_customer_kana" placeholder="例: ダツモウ タロウ" className="h-11 bg-white border-purple-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-purple-600">電話番号</Label>
                      <Input name="new_customer_phone" placeholder="090-xxxx-xxxx" className="h-11 bg-white border-purple-200" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 検索機能 */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="名前・フリガナ・電話番号で検索..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 pl-10 bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-[var(--salon-purple)]/20 border-gray-200"
                    />
                  </div>

                  {/* 検索結果リスト */}
                  <div className="space-y-2 max-h-[240px] overflow-y-auto border rounded-xl p-2 bg-white shadow-inner">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(c => (
                        <label 
                          key={c.id} 
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border group cursor-pointer transition-all hover:bg-slate-50",
                            selectedCustomerId === c.id 
                              ? "border-[var(--salon-purple)] bg-[var(--salon-purple)]/5 ring-1 ring-[var(--salon-purple)]/20" 
                              : "border-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                selectedCustomerId === c.id ? "bg-[var(--salon-purple)] animate-pulse" : "bg-gray-200"
                            )} />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-900">{c.name}</span>
                                {c.line_user_id && (
                                    <div className="bg-emerald-50 text-emerald-600 text-[9px] px-1.5 py-0.5 rounded-full font-black border border-emerald-100 flex items-center gap-0.5 animate-in zoom-in duration-300">
                                      <MessageCircle className="w-2.5 h-2.5" />
                                      LINE
                                    </div>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-gray-400">{c.name_kana || "カナ未登録"} • {c.phone || "TELなし"}</span>
                            </div>
                          </div>
                          <input 
                            type="radio" 
                            name="customer_id" 
                            value={c.id || ""} 
                            checked={selectedCustomerId === c.id}
                            onChange={() => setSelectedCustomerId(c.id || "")}
                            className="sr-only"
                            required={!isNewCustomer}
                          />
                          <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                              selectedCustomerId === c.id ? "border-[var(--salon-purple)] bg-[var(--salon-purple)]" : "border-gray-200"
                          )}>
                              {selectedCustomerId === c.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="text-center py-6 space-y-2">
                        <p className="text-sm text-gray-400 font-bold">見つかりませんでした</p>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsNewCustomer(true)}
                          className="text-[var(--salon-purple)] text-xs font-black underline-offset-4 hover:underline"
                        >
                          新規登録へ切り替える
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 日時設定 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-gray-700">予約日</Label>
                <Input type="date" name="visit_date" defaultValue={today} required className="h-12 bg-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-gray-700">時間</Label>
                <Input type="time" name="visit_time" required className="h-12 bg-white rounded-xl" />
              </div>
            </div>

            {/* 担当者 */}
            <div className="space-y-3">
              <Label className="font-bold text-gray-700">担当スタッフ</Label>
              <div className="grid grid-cols-3 gap-2">
                <label className="cursor-pointer">
                  <input type="radio" name="staff_id" value="" defaultChecked className="peer sr-only" />
                  <div className="h-11 flex items-center justify-center border-2 rounded-xl text-xs font-black text-gray-400 peer-checked:bg-[var(--salon-purple)] peer-checked:text-white peer-checked:border-[var(--salon-purple)] transition-all bg-white hover:bg-gray-50">未定</div>
                </label>
                {staffList?.map(s => (
                  <label key={s.id} className="cursor-pointer">
                    <input type="radio" name="staff_id" value={s.id} className="peer sr-only" />
                    <div className="h-11 flex items-center justify-center border-2 rounded-xl text-xs font-black text-gray-400 peer-checked:bg-[var(--salon-purple)] peer-checked:text-white peer-checked:border-[var(--salon-purple)] transition-all bg-white hover:bg-gray-50">{s.name}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* 予約時の施術内容 */}
            <div className="space-y-3">
              <Label className="font-bold text-[var(--salon-purple)]">予約時の施術内容 (カレンダー表示)</Label>
              <div className="relative">
                <select
                  className="w-full h-12 bg-white border-2 border-[var(--salon-purple)]/30 rounded-xl px-4 focus:border-[var(--salon-purple)] focus:ring-2 focus:ring-[var(--salon-purple)]/10 outline-none font-bold transition-all appearance-none"
                  value={selectedCourse}
                  onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCourse(val);
                      if (val !== "ポイント施術") {
                          setSelectedPoints([]);
                      }
                  }}
                >
                  <option value="">施術メニューを選択</option>
                  <option value="全身脱毛">全身脱毛</option>
                  <option value="フェイスセット">フェイスセット</option>
                  <option value="VIOセット">VIOセット</option>
                  <option value="腰から下セット">腰から下セット</option>
                  <option value="首から下セット">首から下セット</option>
                  <option value="ポイント施術">ポイント施術 (部位を選択)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  ▼
                </div>
              </div>

              {/* ポイント施術選択時の部位チップ */}
              {selectedCourse === "ポイント施術" && (
                <div className="p-4 bg-white border-2 border-dashed border-[var(--salon-purple)]/30 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] font-black text-[var(--salon-purple)] uppercase tracking-wider">部位を選択 (複数可)</p>
                  <div className="flex flex-wrap gap-2">
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
                          "px-4 py-2 text-xs font-bold rounded-full border-2 transition-all active:scale-95",
                          selectedPoints.includes(part)
                            ? "bg-[var(--salon-purple)] text-white border-[var(--salon-purple)] shadow-md"
                            : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                        )}
                      >
                        {part}
                      </button>
                    ))}
                  </div>
                  {selectedPoints.length > 0 && (
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <p className="text-[11px] text-gray-600 font-bold">選択中の部位: {selectedPoints.join("、")}</p>
                      </div>
                  )}
                </div>
              )}

              {/* 実際に送信される値 */}
              <input 
                type="hidden" 
                name="reserved_content" 
                value={selectedCourse === "ポイント施術" ? selectedPoints.join("、") : selectedCourse} 
              />
              <p className="text-[10px] text-gray-400 font-bold italic ml-1">※カレンダー上に表示されます</p>
            </div>

            {/* メモ */}
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">特記・メモ</Label>
              <Textarea 
                name="notes" 
                placeholder="来店に関するメモがあれば入力（駐車場希望など）" 
                className="bg-white min-h-[100px] border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--salon-purple)]/10"
              />
            </div>
          </div>

          <div className="pt-6 pb-2">
            <Button 
                type="submit" 
                disabled={isSubmitting || (!isNewCustomer && !selectedCustomerId)}
                className="w-full h-14 bg-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/90 text-white font-black text-lg rounded-2xl shadow-xl shadow-[var(--salon-purple)]/20 transition-all active:scale-[0.98] gap-2 disabled:opacity-50 disabled:grayscale"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  保存中...
                </div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  予約を確定する
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
