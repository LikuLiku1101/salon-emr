"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Smartphone, User, UserPlus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Script from "next/script";

declare global {
  interface Window {
    liff: any;
  }
}

export default function JoinPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lineUserId, setLineUserId] = useState<string | null>(null);

  // フォームの状態
  const [formData, setFormData] = useState({
    name: "",
    name_kana: "",
    phone: "",
    gender: "女性",
  });

  const initLiff = async () => {
    try {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) {
        console.warn("NEXT_PUBLIC_LIFF_ID is not set.");
        setIsLoading(false);
        return;
      }

      await window.liff.init({ liffId });
      
      if (!window.liff.isLoggedIn()) {
        window.liff.login();
      } else {
        const profile = await window.liff.getProfile();
        setLineUserId(profile.userId);
        console.log("LINE User ID captured:", profile.userId);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("LIFF initialization failed", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ページ読み込み時にすでにある場合は初期化
    if (typeof window !== "undefined" && window.liff) {
      initLiff();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // サーバーアクションまたはAPIを呼び出してDBに保存
      const response = await fetch("/api/customers/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, line_user_id: lineUserId }),
      });

      const result = await response.json();
      if (result.success) {
        setIsCompleted(true);
        toast.success("登録・連携が完了しました！");
      } else {
        toast.error(result.error || "登録に失敗しました");
      }
    } catch (err) {
      toast.error("通信エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Script 
          src="https://static.line-scdn.net/liff/edge/2/sdk.js" 
          onLoad={initLiff} 
        />
        <Loader2 className="w-10 h-10 text-[var(--salon-purple)] animate-spin mb-4" />
        <p className="text-sm font-bold text-gray-400">システムを準備しています...</p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2 text-center">連携が完了しました！</h1>
        <p className="text-gray-500 text-center text-sm mb-8 leading-relaxed">
          サロン「SHINE」へのLINE連携が完了しました。<br />
          今後はLINEから予約の確認や<br />リマインドが届くようになります。
        </p>
        <Button 
          className="w-full h-14 bg-[var(--salon-purple)] text-white font-black rounded-xl text-lg shadow-lg"
          onClick={() => {
            if (window.liff) window.liff.closeWindow();
            else window.close();
          }}
        >
          閉じる
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Script 
        src="https://static.line-scdn.net/liff/edge/2/sdk.js" 
        onLoad={initLiff} 
      />
      {/* ヒーローセクション */}
      <div className="bg-[var(--salon-purple)] text-white p-8 pt-12 pb-16 text-center space-y-4">
        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/20">
            <Heart className="w-8 h-8 fill-white" />
        </div>
        <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight">SHINE</h1>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Customer Registration</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 inline-block text-[10px] font-black border border-white/10">
            LINE連携で予約通知を。
        </div>
      </div>

      <div className="px-5 -mt-8">
        <Card className="border shadow-2xl rounded-3xl overflow-hidden border-none">
          <CardHeader className="bg-white pb-2 pt-8">
            <CardTitle className="text-xl font-black text-gray-900 text-center flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5 text-[var(--salon-purple)]" />
                お客様情報の入力
            </CardTitle>
            <CardDescription className="text-center font-bold text-xs pt-1">
                サロンのシステムにお客様情報を登録します。<br />
                ※すでに来店されたことがある方もこちらから。
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-black text-gray-400 uppercase tracking-widest">お名前</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <Input 
                      id="name" 
                      placeholder="例：脱毛 太郎" 
                      required 
                      className="h-12 pl-10 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--salon-purple)]/20 font-bold"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name_kana" className="text-xs font-black text-gray-400 uppercase tracking-widest">フリガナ</Label>
                  <Input 
                    id="name_kana" 
                    placeholder="例：ダツモウ タロウ" 
                    className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--salon-purple)]/20 font-bold"
                    value={formData.name_kana}
                    onChange={(e) => setFormData({...formData, name_kana: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-black text-gray-400 uppercase tracking-widest">電話番号</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <Input 
                      id="phone" 
                      type="tel"
                      placeholder="例：090-0000-0000" 
                      required 
                      className="h-12 pl-10 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--salon-purple)]/20 font-bold"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest">性別</Label>
                  <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                    {["女性", "男性", "その他"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormData({...formData, gender: g})}
                          className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${
                            formData.gender === g 
                              ? "bg-white text-[var(--salon-purple)] shadow-sm scale-[1.02]" 
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {g}
                        </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 bg-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/90 text-white font-black rounded-xl text-lg shadow-xl shadow-[var(--salon-purple)]/20 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "登録・LINE連携する"
                  )}
                </Button>
                <p className="text-[10px] text-gray-400 text-center mt-4 font-medium leading-relaxed italic">
                    ※ご登録いただいた情報は、予約管理・重要なお知らせの送信にのみ使用いたします。
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
