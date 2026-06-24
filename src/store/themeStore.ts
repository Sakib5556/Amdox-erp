import { create } from 'zustand';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  toggleTheme: () => {
    if (typeof window === 'undefined') return;
    const currentTheme = useThemeStore.getState().theme;
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('erp_theme', nextTheme);
    set({ theme: nextTheme });
  },
  initializeTheme: () => {
    if (typeof window === 'undefined') return;
    const storedTheme = localStorage.getItem('erp_theme') as 'light' | 'dark';
    const defaultTheme = storedTheme || 'light';
    if (defaultTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: defaultTheme });
  }
}));
