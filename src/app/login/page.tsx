'use client';

import { useState } from 'react';
import { login } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfdfd] p-4">
      {isSubmitting && <LoadingSpinner />}
      
      <div className="w-full max-w-sm bg-white rounded-none border-t-2 border-[var(--salon-purple)] overflow-hidden relative">
        <div className="p-8 sm:p-10 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 mb-2">
              <img src="/icon.jpg" alt="SHINE Logo" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-gray-900">SHINE管理</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">下記よりログインしてください</p>
            </div>
          </div>

          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  className="h-11 bg-zinc-50 border-zinc-100 rounded-none px-4 focus:ring-0 focus:border-[var(--salon-purple)] transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Lock className="w-3.5 h-3.5" />
                   Password
                </Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  className="h-11 bg-zinc-50 border-zinc-100 rounded-none px-4 focus:ring-0 focus:border-[var(--salon-purple)] transition-all font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-[11px] font-bold text-red-600 bg-red-50 border-l-2 border-red-500 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>メールアドレスまたはパスワードが正しくありません。</span>
              </div>
            )}

            <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 bg-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/90 text-white font-black text-base rounded-none transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ログイン中...
                </>
              ) : (
                "ログイン"
              )}
            </Button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-[10px] text-gray-300 font-bold tracking-tighter">
              &copy; 2026 SHINE Salon Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
