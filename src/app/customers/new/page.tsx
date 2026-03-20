import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
      return; // 実際はエラー表示などのハンドリングを追加
    }

    // 成功したら一覧画面へ戻る
    redirect("/customers");
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Link href="/customers" className="flex items-center text-sm text-muted-foreground hover:text-foreground w-fit mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        顧客一覧に戻る
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">新規顧客の登録</CardTitle>
          <CardDescription>
            新しいお客様の基本情報を入力してください。契約情報は登録後に追加できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCustomer} className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">お名前 <span className="text-red-500">*</span></Label>
                <Input id="name" name="name" placeholder="脱毛 花子" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name_kana">フリガナ</Label>
                <Input id="name_kana" name="name_kana" placeholder="ダツモウ ハナコ" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">性別</Label>
                <select 
                  id="gender" 
                  name="gender" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="女性"
                >
                  <option value="女性">女性</option>
                  <option value="男性">男性</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input id="phone" name="phone" type="tel" placeholder="090-1234-5678" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" name="email" type="email" placeholder="example@example.com" />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline">
                <Link href="/customers" className="text-inherit">キャンセル</Link>
              </Button>
              <Button type="submit">
                顧客を登録する
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
