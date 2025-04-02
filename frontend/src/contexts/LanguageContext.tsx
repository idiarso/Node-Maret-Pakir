import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsService } from '../services/api';
import { LanguageSettings } from '../types';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  translate: (key: string) => string;
  isLoading: boolean;
  refreshTranslations: () => Promise<void>;
}

const defaultLanguageContext: LanguageContextType = {
  currentLanguage: 'en',
  setLanguage: () => {},
  translate: (key: string) => key,
  isLoading: true,
  refreshTranslations: async () => {},
};

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext);

// Export as a named function declaration instead of an arrow function
export function useLanguage() {
  return useContext(LanguageContext);
}

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Try to load language preference from localStorage first
  const savedLanguage = localStorage.getItem('selectedLanguage');
  const [currentLanguage, setCurrentLanguage] = useState<string>(savedLanguage || 'en');
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLanguageSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await settingsService.getLanguageSettings();
      
      // If there's no saved language preference, use the default
      if (!savedLanguage) {
        setCurrentLanguage(settings.defaultLanguage || 'en');
      }
      
      // Set translations
      if (settings.translations) {
        setTranslations(settings.translations);
      }
    } catch (error) {
      console.error('Failed to load language settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch language settings from API on initial load
  useEffect(() => {
    fetchLanguageSettings();
  }, [savedLanguage]);

  // Set the current language
  const setLanguage = (language: string) => {
    setCurrentLanguage(language);
    // Store in localStorage for persistence
    localStorage.setItem('selectedLanguage', language);
  };

  // Function to manually refresh translations
  const refreshTranslations = async () => {
    await fetchLanguageSettings();
  };

  // Translate a key
  const translate = (key: string): string => {
    if (!translations[key]) {
      return key; // Return the key if no translation exists
    }

    return translations[key][currentLanguage] || translations[key]['en'] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        translate,
        isLoading,
        refreshTranslations,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}; 