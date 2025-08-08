import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const STORAGE_KEY = 'theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

type Theme = typeof LIGHT_THEME | typeof DARK_THEME;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getPreferredTheme = (): Theme => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && [LIGHT_THEME, DARK_THEME].includes(saved)) {
    return saved as Theme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(getPreferredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === LIGHT_THEME ? DARK_THEME : LIGHT_THEME));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
