'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '../../i18n/navigation';
import { apiClient } from '../../lib/api/client';
import SearchDropdown from './SearchDropdown';
import { Input } from '../../components/ui/core/Input';

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

export interface Shop {
  id: string;
  businessName: string;
  category: string;
}

const SearchBar = () => {
  const t = useTranslations('Navbar');
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    products: Product[];
    shops: Shop[];
  }>({ products: [], shops: [] });

  const [isSearching, setIsSearching] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ products: [], shops: [] });
      setShow(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);

        const [productsRes, shopsRes] = await Promise.all([
          apiClient.get(
            `/public/products?search=${encodeURIComponent(query)}&limit=5`,
            { signal }
          ),
          apiClient.get(
            `/public/shops?search=${encodeURIComponent(query)}&limit=3`,
            { signal }
          ),
        ]);

        setResults({
          products: productsRes.data.products || [],
          shops: shopsRes.data.shops || [],
        });

        setShow(true);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'CanceledError') {
          console.error(err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    router.push(`/products?search=${encodeURIComponent(query)}`);
    setShow(false);
    setQuery('');
  };

  const clear = () => {
    setQuery('');
    setResults({ products: [], shops: [] });
    setShow(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShow(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative">
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShow(true)}
          placeholder={t('searchPlaceholder')}
          className={`w-full px-4 pr-[120px] border-2 border-brand-primary outline-none h-[55px] ${
            show ? 'rounded-t-md rounded-b-none' : 'rounded-md'
          }`}
        />

        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute top-1/2 -translate-y-1/2 right-[70px] p-2 hover:bg-ui-muted rounded-full transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        )}

        <button
          type="submit"
          className="w-[60px] cursor-pointer flex items-center justify-center h-[55px] bg-brand-primary rounded-r-md absolute top-0 right-0 hover:bg-brand-primary-800 transition-colors"
        >
          <Search color="#fff" size={24} />
        </button>
      </form>

      <SearchDropdown
        show={show}
        query={query}
        results={results}
        isSearching={isSearching}
        close={() => setShow(false)}
        clear={clear}
      />
    </div>
  );
};

export default React.memo(SearchBar);
