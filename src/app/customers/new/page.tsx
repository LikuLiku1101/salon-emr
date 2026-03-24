import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Smartphone } from "lucide-react";

import { revalidatePath } from "next/cache";
import { LineJoinDialog } from "@/components/line-join-dialog-wrapper";

export default async function NewCustomerPage() {
  const createCustomer = async (formData: FormData) => {
    "use server";
    
    const name = formData.get("name") as string;
    const name_kana = formData.get("name_kana") as string;
    const gender = formData.get("gender") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("customers")
      .insert([{ name, name_kana, gender, phone, email }])
      .select();

    if (error) {
      console.error(error);
      return;
    }

    // 成功したらキャッシュを更新して一覧画面へ戻る
    revalidatePath("/customers");
    redirect("/customers");
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-12">
      <div className="space-y-6">
        <Link href="/customers" className="flex items-center text-sm text-muted-foreground hover:text-foreground w-fit mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          顧客一覧に戻る
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-black">新規顧客の登録</CardTitle>
            <CardDescription className="font-bold">
              新しいお客様の基本情報を入力してください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCustomer} className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-bold">お名前 <span className="text-red-500">*</span></Label>
                  <Input id="name" name="name" placeholder="脱毛 花子" required className="h-11 shadow-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="name_kana" className="font-bold">フリガナ</Label>
                    <Input id="name_kana" name="name_kana" placeholder="ダツモウ ハナコ" className="h-11 shadow-sm" />
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="gender" className="font-bold">性別</Label>
                    <select 
                        id="gender" 
                        name="gender" 
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-bold"
                        defaultValue="女性"
                    >
                        <option value="女性">女性</option>
                        <option value="男性">男性</option>
                        <option value="その他">その他</option>
                    </select>
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-bold">電話番号</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="090-1234-5678" className="h-11 shadow-sm" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold">メールアドレス</Label>
                  <Input id="email" name="email" type="email" placeholder="example@example.com" className="h-11 shadow-sm" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" className="font-bold">
                  <Link href="/customers" className="text-inherit">キャンセル</Link>
                </Button>
                <Button type="submit" className="bg-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/90 font-black h-12 px-8 rounded-xl shadow-lg shadow-purple-100">
                  顧客を登録する
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="pt-12 border-t-2 border-dashed border-gray-100">
        <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
                <Smartphone className="w-8 h-8" />
                </div>
                <div className="text-left">
                <h3 className="text-xl font-black text-gray-900">お客様自身の入力で登録する</h3>
                <p className="text-xs text-gray-500 font-bold">
                    お客様のLINEと連携して、基本情報を入力してもらえます。
                </p>
                </div>
            </div>
            <LineJoinDialog />
        </div>
      </div>
    </div>
  );
}
