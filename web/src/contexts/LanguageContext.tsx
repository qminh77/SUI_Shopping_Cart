'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '@/locales/en.json';
import vi from '@/locales/vi.json';

type Language = 'en' | 'vi';
type Translations = typeof en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = {
    en,
    vi,
};

// Helper function to get nested keys
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, key: string): string {
    return key.split('.').reduce((o, i) => (o ? o[i] : null), obj) as string;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'vi')) {
            setLanguageState(savedLang);
        }
        setIsLoaded(true);
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string, params?: Record<string, string | number>): string => {
        let value = getNestedValue(translations[language], key);
        if (!value) {
            console.warn(`Translation key not found: ${key}`);
            return key;
        }

        if (params) {
            Object.entries(params).forEach(([key, paramValue]) => {
                value = value.replace(new RegExp(`{${key}}`, 'g'), String(paramValue));
            });
        }

        return value;
    };

    if (!isLoaded) {
        return <div className="min-h-screen bg-background" />; // Prevent flash of default content
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
