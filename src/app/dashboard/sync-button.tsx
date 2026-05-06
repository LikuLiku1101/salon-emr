'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || '同期エラーが発生しました');
      }

      setSuccess(true);
      toast.success(`${data.count}件のデータをスプレッドシートに同期しました！`);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      toast.error(error.message || '同期に失敗しました。時間をおいて再試行してください。');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={isSyncing}
      className="bg-green-600 hover:bg-green-700 text-white font-black rounded-xl shadow-lg shadow-green-600/20 gap-2 h-11 px-6 transition-all active:scale-95"
    >
      {isSyncing ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : success ? (
        <Check className="w-4 h-4" />
      ) : (
        <RefreshCw className="w-4 h-4" />
      )}
      {isSyncing ? '同期中...' : success ? '同期完了' : 'シートに反映'}
    </Button>
  );
}
