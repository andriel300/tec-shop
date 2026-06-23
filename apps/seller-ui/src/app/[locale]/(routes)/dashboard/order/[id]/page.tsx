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
  ChevronDown,
  Download,
  Copy,
  DollarSign,
  ExternalLink,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'apps/seller-ui/src/lib/api/client';
import { Link } from 'apps/seller-ui/src/i18n/navigation';
import { exportInvoice } from 'apps/seller-ui/src/lib/utils/export-invoice';
import { useTranslations, useLocale } from 'next-intl';

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

const CARRIERS = [
  { value: 'fedex', label: 'FedEx' },
  { value: 'ups', label: 'UPS' },
  { value: 'usps', label: 'USPS' },
  { value: 'dhl', label: 'DHL Express' },
  { value: 'aramex', label: 'Aramex' },
  { value: 'sfexpress', label: 'SF Express' },
  { value: 'other', label: 'Other' },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'text-amber-500 bg-amber-500/10 border border-amber-500/20',
  PAID: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20',
  SHIPPED: 'text-blue-500 bg-blue-500/10 border border-blue-500/20',
  DELIVERED: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20',
  CANCELLED: 'text-red-500 bg-red-500/10 border border-red-500/20',
};

const FULFILLMENT_DOT: Record<string, string> = {
  PENDING: 'bg-amber-400 animate-pulse',
  PAID: 'bg-brand-primary-600 animate-pulse',
  SHIPPED: 'bg-blue-400',
  DELIVERED: 'bg-emerald-400',
  CANCELLED: 'bg-red-400',
};

const OrderDetailsPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id: orderId } = use(params);
  const t = useTranslations('SellerOrderDetail');
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [trackingInput, setTrackingInput] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isTxExpanded, setIsTxExpanded] = useState(false);

  const deliverySteps = [
    { key: 'PAID', label: t('stepOrderConfirmed'), Icon: CheckCircle },
    { key: 'SHIPPED', label: t('stepInTransit'), Icon: Truck },
    { key: 'DELIVERED', label: t('stepDelivered'), Icon: CheckCircle },
  ];

  const cancelReasons = [
    t('cancelReasonCustomer'),
    t('cancelReasonOutOfStock'),
    t('cancelReasonPricingError'),
    t('cancelReasonUnableToFulfill'),
    t('cancelReasonFraud'),
    t('cancelReasonOther'),
  ];

  const statusLabels: Record<string, string> = {
    PENDING: t('statusPending'),
    PAID: t('statusPaid'),
    SHIPPED: t('statusShipped'),
    DELIVERED: t('statusDelivered'),
    CANCELLED: t('statusCancelled'),
  };

  const paymentLabels: Record<string, string> = {
    PENDING: t('paymentPending'),
    COMPLETED: t('paymentCompleted'),
    FAILED: t('paymentFailed'),
    REFUNDED: t('paymentRefunded'),
  };

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order-details', orderId],
    queryFn: () => fetchOrderDetails(orderId),
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-details', orderId] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      toast.success(t('statusUpdated'));
      setTrackingInput('');
      setSelectedCarrier('');
      setShowCancelConfirm(false);
      setCancelReason('');
    },
    onError: () => toast.error(t('statusUpdateFailed')),
  });

  const handleStatusUpdate = (status: string) => {
    updateStatusMutation.mutate({
      orderId,
      status,
      trackingNumber: trackingInput.trim() || undefined,
    });
  };

  const handleCancel = () => {
    if (!cancelReason) {
      toast.error(t('selectCancellationReason'));
      return;
    }
    updateStatusMutation.mutate({ orderId, status: 'CANCELLED' });
  };

  const handleTrackPackage = () => {
    if (!order?.trackingNumber) return;
    window.open(
      `https://t.17track.net/en#nums=${order.trackingNumber}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleOpenMaps = () => {
    if (!order) return;
    const a = order.shippingAddress;
    const q = encodeURIComponent(
      `${a.street}, ${a.city}${a.state ? ', ' + a.state : ''} ${a.zipCode}, ${a.country}`
    );
    window.open(
      `https://maps.google.com/?q=${q}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const getStepState = (stepKey: string) => {
    if (!order) return 'pending';
    const seq = ['PAID', 'SHIPPED', 'DELIVERED'];
    const currentIdx = seq.indexOf(order.status);
    const stepIdx = seq.indexOf(stepKey);
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
        <p className="text-gray-500 text-center">{t('orderNotFound')}</p>
      </div>
    );
  }

  const totalEarnings = order.items.reduce((sum, item) => sum + item.sellerPayout, 0);
  const canCancel = order.status === 'PENDING' || order.status === 'PAID';
  const isTerminal = order.status === 'DELIVERED' || order.status === 'CANCELLED';

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
        {t('backToOrders')}
      </Link>

      {/* Order header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h1 className="font-mono text-2xl font-bold text-gray-900 tracking-tight">
              {order.orderNumber}
            </h1>
            <span
              className={`px-3 py-0.5 text-xs font-semibold rounded-pill ${STATUS_BADGE[order.status] ?? 'text-gray-500 bg-surface-container'
                }`}
            >
              {statusLabels[order.status] ?? order.status}
            </span>
          </div>

          <div className="flex flex-wrap items-start gap-8">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                {t('orderDate')}
              </p>
              <p className="text-sm text-gray-900">
                {new Date(order.createdAt).toLocaleDateString(locale, {
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
                  {t('trackingNumber')}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-gray-900">
                    {order.trackingNumber}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(order.trackingNumber!);
                      toast.success(t('copiedToClipboard'));
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
                {t('paymentStatus')}
              </p>
              <p
                className={`text-sm font-semibold ${order.paymentStatus === 'COMPLETED'
                    ? 'text-feedback-success'
                    : order.paymentStatus === 'FAILED'
                      ? 'text-feedback-error'
                      : 'text-feedback-warning'
                  }`}
              >
                {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() =>
              exportInvoice({
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                status: order.status,
                paymentStatus: order.paymentStatus,
                shippingAddress: order.shippingAddress,
                items: order.items,
                subtotalAmount: order.subtotalAmount,
                platformFee: order.platformFee,
                finalAmount: order.finalAmount,
              })
            }
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                       border border-surface-container-highest text-gray-900
                       text-sm font-medium hover:bg-surface-container-low
                       transition-colors"
          >
            <Download size={15} />
            {t('downloadInvoice')}
          </button>

          <button
            onClick={handleTrackPackage}
            disabled={!order.trackingNumber}
            title={
              !order.trackingNumber
                ? t('addTrackingFirst')
                : t('trackOn17track', { number: order.trackingNumber })
            }
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                       bg-brand-primary-600 text-white text-sm font-semibold
                       hover:bg-brand-primary-700 disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors"
          >
            <Truck size={15} />
            {t('trackPackage')}
            {order.trackingNumber && <ExternalLink size={12} />}
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery stepper */}
          <div className="bg-surface-container-lowest rounded-lg p-8 shadow-ambient">
            {order.status === 'CANCELLED' ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <X size={18} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-600">{t('orderCancelled')}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t('cancelledOn', {
                      date: new Date(order.updatedAt).toLocaleDateString(locale, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }),
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start w-full">
                {deliverySteps.map((step, index) => {
                  const state = getStepState(step.key);
                  const { Icon } = step;
                  const isLast = index === deliverySteps.length - 1;

                  return (
                    <div
                      key={step.key}
                      className="relative flex flex-col items-center flex-1"
                    >
                      {index > 0 && (
                        <div
                          className={`absolute top-6 right-1/2 w-full h-0.5 -translate-y-1/2 ${state === 'completed' || state === 'current'
                              ? 'bg-brand-primary-600'
                              : 'bg-surface-container-highest'
                            }`}
                        />
                      )}

                      <div
                        className={`relative z-10 w-12 h-12 rounded-full flex items-center
                                    justify-center transition-colors ${state === 'completed'
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

                      <p
                        className={`mt-3 text-xs font-semibold uppercase tracking-widest text-center ${state === 'current' && isLast
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
            )}
          </div>

          {/* Ordered Items */}
          <div className="bg-surface-container-lowest rounded-lg shadow-ambient overflow-hidden">
            <div className="px-6 pt-6 pb-3">
              <h3 className="font-display text-lg font-semibold text-gray-900">
                {t('orderedItems', { count: order.items.length })}
              </h3>
            </div>

            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    {t('colProductDetails')}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    {t('colQty')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    {t('colYourShare')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr
                    key={item.id}
                    className={`border-b border-surface-container-low last:border-0 ${i % 2 === 1 ? 'bg-surface' : ''
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
                              {t('skuLabel', { sku: item.sku })}
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
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5">

          {/* ── Fulfillment Card ── */}
          <div className="bg-surface-container-lowest rounded-lg shadow-ambient overflow-hidden">
            <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-surface-container-low">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                {t('fulfillment')}
              </p>
              <div
                className={`w-2 h-2 rounded-full ${FULFILLMENT_DOT[order.status] ?? 'bg-gray-300'
                  }`}
              />
            </div>

            {/* PENDING — awaiting payment */}
            {order.status === 'PENDING' && (
              <div className="px-6 py-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <Clock size={16} className="text-amber-500 shrink-0" />
                  <p className="text-sm font-semibold text-gray-900">
                    {t('awaitingPayment')}
                  </p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t.rich('awaitingPaymentDesc', {
                    paid: (chunks) => (
                      <span className="font-medium text-gray-900">{chunks}</span>
                    ),
                  })}
                </p>
              </div>
            )}

            {/* PAID — ready to ship */}
            {order.status === 'PAID' && (
              <div className="px-6 py-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-brand-primary-600 animate-pulse" />
                  <p className="text-sm font-semibold text-gray-900">
                    {t('readyToShip')}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  {t('readyToShipDesc')}
                </p>

                <select
                  value={selectedCarrier}
                  onChange={(e) => setSelectedCarrier(e.target.value)}
                  className="w-full bg-surface-container text-gray-900 text-sm
                             px-4 py-2.5 rounded-lg outline-none cursor-pointer"
                >
                  <option value="">{t('selectCarrier')}</option>
                  {CARRIERS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder={t('trackingNumberPlaceholder')}
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container text-gray-900
                             rounded-lg text-sm outline-none placeholder:text-gray-400
                             focus:ring-2 focus:ring-brand-primary-600/30"
                />

                <button
                  onClick={() => handleStatusUpdate('SHIPPED')}
                  disabled={updateStatusMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5
                             bg-brand-primary-600 text-white text-sm font-semibold
                             rounded-lg hover:bg-brand-primary-700 disabled:opacity-40
                             disabled:cursor-not-allowed transition-colors"
                >
                  <Truck size={15} />
                  {t('markAsShipped')}
                </button>
              </div>
            )}

            {/* SHIPPED — confirm delivery */}
            {order.status === 'SHIPPED' && (
              <div className="px-6 py-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Truck size={16} className="text-blue-500 shrink-0" />
                  <p className="text-sm font-semibold text-gray-900">
                    {t('packageInTransit')}
                  </p>
                </div>

                {order.trackingNumber && (
                  <div className="flex items-center justify-between bg-surface-container rounded-lg px-4 py-2.5">
                    <span className="text-xs font-mono text-gray-900">
                      {order.trackingNumber}
                    </span>
                    <button onClick={handleTrackPackage}>
                      <ExternalLink
                        size={13}
                        className="text-brand-primary-600 hover:text-brand-primary-700 transition-colors"
                      />
                    </button>
                  </div>
                )}

                <div className="flex items-start gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3">
                  <Clock size={14} className="text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-400 leading-relaxed">
                    {t.rich('waitingForConfirmation', {
                      delivered: (chunks) => (
                        <span className="font-semibold text-blue-300">{chunks}</span>
                      ),
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* DELIVERED */}
            {order.status === 'DELIVERED' && (
              <div className="px-6 py-5">
                <div className="flex items-center gap-2.5">
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                  <p className="text-sm font-semibold text-emerald-600">
                    {t('orderFulfilled')}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {t('deliveredOn', {
                    date: new Date(order.updatedAt).toLocaleDateString(locale, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }),
                  })}
                </p>
              </div>
            )}

            {/* CANCELLED */}
            {order.status === 'CANCELLED' && (
              <div className="px-6 py-5">
                <div className="flex items-center gap-2.5">
                  <X size={16} className="text-red-500 shrink-0" />
                  <p className="text-sm font-semibold text-red-600">
                    {t('orderCancelled')}
                  </p>
                </div>
              </div>
            )}

            {/* Cancel accordion — only for non-terminal states */}
            {canCancel && (
              <div className="border-t border-surface-container-low">
                <button
                  onClick={() => setShowCancelConfirm((v) => !v)}
                  className="w-full px-6 py-3.5 flex items-center justify-between
                             text-xs font-semibold text-red-500
                             hover:bg-red-500/5 transition-colors"
                >
                  <span>{t('cancelOrder')}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${showCancelConfirm ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {showCancelConfirm && (
                  <div className="px-6 pb-5 space-y-3">
                    <select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full bg-surface-container text-gray-900 text-sm
                                 px-4 py-2.5 rounded-lg outline-none cursor-pointer"
                    >
                      <option value="">{t('selectReason')}</option>
                      {cancelReasons.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleCancel}
                      disabled={!cancelReason || updateStatusMutation.isPending}
                      className="w-full py-2.5 bg-red-500 text-white text-sm
                                 font-semibold rounded-lg hover:bg-red-600
                                 disabled:opacity-40 disabled:cursor-not-allowed
                                 transition-colors"
                    >
                      {t('confirmCancellation')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Earnings ── */}
          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-ambient">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                {t('yourEarnings')}
              </p>
              <div className="bg-brand-primary-600/10 p-1.5 rounded-md">
                <DollarSign size={14} className="text-brand-primary-600" />
              </div>
            </div>

            <p className="font-display text-4xl font-bold text-feedback-success mb-1">
              ${(totalEarnings / 100).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mb-5">
              {t('netPayoutAfterFees')}
            </p>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('subtotal')}</span>
                <span className="text-gray-900">
                  ${(order.subtotalAmount / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('platformFee')}</span>
                <span className="text-feedback-error">
                  -${(order.platformFee / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-semibold pt-2.5 border-t border-surface-container-low">
                <span className="text-gray-900">{t('netPayout')}</span>
                <span className="text-gray-900">
                  ${(totalEarnings / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Shipping Address ── */}
          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-ambient">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-brand-primary-600" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  {t('shippingAddress')}
                </p>
              </div>
              <button
                onClick={handleOpenMaps}
                className="flex items-center gap-1 text-xs font-medium
                           text-brand-primary-600 hover:text-brand-primary-700
                           transition-colors"
              >
                <ExternalLink size={11} />
                {t('openInMaps')}
              </button>
            </div>

            <p className="text-sm font-bold text-gray-900 mb-1">
              {order.shippingAddress.name}
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              {order.shippingAddress.street}
              <br />
              {order.shippingAddress.city}
              {order.shippingAddress.state &&
                `, ${order.shippingAddress.state}`}
              <br />
              {order.shippingAddress.zipCode},{' '}
              {order.shippingAddress.country}
            </p>
            {order.shippingAddress.phoneNumber && (
              <p className="text-xs text-gray-500 mt-1.5">
                {order.shippingAddress.phoneNumber}
              </p>
            )}

            <button
              onClick={handleOpenMaps}
              className="mt-4 w-full h-20 bg-surface-container rounded-lg
                         flex items-center justify-center gap-2
                         hover:bg-surface-container-highest transition-colors group"
            >
              <MapPin
                size={18}
                className="text-gray-400 group-hover:text-brand-primary-600 transition-colors"
              />
              <span
                className="text-xs font-medium text-gray-400
                           group-hover:text-brand-primary-600 transition-colors"
              >
                {t('viewOnGoogleMaps')}
              </span>
              <ExternalLink
                size={11}
                className="text-gray-400 group-hover:text-brand-primary-600 transition-colors"
              />
            </button>
          </div>

          {/* ── Order Summary + Review Transaction ── */}
          <div className="bg-surface-container-lowest rounded-lg shadow-ambient overflow-hidden">
            <div className="p-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                {t('orderSummary')}
              </p>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('itemsSubtotal')}</span>
                  <span className="text-gray-900">
                    ${(order.subtotalAmount / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('shippingHandling')}</span>
                  <span className="text-gray-900">
                    ${(order.shippingCost / 100).toFixed(2)}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('discount')}</span>
                    <span className="text-feedback-success">
                      -${(order.discountAmount / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('tax')}</span>
                  <span className="text-gray-900">$0.00</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-surface-container-low flex items-baseline justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  {t('totalOrder')}
                </p>
                <p className="font-display text-2xl font-bold text-brand-primary-600">
                  ${(order.finalAmount / 100).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Review Transaction toggle */}
            <div className="border-t border-surface-container-low">
              <button
                onClick={() => setIsTxExpanded((v) => !v)}
                className="w-full px-6 py-4 flex items-center justify-between
                           hover:bg-surface-container-low/50 transition-colors"
              >
                <span className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  {t('reviewTransaction')}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition-transform duration-200 ${isTxExpanded ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {isTxExpanded && (
                <div className="px-6 pb-6 space-y-5">
                  {/* Status timeline */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      {t('statusTimeline')}
                    </p>
                    <div className="space-y-3.5">
                      <div className="flex items-start gap-3">
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-brand-primary-600 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-gray-900">
                            {t('timelineOrderPlaced')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleString(locale, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      {order.paymentStatus === 'COMPLETED' && (
                        <div className="flex items-start gap-3">
                          <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-gray-900">
                              {t('timelinePaymentReceived')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
                            </p>
                          </div>
                        </div>
                      )}

                      {(order.status === 'SHIPPED' ||
                        order.status === 'DELIVERED') && (
                          <div className="flex items-start gap-3">
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-900">
                                {t('timelineShipped')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {order.trackingNumber
                                  ? t('timelineTracking', { number: order.trackingNumber })
                                  : t('timelineNoTracking')}
                              </p>
                            </div>
                          </div>
                        )}

                      {order.status === 'DELIVERED' && (
                        <div className="flex items-start gap-3">
                          <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-gray-900">
                              {t('timelineDelivered')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.updatedAt).toLocaleString(locale, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      )}

                      {order.status === 'CANCELLED' && (
                        <div className="flex items-start gap-3">
                          <div className="mt-1.5 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-red-600">
                              {t('timelineCancelled')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.updatedAt).toLocaleString(locale, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fee breakdown */}
                  <div className="pt-4 border-t border-surface-container-low space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">{t('grossSale')}</span>
                      <span className="text-xs text-gray-900">
                        ${(order.subtotalAmount / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">
                        {t('platformFee')}
                      </span>
                      <span className="text-xs text-feedback-error">
                        -${(order.platformFee / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-surface-container-low">
                      <span className="text-xs font-semibold text-gray-900">
                        {t('netPayout')}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600">
                        ${(totalEarnings / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Dispute link */}
                  {!isTerminal && (
                    <a
                      href="mailto:seller-support@tec-shop.com"
                      className="flex items-center gap-1.5 text-xs text-gray-400
                                 hover:text-brand-primary-600 transition-colors"
                    >
                      <AlertCircle size={12} />
                      {t('reportIssue')}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
