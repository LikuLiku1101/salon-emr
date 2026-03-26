"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDetailedTreatment } from "@/app/treatments/new/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function AddTreatmentSheetButton({ 
  customerId,
  className
}: { 
  customerId: string;
  className?: string;
}) {
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    setIsPending(true);
    try {
      await createDetailedTreatment(customerId);
    } catch (error: any) {
      if (error?.digest?.startsWith("NEXT_REDIRECT")) {
        // リダイレクトの場合は正常
        return;
      }
      console.error(error);
      toast.error("作成に失敗しました");
      setIsPending(false);
    }
  };

  return (
    <>
      {isPending && <LoadingSpinner />}
      <Button 
        size="sm" 
        disabled={isPending}
        onClick={handleClick}
        className={cn("h-10 px-4 font-bold bg-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/90 text-white", className)}
      >
        <Plus className="w-4 h-4 mr-2" />
        {isPending ? "作成中..." : "施術シートを追加"}
      </Button>
    </>
  );
}
