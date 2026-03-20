"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteTreatment } from "./actions";

interface DeleteTreatmentButtonProps {
  treatmentId: string;
  customerId: string;
  visitDate: string;
}

export default function DeleteTreatmentButton({ 
  treatmentId, 
  customerId,
  visitDate 
}: DeleteTreatmentButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`${visitDate} の施術記録を削除してもよろしいですか？\nこの操作は取り消せません。`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteTreatment(treatmentId, customerId);
      if (result.success) {
        toast.success("施術記録を削除しました");
      } else {
        toast.error(result.error || "削除に失敗しました");
      }
    } catch (error) {
      console.error(error);
      toast.error("システムエラーが発生しました");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      disabled={isDeleting}
      onClick={handleDelete}
      className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
