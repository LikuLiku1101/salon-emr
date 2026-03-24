"use client";

import { useState } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { sendManualLineMessage } from "./actions";
import { toast } from "sonner";

interface ManualMessageProps {
  customerId: string;
  customerName: string;
}

export default function ManualMessageForm({ customerId, customerName }: ManualMessageProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setIsSending(true);
    try {
      const result = await sendManualLineMessage(customerId, text);
      if (result.success) {
        toast.success("メッセージを送信しました");
        setText("");
        setIsOpen(false);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("送信中にエラーが発生しました");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button 
            size="sm" 
            variant="outline" 
            className="h-10 px-4 font-bold border-[var(--salon-purple)] text-[var(--salon-purple)] bg-[var(--salon-purple)]/5 hover:bg-[var(--salon-purple)] hover:text-white transition-all order-3 sm:order-2"
          >
            <Send className="w-4 h-4 mr-2" />
            個別LINE送信
          </Button>
        }
      />
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold leading-none text-sm flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              {customerName} 様 への個別送信
            </h4>
            <p className="text-xs text-gray-500">
              このメッセージは直接お客様のLINEに届きます。
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="メッセージを入力してください..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[100px] text-xs font-bold"
            />
            <Button 
              size="sm" 
              className="w-full font-bold bg-[var(--salon-purple)] hover:bg-[var(--salon-purple-dark)]"
              onClick={handleSend}
              disabled={isSending || !text.trim()}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  送信する
                </>
              )}
            </Button>
          </div>
          <div className="text-[10px] text-gray-400 font-bold leading-relaxed italic border-t pt-3 mt-1">
            ※誤送信にご注意ください。LINE公式アカウントからも送信内容を確認できます。
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
