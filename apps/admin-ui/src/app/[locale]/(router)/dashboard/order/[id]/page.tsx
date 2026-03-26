/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Phone,
  DollarSign,
  Calendar,
  Tag,
  AlertCircle,
  ChevronLeft,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../../../../../lib/api/client';
import { Link } from 'apps/admin-ui/src/i18n/navigation';

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

const getStatusConfig = (status: string) => {
  const configs: Record<
    string,
    { icon: typeof Clock; color: string; bg: string; border: string }
  > = {
    PENDING:   { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
    PAID:      { icon: CheckCircle,  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    SHIPPED:   { icon: Truck,        color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
    DELIVERED: { icon: Package,      color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20'  },
    CANCELLED: { icon: AlertCircle,  color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
  };
  return configs[status] ?? configs.PENDING;
};

const deliverySteps = [
  { key: 'PAID',      label: 'Order Confirmed', icon: CheckCircle },
  { key: 'SHIPPED',   label: 'In Transit',      icon: Truck       },
  { key: 'DELIVERED', label: 'Delivered',        icon: Package     },
];

const OrderDetailsPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id: orderId } = use(params);
  const queryClient = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState('');

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order-details', orderId],
    queryFn: () => fetchOrderDetails(orderId),
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-details', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated successfully');
      setTrackingNumber('');
    },
    onError: () => {
      toast.error('Failed to update order status');
    },
  });

  const handleStatusUpdate = (status: string) => {
    if (status === 'SHIPPED' && !order?.trackingNumber && !trackingNumber) {
      toast.error('Please enter a tracking number before marking as shipped');
      return;
    }
    updateStatusMutation.mutate({
      orderId,
      status,
      trackingNumber: trackingNumber || undefined,
    });
  };

  const getStepStatus = (stepKey: string) => {
    if (!order) return 'pending';
    const steps = ['PAID', 'SHIPPED', 'DELIVERED'];
    const currentIndex = steps.indexOf(order.status);
    const stepIndex = steps.indexOf(stepKey);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full min-h-screen p-8">
        <div className="text-center text-gray-500 mt-20">Order not found</div>
      </div>
    );
  }

  const totalPlatformFee = order.items.reduce(
    (sum, item) => sum + item.platformFee,
    0
  );
  const totalSellerPayout = order.items.reduce(
    (sum, item) => sum + item.sellerPayout,
    0
  );
  const statusCfg = getStatusConfig(order.status);
  const StatusIcon = statusCfg.icon;

  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-200
                     transition-colors mb-4 text-sm"
        >
          <ChevronLeft size={16} />
          Back to Orders
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Dashboard</span>
          <span>/</span>
          <Link href="/dashboard/orders" className="hover:text-gray-300 transition-colors">
            Orders
          </Link>
          <span>/</span>
          <span className="text-gray-300 font-medium">Order Details</span>
        </div>
        <h1 className="text-4xl font-bold text-white">Order Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-1">
                  Order Number
                </p>
                <p className="text-white text-2xl font-mono font-bold">
                  {order.orderNumber}
                </p>
              </div>
              <span
                className={`px-3 py-1.5 rounded-lg border text-sm font-semibold
                            flex items-center gap-2 ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
              >
                <StatusIcon size={15} />
                {order.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 flex items-center gap-1.5 mb-1">
                  <Calendar size={13} />
                  Order Date
                </p>
                <p className="text-gray-200">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-gray-500 text-xs">
                  {new Date(order.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div>
                <p className="text-gray-500 flex items-center gap-1.5 mb-1">
                  <Tag size={13} />
                  Payment Status
                </p>
                <p
                  className={`font-semibold ${
                    order.paymentStatus === 'COMPLETED'
                      ? 'text-emerald-400'
                      : order.paymentStatus === 'FAILED'
                      ? 'text-red-400'
                      : 'text-amber-400'
                  }`}
                >
                  {order.paymentStatus}
                </p>
              </div>

              {order.trackingNumber && (
                <div>
                  <p className="text-gray-500 flex items-center gap-1.5 mb-1">
                    <Truck size={13} />
                    Tracking
                  </p>
                  <p className="text-gray-200 font-mono text-xs">
                    {order.trackingNumber}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Progress */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-6">
              Delivery Progress
            </h3>

            <div className="flex items-start justify-between w-full relative">
              {deliverySteps.map((step, index) => {
                const status = getStepStatus(step.key);
                const Icon = step.icon;
                const isActive = status === 'completed' || status === 'current';

                return (
                  <div
                    key={step.key}
                    className="relative flex flex-col items-center text-center w-full"
                  >
                    {index > 0 && (
                      <div
                        className={`absolute -left-1/2 top-6 w-full h-0.5 ${
                          isActive ? 'bg-brand-primary-600' : 'bg-gray-800'
                        }`}
                      />
                    )}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center
                                  border-2 z-10 transition-colors ${
                        status === 'completed'
                          ? 'bg-brand-primary-600 border-brand-primary-600 text-white'
                          : status === 'current'
                          ? 'bg-brand-primary-600/10 border-brand-primary-600 text-brand-primary-400'
                          : 'bg-gray-800 border-gray-700 text-gray-600'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="mt-3">
                      <p
                        className={`text-sm font-semibold ${
                          status === 'pending' ? 'text-gray-600' : 'text-white'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {status === 'completed' && 'Completed'}
                        {status === 'current' && 'In Progress'}
                        {status === 'pending' && 'Pending'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Update */}
            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="text-white text-sm font-semibold mb-3">
                  Update Status
                </h4>

                {order.status === 'PAID' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Enter tracking number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg
                                 text-white placeholder:text-gray-500 outline-none
                                 focus:border-brand-primary-600 transition-colors text-sm"
                    />
                    <button
                      onClick={() => handleStatusUpdate('SHIPPED')}
                      disabled={updateStatusMutation.isPending}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700
                                 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed
                                 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Truck size={16} />
                      Mark as Shipped
                    </button>
                  </div>
                )}

                {order.status === 'SHIPPED' && (
                  <button
                    onClick={() => handleStatusUpdate('DELIVERED')}
                    disabled={updateStatusMutation.isPending}
                    className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700
                               disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed
                               text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Package size={16} />
                    Mark as Delivered
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">
              Order Items
              <span className="ml-2 text-sm text-gray-500 font-normal">
                ({order.items.length} item{order.items.length !== 1 ? 's' : ''})
              </span>
            </h3>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 pb-4 border-b border-gray-800
                             last:border-0 last:pb-0"
                >
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-14 h-14 object-cover rounded-lg bg-gray-800 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-800 border border-gray-700 rounded-lg
                                    flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-gray-500">
                        {item.productName.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {item.productName}
                    </p>
                    {item.sku && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        SKU: {item.sku}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.quantity} &times; ${(item.unitPrice / 100).toFixed(2)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-white font-semibold text-sm">
                      ${(item.subtotal / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-emerald-400 mt-0.5">
                      Fee: ${(item.platformFee / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Payout: ${(item.sellerPayout / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Platform Revenue Summary */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 text-brand-primary-400 mb-4">
              <TrendingUp size={18} />
              <h3 className="font-semibold">Platform Revenue</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Order Total</span>
                <span className="text-white font-medium">
                  ${(order.finalAmount / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform Fee</span>
                <span className="text-emerald-400 font-semibold">
                  +${(totalPlatformFee / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Seller Payout</span>
                <span className="text-gray-300">
                  ${(totalSellerPayout / 100).toFixed(2)}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-800 flex justify-between">
                <span className="text-white font-semibold">Net Admin Revenue</span>
                <span className="text-emerald-400 font-bold">
                  ${(totalPlatformFee / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 text-gray-300 mb-4">
              <DollarSign size={18} />
              <h3 className="font-semibold">Order Summary</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-gray-200">
                  ${(order.subtotalAmount / 100).toFixed(2)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Discount</span>
                  <span className="text-emerald-400">
                    -${(order.discountAmount / 100).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Shipping</span>
                <span className="text-gray-200">
                  ${(order.shippingCost / 100).toFixed(2)}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-800 flex justify-between">
                <span className="text-white font-semibold">Total</span>
                <span className="text-white font-bold">
                  ${(order.finalAmount / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 text-gray-300 mb-4">
              <MapPin size={18} />
              <h3 className="font-semibold">Shipping Address</h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <User size={14} className="text-gray-500 shrink-0" />
                <span className="font-medium">{order.shippingAddress.name}</span>
              </div>
              <p className="pl-6 text-gray-400">{order.shippingAddress.street}</p>
              <p className="pl-6 text-gray-400">
                {order.shippingAddress.city}
                {order.shippingAddress.state && `, ${order.shippingAddress.state}`}{' '}
                {order.shippingAddress.zipCode}
              </p>
              <p className="pl-6 text-gray-400">{order.shippingAddress.country}</p>
              {order.shippingAddress.phoneNumber && (
                <div className="flex items-center gap-2 text-gray-400 pt-1">
                  <Phone size={14} className="text-gray-500 shrink-0" />
                  <span>{order.shippingAddress.phoneNumber}</span>
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
