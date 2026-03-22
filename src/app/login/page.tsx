'use client';

import { useState } from 'react';
import { login } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Lock, Mail, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--salon-purple)]/10 via-white to-[var(--salon-teal)]/10 p-4">
      {isSubmitting && <LoadingSpinner />}
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative">
        {/* 装飾用の背景 */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--salon-purple)] to-[var(--salon-teal)]" />
        
        <div className="p-8 sm:p-12 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl shadow-xl border overflow-hidden p-1.5 bg-white scale-110 mb-2">
              <img src="/icon.jpg" alt="SHINE Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-gray-900">SHINE管理</h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Login to your account</p>
            </div>
          </div>

          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  Email Address
                </Label>
                <div className="relative group">
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    required 
                    className="h-12 bg-gray-50 border-gray-100 rounded-xl px-4 focus:ring-[var(--salon-purple)]/20 focus:border-[var(--salon-purple)]/30 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                   <Lock className="w-3.5 h-3.5" />
                   Password
                </Label>
                <div className="relative group">
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    className="h-12 bg-gray-50 border-gray-100 rounded-xl px-4 focus:ring-[var(--salon-purple)]/20 focus:border-[var(--salon-purple)]/30 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>メールアドレスまたはパスワードが正しくありません。</span>
              </div>
            )}

            <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 bg-gradient-to-r from-[var(--salon-purple)] to-[var(--salon-purple)]/90 hover:to-[var(--salon-purple)] text-white font-black text-lg rounded-xl shadow-lg shadow-purple-100/50 hover:shadow-purple-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              ログイン
            </Button>
          </form>

          <div className="pt-6 text-center">
            <p className="text-xs text-gray-400 font-medium">
              &copy; 2026 SHINE Salon Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
