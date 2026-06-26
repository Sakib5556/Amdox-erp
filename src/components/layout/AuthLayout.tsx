'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Building2, Loader2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading Screen
  if (isLoading || (!isAuthenticated && !user)) {
    return (
      <div className="h-screen w-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 font-sans">
        <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
          <Building2 className="h-10 w-10 text-white animate-pulse" />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">CloudERP Suite</h2>
          <p className="text-xs text-slate-400 dark:text-slate-550 mt-1 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            Initializing secure database session...
          </p>
        </div>
      </div>
    );
  }

  // Double check: if user role route matching is needed in the future, we can add it here.
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      
      {/* Sidebar Navigation */}
      <Suspense fallback={<div className="w-64 border-r border-slate-200/40 dark:border-slate-800/40 shrink-0 bg-white dark:bg-slate-900" />}>
        <Sidebar />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 focus:outline-none">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
      
    </div>
  );
}
