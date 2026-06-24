'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasReset = localStorage.getItem('erp_db_reset_v2');
      if (!hasReset) {
        localStorage.clear();
        localStorage.setItem('erp_db_reset_v2', 'true');
        window.location.reload();
        return;
      }
    }
    useAuthStore.getState().initializeAuth();
    useThemeStore.getState().initializeTheme();
  }, []);

  return <>{children}</>;
}

