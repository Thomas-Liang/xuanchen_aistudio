import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export type Theme = 'sage' | 'ocean' | 'crimson' | 'amber';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Define both Brand colors (50-900) and Dark Background colors
type PaletteColors = Record<number, string> & {
  dark900: string;
  dark800: string;
  dark700: string;
};

const PALETTES: Record<Theme, PaletteColors> = {
  sage: {
    50: '#f5f7f7',
    100: '#e0e7e7',
    200: '#c1d0cf',
    300: '#9db4b3',
    400: '#759392',
    500: '#2F4F4F',
    600: '#264040',
    700: '#1f3333',
    800: '#1a2929',
    900: '#162222',
    // Backgrounds
    dark900: '#192222', // Deep Greenish Grey
    dark800: '#232e2e',
    dark700: '#344545',
  },
  ocean: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0369a1',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    // Backgrounds
    dark900: '#0f172a', // Slate 900
    dark800: '#1e293b', // Slate 800
    dark700: '#334155', // Slate 700
  },
  crimson: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#be123c',
    600: '#9f1239',
    700: '#881337',
    800: '#4c0519',
    900: '#881337',
    // Backgrounds
    dark900: '#2a0a10', // Deep Reddish Black
    dark800: '#3f1016',
    dark700: '#571820',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#b45309',
    600: '#92400e',
    700: '#78350f',
    800: '#451a03',
    900: '#78350f',
    // Backgrounds
    dark900: '#2a1b0a', // Deep Brownish Black
    dark800: '#3f2810',
    dark700: '#573918',
  }
};

const LOCAL_STORAGE_THEME_KEY = 'xuanchen_theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('sage');

  useEffect(() => {
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as Theme;
    if (savedTheme && PALETTES[savedTheme]) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      setTheme('sage');
      applyTheme('sage');
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const palette = PALETTES[newTheme];
    const root = document.documentElement;
    
    // Update variables
    Object.entries(palette).forEach(([key, color]) => {
      if (key.startsWith('dark')) {
        // Handle dark background vars: dark900 -> --dark-900
        const cssVar = `--dark-${key.replace('dark', '')}`;
        root.style.setProperty(cssVar, color);
      } else {
        // Handle numeric brand vars: 500 -> --brand-500
        root.style.setProperty(`--brand-${key}`, color);
      }
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: Object.keys(PALETTES) as Theme[] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};