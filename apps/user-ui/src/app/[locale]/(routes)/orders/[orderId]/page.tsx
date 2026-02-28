'use client';

import apiClient from '../../../../../lib/api/client';
import {
  Loader2,
  PackageX,
  Check,
  ArrowLeft,
  MapPin,
  Phone,
  Package,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from '../../../../../i18n/navigation';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number; // Price per item in cents
  subtotal: number; // unitPrice * quantity in cents
  shopName?: string;
  sku?: string;
}

// Order status enum matches backend: PENDING, PAID, SHIPPED, DELIVERED, CANCELLED
type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  finalAmount: number;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
    phoneNumber?: string;
  };
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// Steps for order progress tracking
const ORDER_STEPS = [
  { key: 'PENDING', label: 'Order Placed', icon: Package },
  { key: 'PAID', label: 'Payment Confirmed', icon: Check },
  { key: 'SHIPPED', label: 'Shipped', icon: Package },
  { key: 'DELIVERED', label: 'Delivered', icon: Check },
] as const;

// Get the index of current status in the steps
const getStatusIndex = (status: OrderStatus): number => {
  if (status === 'CANCELLED') return -1;
  const index = ORDER_STEPS.findIndex((step) => step.key === status);
  return index >= 0 ? index : 0;
};

// Safe amount formatter - converts cents to dollars
const formatCents = (cents: number | undefined | null): string => {
  if (cents === undefined || cents === null || isNaN(cents)) {
    return '$0.00';
  }
  return `$${(cents / 100).toFixed(2)}`;
};

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiClient.get(`/orders/${orderId}`);
        // API returns order directly, not wrapped in { order: ... }
        setOrder(res.data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[40vh]">
        <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-[40vh] gap-4">
        <PackageX size={48} className="text-gray-400" />
        <p className="text-gray-600">{error || 'Order not found'}</p>
        <button
          onClick={() => router.push('/profile?active=My+Orders')}
          className="text-brand-primary hover:underline"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = order.status === 'DELIVERED';

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/profile?active=My+Orders')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Order #{order.orderNumber || order.id.slice(-6)}
          </h1>
          <p className="text-sm text-gray-500">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Cancelled Order Banner */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600 font-medium">
            This order has been cancelled.
          </p>
        </div>
      )}

      {/* Order Progress Tracker */}
      {!isCancelled && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Order Status
          </h2>

          {/* Progress Steps */}
          <div className="relative">
            {/* Progress Line Background */}
            <div className="absolute top-5 left-[5%] right-[5%] h-1 bg-gray-200 rounded-full" />
            {/* Progress Line Fill */}
            <div
              className="absolute top-5 left-[5%] h-1 bg-green-500 rounded-full transition-all duration-500"
              style={{
                width: `${
                  (currentStatusIndex / (ORDER_STEPS.length - 1)) * 90
                }%`,
              }}
            />

            {/* Step Indicators */}
            <div className="relative flex justify-between">
              {ORDER_STEPS.map((step, idx) => {
                // For DELIVERED status, all steps should show as completed
                const isCompleted = isDelivered || idx < currentStatusIndex;
                const isCurrent = !isDelivered && idx === currentStatusIndex;

                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center flex-1"
                  >
                    {/* Circle */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : isCurrent
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={20} strokeWidth={3} />
                      ) : (
                        <span className="text-sm font-semibold">{idx + 1}</span>
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={`mt-3 text-xs font-medium text-center max-w-[80px] ${
                        isCompleted
                          ? 'text-green-600'
                          : isCurrent
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery message */}
          {isDelivered && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700 text-sm font-medium">
                Your order has been delivered successfully!
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Order Items ({order.items?.length || 0})
          </h2>

          {order.items && order.items.length > 0 ? (
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  {/* Product Image */}
                  <div className="relative w-20 h-20 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-gray-200">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={24} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">
                      {item.productName}
                    </h3>
                    {item.shopName && (
                      <p className="text-xs text-gray-400">
                        Sold by {item.shopName}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Qty: {item.quantity} x {formatCents(item.unitPrice)}
                    </p>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      {formatCents(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No items in this order</p>
          )}
        </div>

        {/* Sidebar - Order Summary & Shipping */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Order Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCents(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCents(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{formatCents(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>{formatCents(order.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-3 border-t border-gray-200">
                <span>Total</span>
                <span className="text-brand-primary">
                  {formatCents(order.finalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-gray-500" />
                Shipping Address
              </h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-800">
                  {order.shippingAddress.fullName}
                </p>
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}
                  {order.shippingAddress.state &&
                    `, ${order.shippingAddress.state}`}{' '}
                  {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phoneNumber && (
                  <p className="flex items-center gap-1 mt-2 text-gray-500">
                    <Phone size={14} />
                    {order.shippingAddress.phoneNumber}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Payment
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span
                className={`text-sm font-medium px-2 py-1 rounded-full ${
                  order.paymentStatus === 'COMPLETED'
                    ? 'bg-green-100 text-green-700'
                    : order.paymentStatus === 'FAILED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
