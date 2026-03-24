import { createContext, useContext } from 'react';

export type Theme = 'dark' | 'light';
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

export interface ThemeContextType {
    theme: Theme;
    fontSize: FontSize;
    setTheme: (theme: Theme) => void;
    setFontSize: (size: FontSize) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
