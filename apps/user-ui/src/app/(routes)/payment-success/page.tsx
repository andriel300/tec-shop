'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Truck, Loader2, XCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import useStore from 'apps/user-ui/src/store';
import { apiClient } from 'apps/user-ui/src/lib/api/client';
import confetti from 'canvas-confetti';

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const router = useRouter();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      if (!sessionId) {
        setError('No session ID provided');
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
        console.error('Error processing payment:', err);
        setError('Failed to create order. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Processing your order...</p>
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
            Order Processing Failed
          </h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/cart')}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Cart
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
          Payment Successful!
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          Thank you for your purchase! Your order has been placed successfully.
        </p>

        {order && order.orderNumber && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600 mb-1">Order Number</p>
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
          View My Orders
        </button>

        <div className="mt-8 text-xs text-gray-400 break-all">
          Session ID: <span className="font-mono">{sessionId}</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
