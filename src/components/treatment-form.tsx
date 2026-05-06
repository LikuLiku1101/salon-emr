"use client";

import { LoadingSpinner } from "@/components/loading-spinner";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveTreatmentDetails, sendTreatmentLineMessage } from "@/app/treatments/[id]/actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Save, 
  MessageCircle, 
  Plus, 
  Minus, 
  Zap, 
  Edit3, 
  CheckCircle2, 
  CreditCard,
  User,
  Activity,
  Camera,
  UploadCloud,
  X,
  ImageIcon,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// タイプ定義
type TreatmentDetail = {
  id?: string;
  body_part: string;
  machine_type: 'IPL' | 'SHR';
  power_level: string;
};

type VisitInfo = {
  totalVisitsCount: number;
  contractVisitCount: number | null;
  contractName: string | undefined;
  contractInstallments: number | undefined;
  lastVisitDate: string | null;
  lastVisitId: string | null;
};

// テーブル・ポイント表示用のグループ分け（3段）
const TABLE_GROUPS = [
  ["おでこ", "ほほ", "口周り", "あご", "くび"],
  ["肩回り", "脇", "乳首", "ひざ", "足首から先", "胸", "お腹", "もも", "すね", "背中", "お尻"],
  ["Vライン", "Iライン", "Oライン", "睾丸", "陰茎"]
];

// 全部位の定義をテーブルグループから平坦化して生成
const GRID_PARTS = TABLE_GROUPS.flat();

// コース定義
const COURSES: Record<string, string[]> = {
  "フェイスセット": ["おでこ", "ほほ", "口周り", "あご", "くび"],
  "VIOセット": ["Vライン", "Iライン", "Oライン", "睾丸", "陰茎"],
  "腰から下セット": ["お尻", "もも", "ひざ", "すね", "足首から先"],
  "首から下セット": [
    "肩回り", "脇", "乳首", "ひざ", "足首から先",
    "胸", "お腹", "もも", "すね", "背中",
    "お尻", "Vライン", "Iライン", "Oライン", "睾丸", "陰茎"
  ],
  "全身脱毛": GRID_PARTS
};

// 1から50までのパワー配列作成
const POWERS = Array.from({ length: 50 }, (_, i) => (i + 1).toString());

// ----- 料金定義 -----

// 部位別料金
const PARTS_PRICING = {
  S_FACE: 2980,
  S_BODY: 3300,
  L_BODY: 4980,
  DELICATE: 5500
};

// どの部位がどの料金区分に該当するか
const PART_CATEGORIES: Record<string, number> = {
  // Sパーツ(顔)
  "おでこ": PARTS_PRICING.S_FACE, "ほほ": PARTS_PRICING.S_FACE, "口周り": PARTS_PRICING.S_FACE, "あご": PARTS_PRICING.S_FACE, "くび": PARTS_PRICING.S_FACE,
  // Sパーツ(身体)
  "肩回り": PARTS_PRICING.S_BODY, "脇": PARTS_PRICING.S_BODY, "乳首": PARTS_PRICING.S_BODY, "ひざ": PARTS_PRICING.S_BODY, "足首から先": PARTS_PRICING.S_BODY,
  // Lパーツ
  "胸": PARTS_PRICING.L_BODY, "お腹": PARTS_PRICING.L_BODY, "もも": PARTS_PRICING.L_BODY, "すね": PARTS_PRICING.L_BODY, "背中": PARTS_PRICING.L_BODY, "お尻": PARTS_PRICING.L_BODY,
  // デリケートゾーン
  "Vライン": PARTS_PRICING.DELICATE, "Iライン": PARTS_PRICING.DELICATE, "Oライン": PARTS_PRICING.DELICATE, "睾丸": PARTS_PRICING.DELICATE, "陰茎": PARTS_PRICING.DELICATE
};

// セット料金定義
const SET_PRICING: Record<string, Record<string, number>> = {
  "フェイスセット": { "1": 11500, "3": 32500, "6": 60000, "12": 115000 },
  "VIOセット": { "1": 20000, "3": 58000, "6": 110000, "12": 200000 },
  "腰から下セット": { "1": 25000, "3": 72000, "6": 140000, "12": 250000 },
  "首から下セット": { "1": 28000, "3": 80000, "6": 158000, "12": 280000 },
  "全身脱毛": { "1": 30000, "3": 85000, "6": 169000, "12": 300000 }
};

