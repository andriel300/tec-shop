import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

const FALLBACK_BRL_RATE = 5.5;

async function fetchBrlRate(): Promise<number> {
  const res = await fetch('/api/exchange-rate');
  if (!res.ok) return FALLBACK_BRL_RATE;
  const data = await res.json();
  return data.rate ?? FALLBACK_BRL_RATE;
}

export function useCurrency() {
  const locale = useLocale();
  const isBrl = locale === 'pt-BR';

  const { data: brlRate = FALLBACK_BRL_RATE } = useQuery({
    queryKey: ['exchange-rate', 'BRL'],
    queryFn: fetchBrlRate,
    enabled: isBrl,
    staleTime: 60 * 60 * 1000,  // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });

  const formatPrice = useCallback(
    (amount: number): string => {
      if (isBrl) {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(amount * brlRate);
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    },
    [isBrl, brlRate]
  );

  return { formatPrice };
}
