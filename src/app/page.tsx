'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { Building2, Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
        <Building2 className="h-10 w-10 text-white animate-pulse" />
      </div>
      <div className="flex flex-col items-center">
        <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">CloudERP Suite</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
          Redirecting to your workspace...
        </p>
      </div>
    </div>
  );
}
