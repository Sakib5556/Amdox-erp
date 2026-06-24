'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface AccessDeniedProps {
  role?: string;
  allowedRoles: string[];
}

export default function AccessDenied({ role, allowedRoles }: AccessDeniedProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
      <div className="bg-rose-50 p-4 rounded-full text-rose-600 border border-rose-100 shadow-sm animate-pulse">
        <ShieldAlert className="h-12 w-12" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-black text-slate-800 tracking-tight">Security Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your current account role (<strong className="uppercase text-slate-700">{role || 'Guest'}</strong>) is not authorized to view this company module.
        </p>
        <p className="text-[10px] text-slate-400">
          This operational module is restricted to: <span className="font-semibold text-indigo-600 uppercase">{allowedRoles.join(', ')}</span>.
        </p>
      </div>
    </div>
  );
}
