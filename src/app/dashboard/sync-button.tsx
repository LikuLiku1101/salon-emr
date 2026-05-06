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
    // TODO: ここで /api/sync-spreadsheet などを叩く。現在はシミュレーション。
    await new Promise(r => setTimeout(r, 1500)); 
    setIsSyncing(false);
    setSuccess(true);
    toast.success('スプレッドシートに最新データを同期しました');
    
    setTimeout(() => setSuccess(false), 3000);
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
