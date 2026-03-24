import { useEffect, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import type { Theme, FontSize } from '../context/ThemeContext';

const FONT_SIZES = {
    'small': '14px',
    'medium': '16px',
    'large': '18px',
    'extra-large': '20px'
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('questia_theme');
        return (saved as Theme) || 'dark';
    });

    const [fontSize, setFontSize] = useState<FontSize>(() => {
        const saved = localStorage.getItem('questia_font_size');
        return (saved as FontSize) || 'medium';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.setAttribute('data-theme', theme);
        localStorage.setItem('questia_theme', theme);
    }, [theme]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.style.setProperty('--font-size-base', FONT_SIZES[fontSize]);
        localStorage.setItem('questia_font_size', fontSize);
    }, [fontSize]);

    return (
        <ThemeContext.Provider value={{ theme, fontSize, setTheme, setFontSize }}>
            {children}
        </ThemeContext.Provider>
    );
}