export default function TreatmentForm({ 
  treatment, 
  treatmentDetails,
  staffList,
  visitInfo,
  pagination
}: { 
  treatment: any, 
  treatmentDetails: TreatmentDetail[],
  staffList: { id: string, name: string }[],
  visitInfo: VisitInfo,
  pagination?: { prevId: string | null; nextId: string | null; }
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 予約時の内容（reserved_content）から、部位リストを復元
  const predictedParts: string[] = [];
  if (treatment.reserved_content) {
    // 1. コース名（全身脱毛など）と一致する場合、そのコースの全部位を展開
    if (COURSES[treatment.reserved_content]) {
      predictedParts.push(...COURSES[treatment.reserved_content]);
    } 
    // 2. コース名でない場合、カンマ区切りの部位リストとして展開
    else {
      predictedParts.push(...treatment.reserved_content.split("、"));
    }
  }

  // 施術実績が既にあればそれを使い、なければ予約内容を初期選択とする
  const [selectedParts, setSelectedParts] = useState<string[]>(
    treatmentDetails.length > 0 
      ? treatmentDetails.map(d => d.body_part) 
      : predictedParts
  );
  const [bulkMachineType, setBulkMachineType] = useState<'IPL' | 'SHR' | ''>('');
  const [bulkPower, setBulkPower] = useState<string>('');
  const [staffId, setStaffId] = useState<string>(treatment.staff_id || "");
  const [currentVisitDate, setCurrentVisitDate] = useState(treatment.visit_date);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 新規追加フィールドの状態
  const [paymentStatus, setPaymentStatus] = useState<string>(treatment.payment_status ?? "");
  const [paymentMethod, setPaymentMethod] = useState<string>(treatment.payment_method ?? "");
  const [paymentAmount, setPaymentAmount] = useState<string>(treatment.payment_amount?.toString() ?? "");
  const [handpieceIpl, setHandpieceIpl] = useState<string>(treatment.handpiece_ipl_count?.toString() ?? "");
  const [handpieceShr, setHandpieceShr] = useState<string>(treatment.handpiece_shr_count?.toString() ?? "");
  const [status, setStatus] = useState<string>(treatment.status ?? "通常");
  const [cancellationFee, setCancellationFee] = useState<string>(treatment.cancellation_fee?.toString() ?? "0");
  
  // 新規：本日一括支払い時のセット契約情報
  const [newSelectedSet, setNewSelectedSet] = useState<string>("");
  const [newSetInstallments, setNewSetInstallments] = useState<string>("3"); // 3, 6, 12

  // 表示モードの切り替え
  const [isEditMode, setIsEditMode] = useState(
    treatmentDetails.length === 0 && (!treatment.payment_status || treatment.payment_status === "") && (!treatment.image_paths || treatment.image_paths.length === 0)
  );

  // 画像関連の状態
  const [imagePaths, setImagePaths] = useState<string[]>(treatment.image_paths ?? []);
  const [isUploading, setIsUploading] = useState(false);
  const supabaseBrowser = createClient();
  const [isLineSending, setIsLineSending] = useState(false);

  const handleLineMessage = async () => {
    if (!treatment.customers?.line_user_id) {
       toast.error("LINE IDが登録されていません");
       return;
    }
    setIsLineSending(true);
    try {
      const result = await sendTreatmentLineMessage(treatment.id);
      if (result.success) toast.success("LINEでお礼メッセージを送信しました！");
      else toast.error(result.error);
    } catch (err) {
      toast.error("送信中にエラーが発生しました");
    } finally {
      setIsLineSending(false);
    }
  };

  // ----- 金額の自動計算ロジック -----
  const isFemale = treatment.customers?.gender === '女性';
  // 手動で金額が変更されたかどうかをトラッキング（自動計算を上書きさせないため）
  const [isAmountManuallyEdited, setIsAmountManuallyEdited] = useState(treatment.payment_amount !== null && treatment.payment_amount !== undefined);


  // 初期の部位ごとの出力データ
  // 形式: { "おでこ": { machine_type: 'IPL', power_level: '15' } }
  const initialDetailsState = treatmentDetails.reduce((acc, detail) => {
    // 既存データの部位名揺れ吸収（例: 口回り -> 口周り）
    let partName = detail.body_part;
    if (partName === '口回り') partName = '口周り';
    if (partName === '足首先') partName = '足首から先';

    acc[partName] = {
      machine_type: detail.machine_type,
      power_level: detail.power_level || ""
    };
    return acc;
  }, {} as Record<string, Omit<TreatmentDetail, 'body_part'>>);

  const [details, setDetails] = useState<Record<string, Omit<TreatmentDetail, 'body_part'>>>(initialDetailsState);

  useEffect(() => {
    // もし手動で金額入力されていたら、初期表示直後の自動計算はしないが、
    // プルダウン等が変更されたら自動計算を再度走らせる。
    // 今回はシンプルに、条件が変わるたびに再計算して値をセットする仕様にします。
    
    let total = 0;

    // 「一括支払い済み」の場合、セット・ポイントに関わらず基本0円。
    // （過去に支払っていたセットの消化来店のため）
    if (paymentStatus === '一括支払い済み') {
      // 2回目以降でもポイント（部位追加）をした分は加算する
      Object.keys(details).forEach(part => {
        const data = details[part];
        if (data && (data.power_level || "").trim() !== "") {
          total += PART_CATEGORIES[part] || 0;
        }
      });
      // 追加がなければ0にする
      if (total === 0) {
        setPaymentAmount('0');
        return;
      }
    }

    // 1. 本日一括支払いの場合（セット料金を加算）
    if (paymentStatus === '本日一括支払い' && newSelectedSet && newSetInstallments) {
      const setPrice = SET_PRICING[newSelectedSet]?.[newSetInstallments] || 0;
      total += setPrice;
    } 
    // 2. 都度払いの場合（処理された各部位の料金を加算）
    else if (paymentStatus === '都度') {
      // 現在 details テーブルに追加されているパーツの料金を合算
      Object.keys(details).forEach(part => {
        const data = details[part];
        if (data && (data.power_level || "").trim() !== "") {
          total += PART_CATEGORIES[part] || 0;
        }
      });
    }

    // 3. 女性割引（10%オフ）※端数切り捨て
    if (isFemale && total > 0) {
      total = Math.floor(total * 0.9);
    }

    // 変更時のみステート更新（手動編集されていない場合のみ）
    if (total > 0 || paymentStatus === '本日一括支払い' || paymentStatus === '都度') {
       if (!isAmountManuallyEdited) {
          setPaymentAmount(total.toString());
       }
    }
  }, [paymentStatus, newSelectedSet, newSetInstallments, details, isFemale, isAmountManuallyEdited]);

  // 予約時の内容から、コースまたは部位を初期化
  const [bookedCourse, setBookedCourse] = useState<string | null>(
    COURSES[treatment.reserved_content] ? treatment.reserved_content : null
  );
  const [bookedPoints, setBookedPoints] = useState<string[]>(
    COURSES[treatment.reserved_content] ? [] : (treatment.reserved_content ? treatment.reserved_content.split("、") : [])
  );

  const [visitTime, setVisitTime] = useState(treatment.visit_time ? treatment.visit_time.substring(0, 5) : "");

  const visitDate = new Date(currentVisitDate);

  // 部位の選択切り替え（出力表の上部にあるボタン）
  const togglePart = (part: string) => {
    setSelectedParts(prev => 
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
    );
  };

  // === 計算ロジック ===
  // コースとポイントで「予約された（施術予定の）すべての部位」を算出
  const bookedAllParts = new Set<string>();
  if (bookedCourse) {
    (COURSES[bookedCourse] || []).forEach(p => bookedAllParts.add(p));
  }
  bookedPoints.forEach(p => bookedAllParts.add(p));
  const bookedArray = Array.from(bookedAllParts);



  // コースの選択（トグル - 単一選択）
  const selectCourse = (courseName: string) => {
    setBookedCourse(prev => (prev === courseName ? null : courseName));
  };

  // ポイントの選択（複数選択）
  const togglePoint = (part: string) => {
    setBookedPoints(prev => 
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
    );
  };

  // 表へ反映ボタンを押した時の処理
  const applySettingsToTable = () => {
    if (selectedParts.length === 0) {
      toast.error("先に出力表の上から施術箇所を選択してください");
      return;
    }
    if (!bulkMachineType || !bulkPower) {
      toast.error("照射種類と強さを両方選択してください");
      return;
    }

    setDetails(prev => {
      const next = { ...prev };
      selectedParts.forEach(part => {
        next[part] = {
          ...(next[part] || {}),
          machine_type: bulkMachineType as 'IPL' | 'SHR',
          power_level: bulkPower
        };
      });
      return next;
    });

    // 反映したら選択状態を解除する
    setSelectedParts([]);
    toast.success("下の表に反映しました");
  };

  // 全クリア機能
  const clearAllDetails = () => {
    if (Object.keys(details).length === 0) return;
    setDetails({});
    toast.success("出力をすべてクリアしました");
  };

  // 個別クリア
  const clearPartDetail = (part: string) => {
    setDetails(prev => {
      const next = { ...prev };
      delete next[part];
      return next;
    });
  };

  // 画像アップロード処理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newPaths = [...imagePaths];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${treatment.id}/${Date.now()}-${i}.${fileExt}`;
        
        const { data, error } = await supabaseBrowser.storage
          .from('treatment-images')
          .upload(fileName, file);

        if (error) throw error;
        if (data) newPaths.push(data.path);
      }
      setImagePaths(newPaths);
      toast.success("画像をアップロードしました");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("画像のアップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (pathToRemove: string) => {
    setImagePaths(prev => prev.filter(p => p !== pathToRemove));
  };

  const getPublicUrl = (path: string) => {
    return supabaseBrowser.storage.from('treatment-images').getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async (formData: FormData) => {
    // === 保存前のチェック ===
    // 予約（コースやポイント）として選択されているが、出力が未入力の部位を探す
    const missingParts = bookedArray.filter(part => {
      const data = details[part];
      return !data || (data.power_level || "").trim() === '';
    });

    if (missingParts.length > 0) {
      const confirmMessage = `以下の施術予定部位の出力が入力されていません。\n\n${missingParts.join('、')}\n\nこのまま保存してよろしいでしょうか？`;
      if (!window.confirm(confirmMessage)) {
        return; // キャンセルされた場合は保存を中断
      }
    }

    setIsSubmitting(true);
    try {
      const detailsArray = Object.entries(details)
        .filter((entry) => (entry[1].power_level || "").trim() !== '') 
        .map(([part, data]) => ({
          body_part: part,
          machine_type: data.machine_type,
          power_level: data.power_level || ""
        }));

      const result = await saveTreatmentDetails(treatment.id, formData, detailsArray);
      
      if (result.success) {
        toast.success("カルテを保存しました");
        // 成功時は遷移するまでローディングを出し続ける
        window.location.href = "/treatments";
      } else {
        toast.error(`保存に失敗しました: ${result.error}`);
        setIsSubmitting(false);
      }
    } catch (error: any) {
      if (error?.digest?.startsWith("NEXT_REDIRECT")) {
        throw error; // リダイレクトはエラーではない
      }
      console.error(error);
      toast.error("システムエラーが発生しました");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24 max-w-4xl mx-auto bg-white min-h-screen relative text-slate-800"> 
      
      {/* 戻るボタンと前後の移動 */}
      <div className="p-4 flex items-center justify-between border-b">
        <Link href="/treatments" className="inline-flex items-center text-sm font-medium hover:underline text-[var(--salon-purple)] shrink-0 w-20">
          <ArrowLeft className="mr-1 h-4 w-4" />
          戻る
        </Link>
        
        <span className="font-semibold text-lg flex-1 text-center truncate">
          {isEditMode ? "施術シート入力" : "施術記録（来店履歴）"}
        </span>

        <div className="flex items-center justify-end gap-1 shrink-0 w-20">
          <Link 
            href={pagination?.prevId ? `/treatments/${pagination.prevId}` : '#'} 
            title="前の記録"
            className={cn(
              "p-2 rounded-md transition-colors", 
              pagination?.prevId ? "hover:bg-gray-100 text-gray-700" : "text-gray-200 pointer-events-none"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Link 
            href={pagination?.nextId ? `/treatments/${pagination.nextId}` : '#'} 
            title="次の記録"
            className={cn(
              "p-2 rounded-md transition-colors", 
              pagination?.nextId ? "hover:bg-gray-100 text-gray-700" : "text-gray-200 pointer-events-none"
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {isSubmitting && <LoadingSpinner />}

      <div className="px-4 py-6 space-y-8">
        
        {/* 顧客・来店概要カード */}
        <div className="bg-[var(--salon-purple)]/[0.03] border border-[var(--salon-purple)]/10 rounded-2xl p-5 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center flex-wrap gap-3">
                <h1 className="text-2xl font-black tracking-tight text-gray-900 group">
                  <Link href={`/customers/${treatment.customer_id}`} className="hover:text-[var(--salon-purple)] transition-colors flex items-center gap-1">
                    {treatment.customers?.name} 
                    <span className="text-sm font-normal text-gray-400">様</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </h1>
                <span className="bg-white border text-[10px] font-bold text-gray-400 px-2 py-0.5 rounded-full shadow-sm">
                  カルテ: {treatment.id.substring(0, 8)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                <span className="bg-white border border-[var(--salon-teal)]/20 text-[var(--salon-teal-dark)] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                  <Activity className="w-3 h-3" />
                  来店: {visitInfo.totalVisitsCount}回目
                </span>
                {visitInfo.lastVisitDate && (
                  <Link 
                    href={`/treatments/${visitInfo.lastVisitId}`}
                    className="bg-white border border-gray-200 text-gray-500 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    前回: {format(new Date(visitInfo.lastVisitDate), "M/d")}
                  </Link>
                )}
                {visitInfo.contractVisitCount !== null && visitInfo.contractName && (
                  <span className="bg-white border border-[var(--salon-purple)]/20 text-[var(--salon-purple)] px-2.5 py-1 rounded-lg shadow-sm">
                    {visitInfo.contractName} ({visitInfo.contractVisitCount}/{visitInfo.contractInstallments ?? "-"})
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1 border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100 min-w-fit">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">施術日 ・ 開始時間</span>
              <div className="text-2xl font-black text-gray-900 tabular-nums flex flex-col items-start sm:items-end leading-none">
                <span>{currentVisitDate ? format(visitDate, "yyyy.MM.dd", { locale: ja }) : "--"}</span>
                {visitTime && <span className="text-[var(--salon-purple)] text-xl mt-1">{visitTime.substring(0, 5)}〜</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-[var(--salon-purple)]/5">
            {/* 担当者選択 (上部に集約) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                担当スタッフ
              </Label>
              {isEditMode ? (
                <div className="relative">
                  <select
                    value={staffId || ""}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="h-11 w-full bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-800 px-4 outline-none focus:ring-2 focus:ring-[var(--salon-purple)]/20 transition-all cursor-pointer hover:border-[var(--salon-purple)]/30 appearance-none shadow-sm"
                  >
                    <option value="">選択してください</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              ) : (
                <div className="h-11 flex items-center px-4 bg-gray-50 border rounded-xl text-sm font-black text-gray-800">
                  {staffList.find(s => s.id === staffId)?.name || "未設定"}
                </div>
              )}
            </div>

            {/* 日付・時間変更 (編集モード時のみ詳細表示) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 flex items-center gap-2">
                 <Calendar className="w-3.5 h-3.5" />
                施術日時
              </Label>
              {isEditMode ? (
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    variant="outline"
                    className={cn(
                      "h-11 flex-1 font-bold text-xs rounded-xl shadow-sm border-gray-200",
                      showDatePicker && "border-[var(--salon-yellow)] bg-[var(--salon-yellow)]/5 text-[var(--salon-yellow-dark)]"
                    )}
                  >
                    日付を変更する
                  </Button>
                  <Input
                    type="time"
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="h-11 w-28 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-800"
                  />
                  {showDatePicker && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm sm:relative sm:inset-auto sm:p-0 sm:bg-transparent sm:backdrop-blur-none" onClick={() => setShowDatePicker(false)}>
                      <div className="bg-white p-6 rounded-2xl shadow-2xl border flex flex-col gap-4 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                         <Label className="font-bold text-gray-700">新しい日付を選択</Label>
                         <Input 
                          type="date" 
                          value={currentVisitDate}
                          onChange={(e) => {
                            setCurrentVisitDate(e.target.value);
                            setShowDatePicker(false);
                          }}
                          className="h-12 w-64 bg-white border-2 border-[var(--salon-purple)] text-lg font-bold"
                        />
                        <Button size="sm" variant="ghost" className="text-gray-400" onClick={() => setShowDatePicker(false)}>閉じる</Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-11 flex items-center px-4 bg-gray-50 border rounded-xl text-sm font-black text-gray-800 italic">
                  {format(visitDate, "yyyy年MM月dd日", { locale: ja })} {visitTime || ""}〜
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 来店ステータス選択 */}
        <div className="flex flex-col gap-4">
            <div className="bg-white px-5 py-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      status === "キャンセル" ? "bg-red-50 text-red-500" : "bg-[var(--salon-purple)]/10 text-[var(--salon-purple)]"
                    )}>
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Status</span>
                      <span className="font-bold text-gray-700">来店ステータス</span>
                    </div>
                </div>
                <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 w-full sm:w-auto">
                    <button 
                      type="button"
                      onClick={() => setStatus("通常")}
                      className={cn(
                        "flex-1 sm:flex-none sm:px-8 py-2.5 rounded-lg text-xs font-black transition-all shadow-sm",
                        status === "通常" ? "bg-[var(--salon-purple)] text-white" : "text-gray-400 hover:text-gray-600 bg-transparent shadow-none"
                      )}
                    >
                        通常施術
                    </button>
                    <button 
                      type="button"
                      onClick={() => setStatus("キャンセル")}
                      className={cn(
                        "flex-1 sm:flex-none sm:px-8 py-2.5 rounded-lg text-xs font-black transition-all shadow-sm",
                        status === "キャンセル" ? "bg-red-500 text-white" : "text-gray-400 hover:text-red-400 bg-transparent shadow-none"
                      )}
                    >
                        キャンセル
                    </button>
                </div>
            </div>

            {status === "キャンセル" && isEditMode && (
              <div className="bg-red-50 p-6 rounded-xl border-2 border-red-200 space-y-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
                <div className="flex items-center gap-2 text-red-600 font-bold">
                    <X className="w-5 h-5" />
                    キャンセル情報の入力
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-red-400">キャンセル料 (税込み)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-300 font-bold">¥</span>
                            <Input 
                                value={cancellationFee}
                                onChange={(e) => setCancellationFee(e.target.value)}
                                className="pl-8 h-12 text-lg font-black text-red-600 border-red-200 focus-visible:ring-red-100 bg-white"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>
                <p className="text-[10px] text-red-400 font-medium italic">※キャンセルとして保存され、カレンダーには赤色で残ります。既に次回予約がある場合はそのまま維持されます。</p>
              </div>
            )}

            {status === "キャンセル" && !isEditMode && (
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                            <X className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-red-600">この予約はキャンセルされました</h3>
                            <p className="text-xs text-red-400 font-bold">理由などは備考欄を確認してください</p>
                        </div>
                    </div>
                    {(parseInt(cancellationFee) > 0) && (
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-red-400 uppercase">キャンセル料</span>
                            <div className="text-2xl font-black text-red-600">¥{parseInt(cancellationFee).toLocaleString()}</div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {!isEditMode ? (
          /* ================== 閲覧モード (View Mode) ================== */
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-end gap-2">
              <Button 
                onClick={handleLineMessage} 
                disabled={isLineSending || !treatment.customers?.line_user_id}
                variant="outline" 
                size="sm"
                className={cn(
                  "font-bold border-emerald-500 text-emerald-600 hover:bg-emerald-50",
                  !treatment.customers?.line_user_id && "opacity-30 cursor-not-allowed grayscale"
                )}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {isLineSending ? "送信中..." : "LINEでお礼を送る"}
              </Button>
              <Button 
                onClick={() => setIsEditMode(true)} 
                variant="outline" 
                size="sm"
                className="font-bold border-[var(--salon-purple)] text-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/5"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                内容を編集する
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 施術概要カード */}
              <div className="border rounded-xl p-5 bg-white shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[var(--salon-purple)] font-black border-b pb-2">
                  <Activity className="w-5 h-5" />
                  <span>照射記録サマリー</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {treatmentDetails.length > 0 ? (
                    treatmentDetails.map((d, idx) => (
                      <div key={idx} className="bg-gray-50 border rounded-lg px-3 py-2 flex flex-col items-center min-w-[80px]">
                        <span className="text-[10px] font-bold text-gray-400">{d.body_part}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-black text-[var(--salon-purple)]">{d.machine_type}</span>
                          <span className="text-lg font-black text-gray-800">{d.power_level}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">記録がありません</p>
                  )}
                </div>
              </div>

              {/* お会計・数値カード */}
              <div className="border rounded-xl p-5 bg-white shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[var(--salon-purple)] font-black border-b pb-2">
                  <CreditCard className="w-5 h-5" />
                  <span>お会計・機器数値</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400">支払い状況</span>
                    <span className="font-bold text-sm">{treatment.payment_status || "未入力"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400">支払方法 / 金額</span>
                    <span className="font-bold text-sm">
                      {treatment.payment_method || "-"} / ¥{(treatment.payment_amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col border-t pt-2">
                    <span className="text-[10px] font-bold text-gray-400">IPL数値</span>
                    <span className="font-bold text-sm">{treatment.handpiece_ipl_count || "-"}</span>
                  </div>
                  <div className="flex flex-col border-t pt-2">
                    <span className="text-[10px] font-bold text-gray-400">SHR数値</span>
                    <span className="font-bold text-sm">{treatment.handpiece_shr_count || "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* メモ・次回予約 */}
            <div className="border rounded-xl p-5 bg-[var(--salon-purple)]/5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[var(--salon-purple)] font-black border-b border-[var(--salon-purple)]/20 pb-2">
                <MessageCircle className="w-5 h-5" />
                <span>メモ・次回予約</span>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block mb-1">特記事項</span>
                  <div className="bg-white p-3 rounded-lg border text-sm min-h-[60px] whitespace-pre-wrap">
                    {treatment.notes || "メモはありません"}
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block mb-1">次回予約</span>
                    <div className="flex items-center gap-2 font-black text-lg">
                      {treatment.next_reservation_date ? (
                        format(new Date(treatment.next_reservation_date), "yyyy/MM/dd")
                      ) : "未定"}
                      <span className="text-sm text-gray-400 ml-2">{treatment.next_reservation_time || ""}</span>
                    </div>
                  </div>
                  {treatment.is_next_reservation_line && (
                    <Badge className="bg-[#06C755] text-white border-0 font-bold px-3 py-1">LINE予約済</Badge>
                  )}
                </div>

                {/* 担当スタッフ追加（閲覧モード） */}
                <div className="bg-white p-4 rounded-lg border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block mb-1">担当スタッフ</span>
                    <div className="font-black text-lg flex items-center gap-2">
                       <User className="w-4 h-4 text-[var(--salon-purple)]" />
                       {staffList.find(s => s.id === staffId)?.name || "未設定"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 画像セクション (閲覧モード) */}
            {imagePaths.length > 0 && (
              <div className="border rounded-xl p-5 bg-white shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[var(--salon-purple)] font-black border-b pb-2">
                  <ImageIcon className="w-5 h-5" />
                  <span>施術写真</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imagePaths.map((path, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center group">
                      <img 
                        src={getPublicUrl(path)} 
                        alt={`施術写真 ${idx + 1}`}
                        className="object-cover w-full h-full cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(getPublicUrl(path), '_blank')}
                      />
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm("この写真を削除してもよろしいですか？")) {
                            const newPaths = imagePaths.filter(p => p !== path);
                            setImagePaths(newPaths);
                            // 閲覧モードでも即座にDB保存を試みる（簡易編集機能）
                            const formData = new FormData();
                            formData.append("image_paths", JSON.stringify(newPaths));
                            // 既存の施術詳細を保持して保存
                            const detailsArray = treatmentDetails.map(d => ({
                              body_part: d.body_part,
                              machine_type: d.machine_type,
                              power_level: d.power_level
                            }));
                            await saveTreatmentDetails(treatment.id, formData, detailsArray);
                            toast.success("写真を削除しました");
                          }
                        }}
                        className="absolute top-1.5 right-1.5 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md z-10 transition-colors"
                        title="画像を削除"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-8 flex justify-center">
               <Link href="/treatments" className="text-sm font-bold text-gray-400 hover:underline">
                  一覧に戻る
               </Link>
            </div>
          </div>
        ) : (
          /* ================== 入力モード (Edit/Input Mode) ================== */
          <>
            {/* コース/ポイント選択領域（アコーディオン） */}
        <Accordion className="w-full space-y-4">
          
          {/* コースエリア */}
          <AccordionItem value="course" className="border rounded-md px-1 bg-white shadow-sm overflow-hidden">
            <AccordionTrigger className="px-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:mb-2">
              <h3 className="text-lg font-bold border-l-4 border-[var(--salon-purple)] pl-2 text-gray-800">コースを選ぶ</h3>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-4">
              <div className="flex flex-wrap gap-x-3 gap-y-3 justify-start">
                {Object.keys(COURSES).map(course => (
                  <button
                    key={course}
                    type="button"
                    onClick={() => selectCourse(course)}
                    className={cn(
                      "py-2 px-4 text-sm font-bold shadow-sm min-w-[120px] active:scale-95 transition-transform border border-transparent rounded-sm",
                      bookedCourse === course
                        ? "bg-[var(--salon-teal-dark)] text-white"
                        : "bg-[var(--salon-teal)]/20 hover:bg-[var(--salon-teal)]/30 text-gray-900 border-[var(--salon-teal)]/30"
                    )}
                  >
                    {course}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ポイントエリア */}
          <AccordionItem value="point" className="border rounded-md px-1 bg-[var(--salon-teal)]/5 shadow-sm overflow-hidden">
            <AccordionTrigger className="px-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:mb-2">
              <h3 className="text-lg font-bold border-l-4 border-[var(--salon-yellow)] pl-2 text-gray-800">ポイントを選ぶ</h3>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-4">
              <div className="flex flex-col gap-3 justify-start items-start">
                {TABLE_GROUPS.map((group, idx) => (
                  <div key={idx} className="flex flex-wrap gap-1.5 justify-start">
                    {group.map(part => (
                      <button
                        key={`pt-${part}`}
                        type="button"
                        onClick={() => togglePoint(part)}
                        className={cn(
                          "py-1.5 px-2 text-xs font-bold shadow-sm transition-colors border active:scale-95 rounded-sm min-w-[60px]",
                          bookedPoints.includes(part)
                            ? "bg-[var(--salon-teal-dark)] text-white border-[var(--salon-teal-dark)]"
                            : "bg-white text-gray-900 border-[var(--salon-teal)]/40 hover:bg-[var(--salon-teal)]/10"
                        )}
                      >
                        {part}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* 出力表ラベル */}
        <div className="flex items-end gap-3 mt-10">
          <div className="bg-[var(--salon-purple)] text-white px-8 py-1 font-bold text-center">
            出力表
          </div>
          <span className="text-gray-700 text-sm font-medium mb-0.5">※複数選択可</span>
        </div>

        {/* 部位選択グリッド（出力表の上部、3段構成・左寄せ） */}
        <div className="flex flex-col gap-y-2 items-start">
          {TABLE_GROUPS.map((group, idx) => (
            <div key={idx} className="flex flex-wrap gap-x-2 gap-y-2 justify-start">
              {group.map((part) => {
                const isSelectedForEdit = selectedParts.includes(part);

                return (
                  <button
                    key={part}
                    type="button"
                    onClick={() => togglePart(part)}
                    className={cn(
                      "py-1.5 px-2 min-w-[64px] text-center font-bold text-xs shadow-sm transition-colors outline-none focus-visible:ring-2 active:scale-95 border",
                      isSelectedForEdit
                        ? "bg-[var(--salon-purple)] text-white border-[var(--salon-purple)]" // 編集のために選択中
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50" // 通常状態
                    )}
                  >
                    {part}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* アクションバー: 照射種類 / 強さ / 反映ボタン */}
        <div className="grid grid-cols-1 gap-3 bg-white p-4 rounded-xl border-2 border-[var(--salon-purple)] shadow-md">
          <div className="grid grid-cols-2 gap-3">
            {/* 照射種類 */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-[var(--salon-purple)] ml-1 uppercase">照射種類</Label>
              <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200 h-12">
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded-md font-bold text-base transition-all",
                    bulkMachineType === 'IPL' ? "bg-[var(--salon-purple)] text-white shadow-sm" : "text-[var(--salon-purple)] hover:bg-gray-100"
                  )}
                  onClick={() => setBulkMachineType('IPL')}
                >
                  IPL
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded-md font-bold text-base transition-all",
                    bulkMachineType === 'SHR' ? "bg-[var(--salon-purple)] text-white shadow-sm" : "text-[var(--salon-purple)] hover:bg-gray-100"
                  )}
                  onClick={() => setBulkMachineType('SHR')}
                >
                  SHR
                </button>
              </div>
            </div>

            {/* 出力（強さ） */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-[var(--salon-purple)] ml-1 uppercase">出力レベル</Label>
              <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200 h-12">
                <div className="flex-1 flex items-center justify-center relative">
                  <select
                    className="bg-transparent text-xl font-black text-center text-[var(--salon-purple)] outline-none w-full appearance-none relative z-10"
                    value={bulkPower}
                    onChange={(e) => setBulkPower(e.target.value)}
                  >
                    <option value="" disabled>--</option>
                    {POWERS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-[var(--salon-purple)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 反映ボタン */}
          <button
            type="button"
            onClick={applySettingsToTable}
            className="w-full bg-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/90 text-white font-bold h-12 rounded-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base"
          >
            <Zap className="w-4 h-4 fill-current" />
            表に反映する
          </button>
        </div>

        {/* 出力結果サマリー（モバイル対応グリッド） */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between pb-2 border-b">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--salon-purple)]" />
              現在の入力状況
            </h3>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={clearAllDetails}
              className="text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              すべてクリア
            </Button>
          </div>
          {TABLE_GROUPS.map((group, groupIdx) => {
            const groupLabels = ["フェイス", "ボディ", "デリケート"];
            return (
              <div key={groupIdx} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-gray-300 rounded-full" />
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{groupLabels[groupIdx]} エリア</h4>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {group.map((part) => {
                    const data = details[part];
                    const hasData = !!data && data.power_level !== "";
                    const isBooked = bookedArray.includes(part);

                    return (
                      <div
                        key={part}
                        className={cn(
                          "relative flex flex-col items-center justify-between border rounded-lg p-2 transition-all h-16 sm:h-20",
                          hasData 
                            ? "bg-[var(--salon-purple)]/5 border-[var(--salon-purple)]/30 ring-1 ring-[var(--salon-purple)]/20 shadow-sm" 
                            : isBooked
                            ? "bg-red-50 border-red-200 ring-1 ring-red-100 animate-pulse-subtle"
                            : "bg-gray-50 border-gray-200"
                        )}
                      >
                        {/* 個別クリアボタン */}
                        {hasData && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearPartDetail(part);
                            }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}

                        <span className={cn(
                          "text-[9px] sm:text-xs font-bold text-center leading-tight mb-1",
                          hasData ? "text-[var(--salon-purple)]" : isBooked ? "text-red-500" : "text-gray-400"
                        )}>
                          {part}
                        </span>
                        
                        <div className="flex-1 flex flex-col items-center justify-center w-full">
                          {hasData ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] sm:text-[9px] font-bold text-[var(--salon-purple)]/70 uppercase">
                                {data.machine_type}
                              </span>
                              <span className="text-sm sm:text-lg font-black text-[var(--salon-purple)] leading-none">
                                {data.power_level}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center opacity-30">
                              {isBooked ? (
                                <span className="text-[8px] sm:text-[10px] font-black text-red-400">未入力</span>
                              ) : (
                                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* 予約済みバッジ */}
                        {isBooked && !hasData && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 画像アップロードセクション (入力モード) */}
        <div className="space-y-4 pt-10 border-t">
          <h3 className="font-bold text-xl border-l-4 border-[var(--salon-purple)] pl-2 text-gray-800">施術写真の登録</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {imagePaths.map((path, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-100 bg-gray-50 group">
                <img src={getPublicUrl(path)} alt="preview" className="object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={() => removeImage(path)}
                  className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1.5 rounded-full transition-all shadow-md z-10"
                  title="削除"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            
            <label className={cn(
              "relative aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors gap-2",
              isUploading && "opacity-50 cursor-not-allowed"
            )}>
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-[var(--salon-purple)] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-bold text-gray-400">UP中...</span>
                </div>
              ) : (
                <>
                  <Camera className="w-6 h-6 text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-400">写真を追加</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={isUploading}
                onChange={handleImageUpload}
              />
            </label>
          </div>
          <p className="text-[10px] text-gray-400 font-medium italic">※複数枚アップロード、スマホでの撮影も可能です。</p>
        </div>

        {/* 次回予約・メモなどのフォーム */}
        <form action={handleSubmit} className="space-y-8 pt-10 pb-12 border-t border-gray-300">
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="cancellation_fee" value={cancellationFee} />
          {/* 画像パスを送信するための隠しフィールド */}
          <input type="hidden" name="image_paths" value={JSON.stringify(imagePaths)} />
          
          {/* フォームの状態を反映するための隠しフィールド */}
          <input type="hidden" name="visit_date" value={currentVisitDate} />
          <input type="hidden" name="visit_time" value={visitTime} />
          <input type="hidden" name="staff_id" value={staffId} />
          <input 
            type="hidden" 
            name="reserved_content" 
            value={bookedCourse ? (bookedPoints.length > 0 ? `${bookedCourse}、${bookedPoints.join('、')}` : bookedCourse) : bookedPoints.join('、')} 
          />
          
          {/* 来店・お支払い情報・ハンドピース */}
          <div className="space-y-6">
            <h3 className="font-bold text-xl border-l-4 border-[var(--salon-purple)] pl-2 text-gray-800">ご来店・お支払い情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md border">

              {/* 支払い状況 */}
              <div className="space-y-2">
                <Label className="font-bold text-gray-700">支払い状況</Label>
                <div className="flex gap-2 h-[82px]">
                  {['本日一括支払い', '一括支払い済み', '都度'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setPaymentStatus(status);
                        setIsAmountManuallyEdited(false); // 状況を変えたら自動計算を復活させる
                      }}
                      className={cn(
                        "flex-1 px-1 flex flex-col justify-center items-center text-[11px] xl:text-sm font-bold rounded-sm border transition-colors shadow-sm whitespace-pre-line leading-tight",
                        paymentStatus === status 
                          ? "bg-[var(--salon-purple)] text-white border-[var(--salon-purple)]" 
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      )}
                    >
                      {status.replace('一括支払い', '一括\n支払い')}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="payment_status" value={paymentStatus} />
              </div>

              {/* 支払方法 */}
              <div className="space-y-2">
                <Label className="font-bold text-gray-700">支払方法</Label>
                <div className="flex gap-2 h-[82px]">
                  {['現金', 'カード', 'せたぺい'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        "flex-1 px-1 flex flex-col justify-center items-center text-xs xl:text-sm font-bold rounded-sm border transition-colors shadow-sm",
                        paymentMethod === method 
                          ? "bg-[var(--salon-purple)] text-white border-[var(--salon-purple)]" 
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      )}
                    >
                      {method}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="payment_method" value={paymentMethod} />
              </div>

              {/* === 下段：支払金額とセット選択（本日一括時のみ） === */}
              {paymentStatus === '本日一括支払い' && (
                <div className="space-y-2 col-span-1 md:col-span-2 pt-2 border-t mt-2">
                  <Label className="font-bold text-[var(--salon-purple)]">本日契約するセット・回数を選択</Label>
                  <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-md border border-blue-200">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-600">セット</Label>
                      <select 
                        name="new_selected_set"
                        value={newSelectedSet} 
                        onChange={(e) => {
                          setNewSelectedSet(e.target.value);
                          setIsAmountManuallyEdited(false);
                        }}
                        className="w-full p-2 border rounded border-gray-300"
                      >
                        <option value="">選択してください</option>
                        {Object.keys(SET_PRICING).map(set => (
                          <option key={set} value={set}>{set}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-600">回数</Label>
                      <select 
                        name="new_set_installments"
                        value={newSetInstallments} 
                        onChange={(e) => {
                          setNewSetInstallments(e.target.value);
                          setIsAmountManuallyEdited(false);
                        }}
                        className="w-full p-2 border rounded border-gray-300"
                      >
                        <option value="3">3回</option>
                        <option value="6">6回</option>
                        <option value="12">12回</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 col-span-1 md:col-span-2 pt-2">
                <Label htmlFor="payment_amount" className="font-bold text-gray-700">支払金額 {isFemale && <span className="text-[var(--salon-magenta)] text-xs ml-2">※女性10%オフ適用</span>}</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    id="payment_amount" 
                    name="payment_amount" 
                    placeholder="例: 15000"
                    value={paymentAmount}
                    onChange={(e) => {
                      setPaymentAmount(e.target.value);
                      setIsAmountManuallyEdited(true); // 手動変更フラグを立てる
                    }}
                    className="h-12 bg-white font-medium text-lg pl-8"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">¥</span>
                </div>
              </div>
            </div>

            {/* ハンドピース数値記録 */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md border mt-4">
              <div className="space-y-2">
                <Label htmlFor="handpiece_ipl_count" className="font-bold text-gray-700">IPL 数値記録</Label>
                <Input 
                  type="number" 
                  id="handpiece_ipl_count" 
                  name="handpiece_ipl_count" 
                  placeholder="例: 10500"
                  value={handpieceIpl}
                  onChange={(e) => setHandpieceIpl(e.target.value)}
                  className="h-11 bg-white font-medium text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="handpiece_shr_count" className="font-bold text-gray-700">SHR 数値記録</Label>
                <Input 
                  type="number" 
                  id="handpiece_shr_count" 
                  name="handpiece_shr_count" 
                  placeholder="例: 22000"
                  value={handpieceShr}
                  onChange={(e) => setHandpieceShr(e.target.value)}
                  className="h-11 bg-white font-medium text-lg"
                />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="font-bold text-xl border-l-4 border-gray-600 pl-2 text-gray-800">メモと次回予約</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-xl border">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-y-2">
                  <Label htmlFor="next_reservation_date" className="font-bold text-gray-700 whitespace-nowrap">次回予約日</Label>
                  <label className="flex items-center gap-1.5 cursor-pointer group bg-white px-2 py-1 rounded-md border shadow-sm">
                    <input 
                      type="checkbox" 
                      name="is_next_reservation_line" 
                      defaultChecked={treatment.is_next_reservation_line}
                      className="w-4 h-4 rounded border-gray-300 text-[#06C755] focus:ring-[#06C755]"
                    />
                    <span className="text-[10px] sm:text-xs font-bold text-[#06C755] flex items-center gap-0.5">
                      <MessageCircle className="w-3 h-3 fill-current" />
                      LINEで予約
                    </span>
                  </label>
                </div>
                <Input 
                  type="date" 
                  id="next_reservation_date" 
                  name="next_reservation_date" 
                  defaultValue={treatment.next_reservation_date || ""}
                  className="h-11 bg-white font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_reservation_time" className="font-bold text-gray-700">時間</Label>
                <Input 
                  type="time" 
                  id="next_reservation_time" 
                  name="next_reservation_time" 
                  defaultValue={treatment.next_reservation_time || ""}
                  className="h-11 bg-white font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="font-bold text-gray-700">特記事項・肌状態など</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                placeholder="次回の出力予定や赤みの状態などを入力"
                defaultValue={treatment.notes || ""}
                className="min-h-32 text-base p-4 border-gray-300 shadow-sm"
              />
            </div>
          </div>
          
          {/* 保存ボタン。フローティングで固定 */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)] z-50 sm:static sm:bg-transparent sm:border-t-0 sm:shadow-none sm:p-0 mt-8">
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold shadow-lg bg-[var(--salon-magenta)] hover:bg-[var(--salon-magenta)]/90 text-white border-0" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "保存中..." : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  カルテを保存する
                </>
              )}
            </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
