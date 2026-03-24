"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Copy, Check, QrCode, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function LineJoinDialog() {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const joinUrl = `${origin}/join`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    toast.success("URLをコピーしました");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger 
        render={
          <Button 
            variant="outline" 
            className="h-24 sm:h-32 bg-white border-2 border-emerald-500 text-emerald-600 rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-md hover:shadow-lg hover:bg-emerald-50 hover:-translate-y-1 transition-all active:scale-95 relative overflow-hidden group"
          >
            <div className="absolute -right-2 -top-2 w-16 h-16 bg-emerald-500/10 rounded-full group-hover:scale-110 transition-transform" />
            <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-base sm:text-xl font-black">LINE連携URL</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center pt-4">LINE連携・新規登録</DialogTitle>
          <DialogDescription className="text-center font-bold text-gray-400">
            お客様にこのQRコードを読み取ってもらってください。
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center space-y-6 py-6 font-sans">
          <div className="relative p-4 bg-white rounded-2xl border-4 border-emerald-500/10 shadow-xl overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={qrUrl} 
              alt="LINE Join QR Code" 
              className="w-48 h-48 sm:w-64 sm:h-64"
            />
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <QrCode className="w-12 h-12 text-emerald-500/20" />
            </div>
          </div>

          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 font-mono text-xs text-gray-600 break-all select-all">
              {joinUrl}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleCopy}
                className="bg-gray-900 text-white font-black rounded-xl h-12 gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "コピー済み" : "URLコピー"}
              </Button>
              <Button 
                variant="outline"
                className="border-gray-200 font-black rounded-xl h-12 gap-2 text-gray-600"
                render={
                  <a href={joinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full h-full" />
                }
              >
                <ExternalLink className="w-4 h-4" />
                自分で開く
              </Button>
            </div>
          </div>
          
          <div className="pt-2 text-[10px] text-gray-400 font-bold text-center leading-relaxed italic">
            ※来店の多いサロン様向け：このページはログイン不要です。<br />
            iPadなどで表示してお客様にお見せください。
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
