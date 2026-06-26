'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useAuthStore.getState().initializeAuth();
    useThemeStore.getState().initializeTheme();
  }, []);

  return <>{children}</>;
}

