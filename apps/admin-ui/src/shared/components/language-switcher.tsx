'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

type Language = 'en' | 'pt-BR';

const LANGUAGES: { code: Language; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'pt-BR', label: 'Português (BR)', short: 'PT' },
];

const STORAGE_KEY = 'preferred-language';

const LanguageSwitcher = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored === 'en' || stored === 'pt-BR') {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    setOpen(false);
  };

  if (!mounted) return null;

  const current = LANGUAGES.find((l) => l.code === language)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/20 hover:bg-white/10 transition-colors text-sm font-medium text-[#ecedee]"
        title="Change language"
      >
        <Globe size={15} className="flex-shrink-0" />
        <span>{current.short}</span>
        <ChevronDown
          size={13}
          className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#1c1c2e] border border-white/15 rounded-md shadow-lg z-[300] overflow-hidden">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/10 transition-colors text-sm"
            >
              <span
                className={
                  language === lang.code
                    ? 'font-semibold text-[#0085ff]'
                    : 'text-[#ecedee]'
                }
              >
                {lang.label}
              </span>
              {language === lang.code && (
                <Check size={14} className="text-[#0085ff]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
