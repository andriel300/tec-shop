/**
 * DEPRECATED: This component is no longer used.
 *
 * The application now uses Stripe Checkout Sessions (hosted payment page)
 * instead of Stripe Elements (custom payment form).
 *
 * Users are redirected directly to Stripe's hosted checkout page from the cart.
 * This file can be safely deleted but i will still let this here because i will probably create a personal form.
 */

'use client';
import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import React from 'react';

const CheckoutForm = ({
  clientSecret,
  cartItems,
  coupon,
  sessionId,
}: {
  clientSecret: string;
  cartItems: Record<string, unknown>[];
  coupon: Record<string, unknown>;
  sessionId: string | null;
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<'success' | 'failed' | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?sessionId=${sessionId}`,
      },
    });

    if (result.error) {
      setStatus('failed');
      setErrorMsg(result.error.message || 'Something went wrong.');
    } else {
      setStatus('success');
    }

    setLoading(false);
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="flex justify-center items-center min-h-[80v] px-4 my-10">
      <form
        className="bg-white w-full max-w-lg p-8 rounded-md shadow space-y-6"
        onSubmit={handleSubmit}
      >
        <h2 className="text-3xl font-bold text-center mb-2">
          Secure Payment Checkout
        </h2>

        {/* Dynamic Order Summary */}
        <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-700 space-y-2">
          {cartItems.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm pb-1">
              <span>
                {item.quantity} x {item.name}{' '}
                {/* I dont know if we have item.title */}
              </span>
              <span>${(item.quantity * item.price).toFixed(2)}</span>
            </div>
          ))}

          <div className="flex justify-between font-semibold pt-2 border-t border-t-gray-300">
            {coupon?.discountAmount !== 0 && (
              <>
                <span>Discount</span>
                <span className="text-green-600">
                  ${(coupon?.discountAmount ?? 0).toFixed(2)}
                </span>
              </>
            )}
          </div>

          <div className="flex justify-between font-semibold mt-2">
            <span>Total</span>
            <span>${(total - coupon?.discountAmount).toFixed(2)}</span>
          </div>
        </div>

        <PaymentElement />
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium"
        >
          {loading && <Loader2 className="animate-spin w-5 h-5" />}
          {loading ? 'Processing Payment...' : 'Pay Now'}
        </button>

        {errorMsg && (
          <div className="flex items-center gap-2 text-red-600 text-sm justify-center">
            <XCircle className="w-5 h-5" /> {errorMsg}
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600 text-sm justify-center">
            <CheckCircle className="w-5 h-5" />
            Payment Sucessful!
          </div>
        )}

        {status === 'failed' && (
          <div className="flex items-center gap-2 text-green-600 text-sm justify-center">
            <CheckCircle className="w-5 h-5" />
            Payment failed. Please try again.
          </div>
        )}
      </form>
    </div>
  );
};

export default CheckoutForm;
