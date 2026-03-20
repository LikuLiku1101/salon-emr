"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteContract } from "./contract-actions";
import { toast } from "sonner";

export default function DeleteContractButton({ 
  contractId, 
  customerId,
  courseName
}: { 
  contractId: string, 
  customerId: string,
  courseName: string
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`「${courseName}」の契約情報を削除してもよろしいですか？\nこの契約に紐付いていた施術履歴の回数カウントはリセットされます。`)) {
        return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteContract(contractId, customerId);
      if (result.success) {
        toast.success(`契約「${courseName}」を削除しました`);
      } else {
        toast.error(`削除に失敗しました: ${result.error}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("システムエラーが発生しました");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
      title="契約を削除"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
