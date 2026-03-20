"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteCustomer } from "./actions";
import { useRouter } from "next/navigation";

interface DeleteCustomerButtonProps {
  customerId: string;
  customerName: string;
}

export default function DeleteCustomerButton({ 
  customerId, 
  customerName 
}: DeleteCustomerButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm(`${customerName} 様のすべての情報を削除してもよろしいですか？\nこの操作は取り消せません。過去の施術記録や契約情報もすべて削除されます。`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteCustomer(customerId);
      if (result.success) {
        toast.success("お客様情報を削除しました");
        router.push("/customers");
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
      variant="outline" 
      size="sm" 
      disabled={isDeleting}
      onClick={handleDelete}
      className="h-10 px-4 font-bold border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
    >
      <Trash2 className="w-4 h-4 mr-2" />
      この顧客を削除
    </Button>
  );
}
