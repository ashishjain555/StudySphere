import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'studysphere_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Permanently lock to human-crafted Dark Mode as requested
  const [theme] = useState<ThemeMode>('dark');

  const applyThemeToDOM = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  };

  useEffect(() => {
    applyThemeToDOM('dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    // Kept as safe no-op since user requested permanent Dark Mode
  };

  const setTheme = () => {
    // Kept as safe no-op
  };

  return (
    <ThemeContext.Provider value={{ theme: 'dark', isDark: true, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
