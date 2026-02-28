'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '../../i18n/navigation';

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'pt-BR', label: 'Português (BR)', short: 'PT' },
] as const;

type LocaleCode = (typeof LANGUAGES)[number]['code'];

const LanguageSwitcher = () => {
  const locale = useLocale() as LocaleCode;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newLocale: LocaleCode) => {
    setOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-ui-divider hover:bg-ui-muted transition-colors text-sm font-medium text-text-primary disabled:opacity-50"
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
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-ui-surface border border-ui-divider rounded-md shadow-lg z-[200] overflow-hidden">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-ui-muted transition-colors text-sm"
            >
              <span
                className={
                  locale === lang.code
                    ? 'font-semibold text-brand-primary'
                    : 'text-text-primary'
                }
              >
                {lang.label}
              </span>
              {locale === lang.code && (
                <Check size={14} className="text-brand-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
