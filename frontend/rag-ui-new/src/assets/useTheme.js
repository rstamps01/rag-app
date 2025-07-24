/**
 * Theme Hook for Dark/Light Mode Toggle
 * Manages theme state and provides utilities for theme switching
 */

import { useState, useEffect, useCallback } from 'react';

const useTheme = () => {
    const [theme, setTheme] = useState('dark');
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('pipeline-monitor-theme');
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const initialTheme = savedTheme || systemPreference;
        
        setTheme(initialTheme);
        applyTheme(initialTheme);
    }, []);

    // Apply theme to document
    const applyTheme = useCallback((newTheme) => {
        const root = document.documentElement;
        
        if (newTheme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
        
        // Update CSS custom properties for theme colors
        const themeColors = getThemeColors(newTheme);
        Object.entries(themeColors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    }, []);

    // Get theme-specific color values
    const getThemeColors = (themeName) => {
        const themes = {
            dark: {
                '--bg-primary': '#111827',      // gray-900
                '--bg-secondary': '#1F2937',    // gray-800
                '--bg-tertiary': '#374151',     // gray-700
                '--text-primary': '#F9FAFB',    // gray-50
                '--text-secondary': '#D1D5DB',  // gray-300
                '--text-muted': '#9CA3AF',      // gray-400
                '--border-color': '#4B5563',    // gray-600
                '--accent-primary': '#3B82F6',  // blue-500
                '--accent-secondary': '#10B981', // green-500
                '--accent-warning': '#F59E0B',  // yellow-500
                '--accent-error': '#EF4444',    // red-500
                '--node-bg': '#1F2937',         // gray-800
                '--node-border': '#4B5563',     // gray-600
                '--connection-color': '#6B7280', // gray-500
                '--grid-color': '#374151'       // gray-700
            },
            light: {
                '--bg-primary': '#FFFFFF',      // white
                '--bg-secondary': '#F9FAFB',    // gray-50
                '--bg-tertiary': '#F3F4F6',     // gray-100
                '--text-primary': '#111827',    // gray-900
                '--text-secondary': '#374151',  // gray-700
                '--text-muted': '#6B7280',      // gray-500
                '--border-color': '#D1D5DB',    // gray-300
                '--accent-primary': '#2563EB',  // blue-600
                '--accent-secondary': '#059669', // green-600
                '--accent-warning': '#D97706',  // yellow-600
                '--accent-error': '#DC2626',    // red-600
                '--node-bg': '#FFFFFF',         // white
                '--node-border': '#D1D5DB',     // gray-300
                '--connection-color': '#9CA3AF', // gray-400
                '--grid-color': '#E5E7EB'       // gray-200
            }
        };
        
        return themes[themeName] || themes.dark;
    };

    // Toggle between themes
    const toggleTheme = useCallback(() => {
        setIsTransitioning(true);
        
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        applyTheme(newTheme);
        localStorage.setItem('pipeline-monitor-theme', newTheme);
        
        // Reset transition state after animation
        setTimeout(() => {
            setIsTransitioning(false);
        }, 300);
    }, [theme, applyTheme]);

    // Set specific theme
    const setSpecificTheme = useCallback((newTheme) => {
        if (newTheme !== theme) {
            setIsTransitioning(true);
            setTheme(newTheme);
            applyTheme(newTheme);
            localStorage.setItem('pipeline-monitor-theme', newTheme);
            
            setTimeout(() => {
                setIsTransitioning(false);
            }, 300);
        }
    }, [theme, applyTheme]);

    // Get theme-aware class names
    const getThemeClasses = useCallback(() => {
        const baseClasses = {
            // Background classes
            bgPrimary: theme === 'dark' ? 'bg-gray-900' : 'bg-white',
            bgSecondary: theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50',
            bgTertiary: theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100',
            
            // Text classes
            textPrimary: theme === 'dark' ? 'text-gray-50' : 'text-gray-900',
            textSecondary: theme === 'dark' ? 'text-gray-300' : 'text-gray-700',
            textMuted: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
            
            // Border classes
            border: theme === 'dark' ? 'border-gray-600' : 'border-gray-300',
            borderLight: theme === 'dark' ? 'border-gray-700' : 'border-gray-200',
            
            // Interactive classes
            hover: theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
            active: theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200',
            
            // Status colors (consistent across themes)
            success: 'text-green-400',
            warning: 'text-yellow-400',
            error: 'text-red-400',
            info: 'text-blue-400',
            
            // Node-specific classes
            nodeBackground: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
            nodeBorder: theme === 'dark' ? 'border-gray-600' : 'border-gray-300',
            nodeHover: theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
            
            // Panel classes
            panelBackground: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
            panelBorder: theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        };
        
        return baseClasses;
    }, [theme]);

    // Get theme-aware colors for charts and visualizations
    const getChartColors = useCallback(() => {
        return {
            primary: theme === 'dark' ? '#3B82F6' : '#2563EB',
            secondary: theme === 'dark' ? '#10B981' : '#059669',
            warning: theme === 'dark' ? '#F59E0B' : '#D97706',
            error: theme === 'dark' ? '#EF4444' : '#DC2626',
            grid: theme === 'dark' ? '#374151' : '#E5E7EB',
            text: theme === 'dark' ? '#D1D5DB' : '#374151',
            background: theme === 'dark' ? '#1F2937' : '#FFFFFF'
        };
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleSystemThemeChange = (e) => {
            // Only auto-switch if user hasn't manually set a preference
            const savedTheme = localStorage.getItem('pipeline-monitor-theme');
            if (!savedTheme) {
                const systemTheme = e.matches ? 'dark' : 'light';
                setTheme(systemTheme);
                applyTheme(systemTheme);
            }
        };
        
        mediaQuery.addEventListener('change', handleSystemThemeChange);
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }, [applyTheme]);

    return {
        theme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
        isTransitioning,
        toggleTheme,
        setTheme: setSpecificTheme,
        getThemeClasses,
        getChartColors,
        themeColors: getThemeColors(theme)
    };
};

export default useTheme;

