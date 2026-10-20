import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const saved = (localStorage.getItem('cozynest_theme') as Theme) || 'light';

  const applyTheme = (theme: Theme) => {
    let resolved: 'light' | 'dark' = 'light';
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = theme;
    }

    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('cozynest_theme', theme);
    return resolved;
  };

  const initialResolved = applyTheme(saved);

  return {
    theme: saved,
    resolvedTheme: initialResolved,
    setTheme: theme => {
      const resolved = applyTheme(theme);
      set({ theme, resolvedTheme: resolved });
    }
  };
});
