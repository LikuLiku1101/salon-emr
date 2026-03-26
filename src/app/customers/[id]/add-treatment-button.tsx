"use client";

import { useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        await createDetailedTreatment(customerId);
      } catch (error) {
        console.error(error);
        toast.error("作成に失敗しました");
      }
    });
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
