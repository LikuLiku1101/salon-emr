"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { Edit2 } from "lucide-react";
import { updateCustomer } from "./actions";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  name_kana: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
}

export default function EditCustomerDialog({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);

  async function action(formData: FormData) {
    const res = await updateCustomer(customer.id, formData);
    if (res.success) {
      toast.success("お客様情報を更新しました");
      setOpen(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button variant="outline" size="sm" className="h-8 gap-1.5 font-bold shadow-sm border-gray-200">
            <Edit2 className="w-3.5 h-3.5" />
            編集
          </Button>
        } 
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>お客様情報の編集</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-bold">お名前 <span className="text-red-500">*</span></Label>
            <Input id="name" name="name" defaultValue={customer.name} required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_kana" className="font-bold">フリガナ</Label>
              <Input id="name_kana" name="name_kana" defaultValue={customer.name_kana || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="font-bold">性別</Label>
              <select 
                id="gender" 
                name="gender" 
                defaultValue={customer.gender || "女性"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-bold"
              >
                <option value="女性">女性</option>
                <option value="男性">男性</option>
                <option value="その他">その他</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="font-bold">電話番号</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={customer.phone || ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold">メールアドレス</Label>
            <Input id="email" name="email" type="email" defaultValue={customer.email || ""} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <SubmitButton pendingText="保存中...">
              保存する
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
