/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Truck,
  CheckCircle,
  MapPin,
  ChevronLeft,
  Download,
  Copy,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'apps/seller-ui/src/lib/api/client';
import { Link } from 'apps/seller-ui/src/i18n/navigation';

interface OrderItem {
  id: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  sellerPayout: number;
  platformFee: number;
  sku?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  subtotalAmount: number;
  discountAmount: number;
  shippingCost: number;
  platformFee: number;
  finalAmount: number;
  trackingNumber?: string;
  shippingAddress: {
    name: string;
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

const fetchOrderDetails = async (orderId: string): Promise<Order> => {
  const res = await apiClient.get(`/orders/seller/${orderId}`);
  return res.data;
};

const updateOrderStatus = async (data: {
  orderId: string;
  status: string;
  trackingNumber?: string;
}) => {
  const res = await apiClient.post(`/orders/seller/${data.orderId}/status`, {
    status: data.status,
    trackingNumber: data.trackingNumber,
  });
  return res.data;
};

const DELIVERY_STEPS = [
  { key: 'PAID', label: 'Order Confirmed', Icon: CheckCircle },
  { key: 'SHIPPED', label: 'In Transit', Icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', Icon: CheckCircle },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'text-amber-500 bg-amber-500/10 border border-amber-500/20',
  PAID: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20',
  SHIPPED: 'text-blue-500 bg-blue-500/10 border border-blue-500/20',
  DELIVERED: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20',
  CANCELLED: 'text-red-500 bg-red-500/10 border border-red-500/20',
};

const OrderDetailsPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id: orderId } = use(params);
  const queryClient = useQueryClient();
  const [trackingInput, setTrackingInput] = useState('');

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order-details', orderId],
    queryFn: () => fetchOrderDetails(orderId),
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-details', orderId] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      toast.success('Order status updated');
      setTrackingInput('');
    },
    onError: () => toast.error('Failed to update order status'),
  });

  const handleStatusUpdate = (status: string) => {
    if (status === 'SHIPPED' && !order?.trackingNumber && !trackingInput) {
      toast.error('Enter a tracking number before marking as shipped');
      return;
    }
    updateStatusMutation.mutate({
      orderId,
      status,
      trackingNumber: trackingInput || undefined,
    });
  };

  const getStepState = (stepKey: string) => {
    if (!order) return 'pending';
    const order_sequence = ['PAID', 'SHIPPED', 'DELIVERED'];
    const currentIdx = order_sequence.indexOf(order.status);
    const stepIdx = order_sequence.indexOf(stepKey);
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'pending';
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-surface-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full min-h-screen bg-surface-dark p-8">
        <p className="text-gray-500 text-center">Order not found</p>
      </div>
    );
  }

  const totalEarnings = order.items.reduce(
    (sum, item) => sum + item.sellerPayout,
    0
  );

  return (
    <div className="w-full min-h-screen bg-surface-dark p-8">
      {/* Back link */}
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold
                   text-gray-500 hover:text-gray-900 uppercase tracking-widest
                   mb-6 transition-colors"
      >
        <ChevronLeft size={15} />
        Back to Orders
      </Link>

      {/* Order header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          {/* Order number + status badge */}
          <div className="flex items-center gap-3 mb-3">
            <h1 className="font-mono text-2xl font-bold text-gray-900 tracking-tight">
              {order.orderNumber}
            </h1>
            <span
              className={`px-3 py-0.5 text-xs font-semibold rounded-pill ${
                STATUS_BADGE[order.status] ?? 'text-gray-500 bg-surface-container'
              }`}
            >
              {order.status}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-start gap-8">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Order Date
              </p>
              <p className="text-sm text-gray-900">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {order.trackingNumber && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Tracking Number
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-gray-900">
                    {order.trackingNumber}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(order.trackingNumber!);
                      toast.success('Copied!');
                    }}
                  >
                    <Copy
                      size={13}
                      className="text-brand-primary-600 hover:text-brand-primary-700 transition-colors"
                    />
                  </button>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Payment Status
              </p>
              <p
                className={`text-sm font-semibold ${
                  order.paymentStatus === 'COMPLETED'
                    ? 'text-feedback-success'
                    : order.paymentStatus === 'FAILED'
                    ? 'text-feedback-error'
                    : 'text-feedback-warning'
                }`}
              >
                {order.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                       border border-surface-container-highest text-gray-900
                       text-sm font-medium hover:bg-surface-container-low
                       transition-colors"
          >
            <Download size={15} />
            Download Invoice
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                       bg-brand-primary-600 text-white text-sm font-semibold
                       hover:bg-brand-primary-700 transition-colors"
          >
            <Truck size={15} />
            Track Package
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery stepper */}
          <div className="bg-surface-container-lowest rounded-lg p-8 shadow-ambient">
            <div className="flex items-start w-full">
              {DELIVERY_STEPS.map((step, index) => {
                const state = getStepState(step.key);
                const { Icon } = step;
                const isLast = index === DELIVERY_STEPS.length - 1;

                return (
                  <div
                    key={step.key}
                    className="relative flex flex-col items-center flex-1"
                  >
                    {/* Connecting line (before each step except first) */}
                    {index > 0 && (
                      <div
                        className={`absolute top-6 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                          state === 'completed' || state === 'current'
                            ? 'bg-brand-primary-600'
                            : 'bg-surface-container-highest'
                        }`}
                      />
                    )}

                    {/* Circle */}
                    <div
                      className={`relative z-10 w-12 h-12 rounded-full flex items-center
                                  justify-center transition-colors ${
                        state === 'completed'
                          ? 'bg-brand-primary-600'
                          : state === 'current'
                          ? isLast
                            ? 'bg-emerald-500'
                            : 'bg-brand-primary-600'
                          : 'bg-surface-container border-2 border-surface-container-highest'
                      }`}
                    >
                      <Icon
                        size={20}
                        className={
                          state === 'pending' ? 'text-gray-400' : 'text-white'
                        }
                      />
                    </div>

                    {/* Label */}
                    <p
                      className={`mt-3 text-xs font-semibold uppercase tracking-widest text-center ${
                        state === 'current' && isLast
                          ? 'text-emerald-500'
                          : state === 'pending'
                          ? 'text-gray-400'
                          : 'text-gray-900'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ordered Items */}
          <div className="bg-surface-container-lowest rounded-lg shadow-ambient overflow-hidden">
            <div className="px-6 pt-6 pb-3">
              <h3 className="font-display text-lg font-semibold text-gray-900">
                Ordered Items ({order.items.length})
              </h3>
            </div>

            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Product Details
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Your Share
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr
                    key={item.id}
                    className={`border-b border-surface-container-low last:border-0 ${
                      i % 2 === 1 ? 'bg-surface' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-14 h-14 object-cover rounded-lg bg-surface-container shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-surface-container rounded-lg flex items-center justify-center shrink-0">
                            <Package size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.productName}
                          </p>
                          {item.sku && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.sku}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-mono font-medium text-gray-900">
                        {String(item.quantity).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-brand-primary-600">
                        ${(item.sellerPayout / 100).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Status update */}
            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
              <div className="px-6 py-5 border-t border-surface-container-low bg-surface">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                  Update Status
                </p>
                {order.status === 'PAID' && (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Enter tracking number"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      className="flex-1 px-4 py-2 bg-surface-container text-gray-900
                                 rounded-lg text-sm outline-none placeholder:text-gray-400
                                 focus:ring-2 focus:ring-brand-primary-600/30"
                    />
                    <button
                      onClick={() => handleStatusUpdate('SHIPPED')}
                      disabled={updateStatusMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-primary-600
                                 text-white text-sm font-medium rounded-lg
                                 hover:bg-brand-primary-700 disabled:opacity-50
                                 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      <Truck size={15} />
                      Mark as Shipped
                    </button>
                  </div>
                )}
                {order.status === 'SHIPPED' && (
                  <button
                    onClick={() => handleStatusUpdate('DELIVERED')}
                    disabled={updateStatusMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500
                               text-white text-sm font-medium rounded-lg
                               hover:bg-emerald-600 disabled:opacity-50
                               disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle size={15} />
                    Mark as Delivered
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5">
          {/* Earnings */}
          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-ambient">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Your Earnings
              </p>
              <div className="bg-brand-primary-600/10 p-1.5 rounded-md">
                <DollarSign size={14} className="text-brand-primary-600" />
              </div>
            </div>

            <p className="font-display text-4xl font-bold text-feedback-success mb-1">
              ${(totalEarnings / 100).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mb-5">
              Net payout after platform fees
            </p>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">
                  ${(order.subtotalAmount / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform Fee (10%)</span>
                <span className="text-feedback-error">
                  -${(order.platformFee / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-semibold pt-2.5 border-t border-surface-container-low">
                <span className="text-gray-900">Net Payout</span>
                <span className="text-gray-900">
                  ${(totalEarnings / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-ambient">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={13} className="text-brand-primary-600" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Shipping Address
              </p>
            </div>

            <p className="text-sm font-bold text-gray-900 mb-2">
              {order.shippingAddress.name}
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              {order.shippingAddress.street}
              <br />
              {order.shippingAddress.city}
              {order.shippingAddress.state &&
                `, ${order.shippingAddress.state}`}
              <br />
              {order.shippingAddress.zipCode}, {order.shippingAddress.country}
            </p>

            {/* Map placeholder */}
            <div className="mt-4 h-28 bg-surface-container rounded-lg overflow-hidden relative flex items-center justify-center">
              <svg
                viewBox="0 0 200 112"
                className="absolute inset-0 w-full h-full opacity-30"
                fill="none"
              >
                <rect width="200" height="112" fill="currentColor" className="text-surface-container-highest" />
                <circle cx="100" cy="48" r="18" stroke="currentColor" className="text-gray-400" strokeWidth="2" />
                <path d="M100 66 C100 66 82 85 82 92 C82 100 100 110 100 110 C100 110 118 100 118 92 C118 85 100 66 100 66Z" stroke="currentColor" className="text-gray-400" strokeWidth="2" />
              </svg>
              <MapPin size={28} className="text-gray-400 relative z-10" />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-ambient">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Order Summary
            </p>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Items Subtotal</span>
                <span className="text-gray-900">
                  ${(order.subtotalAmount / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping &amp; Handling</span>
                <span className="text-gray-900">
                  ${(order.shippingCost / 100).toFixed(2)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-feedback-success">
                    -${(order.discountAmount / 100).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-900">$0.00</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-surface-container-low flex items-baseline justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Total Order
              </p>
              <p className="font-display text-2xl font-bold text-brand-primary-600">
                ${(order.finalAmount / 100).toFixed(2)}
              </p>
            </div>

            <button
              className="mt-5 w-full py-3 bg-surface-container text-gray-900
                         rounded-lg text-xs font-semibold uppercase tracking-widest
                         hover:bg-surface-container-highest transition-colors"
            >
              Review Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
