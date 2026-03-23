"use client";

import { useState } from "react";
import { Smartphone, Check, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updateCustomerLineUserId } from "./actions";
import { cn } from "@/lib/utils";

interface LineUserIdProps {
  customerId: string;
  initialLineUserId?: string | null;
}

export default function LineUserIdForm({ customerId, initialLineUserId }: LineUserIdProps) {
  const [lineUserId, setLineUserId] = useState(initialLineUserId || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const result = await updateCustomerLineUserId(customerId, lineUserId);
      if (result.success) {
        setIsOpen(false);
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error(err);
      alert("更新中にエラーが発生しました");
    } finally {
      setIsUpdating(false);
    }
  };

  const isLinked = !!initialLineUserId;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          size="sm" 
          variant={isLinked ? "outline" : "outline"} 
          className={cn(
            "h-10 px-4 font-bold border-gray-300 w-full sm:w-auto order-3 sm:order-2",
            isLinked ? "border-[var(--salon-purple)] text-[var(--salon-purple)] bg-[var(--salon-purple)]/5" : "text-gray-500"
          )}
        >
          {isLinked ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Smartphone className="w-4 h-4 mr-2" />
          )}
          {isLinked ? "LINE連携済" : "LINE連携"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold leading-none text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-gray-400" />
              LINE User ID 登録
            </h4>
            <p className="text-xs text-gray-500">
              Messaging API用のユーザーID（U...で始まる33文字）を登録します。
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Input
              placeholder="U333854a..."
              value={lineUserId}
              onChange={(e) => setLineUserId(e.target.value)}
              className="font-mono text-xs"
            />
            <Button 
              size="sm" 
              className="w-full font-bold bg-[var(--salon-purple)] hover:bg-[var(--salon-purple-dark)]"
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                "保存する"
              )}
            </Button>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
              <Info className="w-3 h-3" />
              IDの確認方法
            </div>
            <p className="text-[10px] leading-relaxed text-gray-500">
              LINE公式アカウントのプロファイル、またはデベロッパーコンソールの「あなたのユーザーID」から取得できます。
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
