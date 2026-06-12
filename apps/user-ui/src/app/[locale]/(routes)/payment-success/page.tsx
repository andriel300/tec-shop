'use client';

import { createLogger } from '@tec-shop/next-logger';
import React, { Suspense, useEffect, useState } from 'react';

const logger = createLogger('user-ui:payment-success');
import { CheckCircle, Truck, Loader2, XCircle } from 'lucide-react';
import { useRouter } from '../../../../i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import useStore from '../../../../store';
import { apiClient } from '../../../../lib/api/client';
import confetti from 'canvas-confetti';
import { useTranslations } from 'next-intl';

type Order = {
  orderNumber: string;
  [key: string]: unknown;
};

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('PaymentSuccess');

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      if (!sessionId) {
        setError(t('errorNoSession'));
        setLoading(false);
        return;
      }

      try {
        // Call backend to process the successful payment and create order
        const response = await apiClient.get(`/orders/success/${sessionId}`);
        setOrder(response.data);

        // Invalidate orders cache so profile page shows the new order
        queryClient.invalidateQueries({ queryKey: ['orders'] });

        // Clear cart and trigger confetti
        useStore.setState({ cart: [] });
        confetti({
          particleCount: 100,
          spread: 360,
          origin: { x: 0.5, y: 0.5 },
        });
      } catch (err) {
        logger.error('Error processing payment:', { error: err });
        setError(t('errorFailed'));
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [sessionId, t]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <XCircle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {t('errorTitle')}
          </h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/cart')}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700"
          >
            {t('backToCart')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-8 max-w-md text-center">
        <div className="text-green-500 mb-4">
          <CheckCircle className="w-16 h-16 mx-auto" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          {t('successTitle')}
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          {t('successMessage')}
        </p>

        {order && order.orderNumber && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600 mb-1">{t('orderNumber')}</p>
            <p className="text-lg font-semibold font-mono text-gray-800">
              {order.orderNumber as string}
            </p>
          </div>
        )}

        <button
          onClick={() => router.push('/profile?active=My+Orders')}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
        >
          <Truck className="w-4 h-4" />
          {t('viewMyOrders')}
        </button>

        <div className="mt-8 text-xs text-gray-400 break-all">
          {t('sessionId')} <span className="font-mono">{sessionId}</span>
        </div>
      </div>
    </div>
  );
};

export default function PaymentPageWrapper() {
  const t = useTranslations('PaymentSuccess');
  return (
    <Suspense fallback={<div>{t('suspenseFallback')}</div>}>
      <PaymentSuccessPage />
    </Suspense>
  );
}
