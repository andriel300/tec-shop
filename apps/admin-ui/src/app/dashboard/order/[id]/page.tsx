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
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import apiClient from '../../../../lib/api/client';
import { Breadcrumb } from '../../../../shared/components/navigation/Breadcrumb';

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

const OrderDetailsPage = ({ params }: { params: Promise<{ id: string }> }) => {
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
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5" />;
      case 'PAID':
        return <CheckCircle className="w-5 h-5" />;
      case 'SHIPPED':
        return <Truck className="w-5 h-5" />;
      case 'DELIVERED':
        return <Package className="w-5 h-5" />;
      case 'CANCELLED':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'PAID':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'SHIPPED':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'DELIVERED':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'CANCELLED':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const deliverySteps = [
    { key: 'PAID', label: 'Order Confirmed', icon: CheckCircle },
    { key: 'SHIPPED', label: 'In Transit', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: Package },
  ];

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
      <div className="w-full min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full min-h-screen p-8">
        <div className="text-center text-gray-400">Order not found</div>
      </div>
    );
  }

  const totalEarnings = order.items.reduce(
    (sum, item) => sum + item.sellerPayout,
    0
  );

  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ChevronLeft size={20} />
          Back to Orders
        </Link>
        <h2 className="text-3xl text-white font-bold mb-2">Order Details</h2>
        <Breadcrumb
          title="Order Details"
          items={[{ label: 'Orders', href: '/dashboard/orders' }]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info Card */}
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Order Number</p>
                <p className="text-white text-2xl font-mono font-bold">
                  {order.orderNumber}
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-lg border ${getStatusColor(
                  order.status
                )} flex items-center gap-2`}
              >
                {getStatusIcon(order.status)}
                <span className="font-semibold">{order.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-1 flex items-center gap-2">
                  <Calendar size={16} />
                  Order Date
                </p>
                <p className="text-white">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1 flex items-center gap-2">
                  <Tag size={16} />
                  Payment Status
                </p>
                <p
                  className={`font-medium ${
                    order.paymentStatus === 'COMPLETED'
                      ? 'text-green-400'
                      : 'text-yellow-400'
                  }`}
                >
                  {order.paymentStatus}
                </p>
              </div>
              {order.trackingNumber && (
                <div className="col-span-2">
                  <p className="text-gray-400 mb-1 flex items-center gap-2">
                    <Truck size={16} />
                    Tracking Number
                  </p>
                  <p className="text-white font-mono">{order.trackingNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Progress */}
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <h3 className="text-xl text-white font-semibold mb-6">
              Delivery Progress
            </h3>

            <div className="relative w-full">
              <div className="flex items-start justify-between w-full">
                {deliverySteps.map((step, index) => {
                  const status = getStepStatus(step.key);
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.key}
                      className="relative flex flex-col items-center text-center w-full"
                    >
                      {/* Horizontal Line Between Steps */}
                      {index > 0 && (
                        <div
                          className={`absolute -left-1/2 top-6 w-full h-0.5 ${
                            status === 'completed' || status === 'current'
                              ? 'bg-brand-primary'
                              : 'bg-gray-700'
                          }`}
                        />
                      )}

                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 ${
                          status === 'completed'
                            ? 'bg-brand-primary border-brand-primary text-white'
                            : status === 'current'
                            ? 'bg-brand-primary/20 border-brand-primary text-brand-primary'
                            : 'bg-gray-800 border-gray-700 text-gray-500'
                        }`}
                      >
                        <Icon size={20} />
                      </div>

                      {/* Text */}
                      <div className="mt-2">
                        <p
                          className={`font-semibold ${
                            status === 'pending'
                              ? 'text-gray-500'
                              : 'text-white'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-sm text-gray-400">
                          {status === 'completed' && 'Completed'}
                          {status === 'current' && 'In Progress'}
                          {status === 'pending' && 'Pending'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Update Actions */}
            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-white font-semibold mb-4">Update Status</h4>

                {order.status === 'PAID' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Enter tracking number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 outline-none focus:border-brand-primary"
                    />
                    <button
                      onClick={() => handleStatusUpdate('SHIPPED')}
                      disabled={updateStatusMutation.isPending}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Truck size={18} />
                      Mark as Shipped
                    </button>
                  </div>
                )}

                {order.status === 'SHIPPED' && (
                  <button
                    onClick={() => handleStatusUpdate('DELIVERED')}
                    disabled={updateStatusMutation.isPending}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Package size={18} />
                    Mark as Delivered
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <h3 className="text-xl text-white font-semibold mb-4">
              Order Items
            </h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 pb-4 border-b border-gray-800 last:border-0 last:pb-0"
                >
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded-lg bg-gray-800"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                      <Package size={24} className="text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.productName}</p>
                    {item.sku && (
                      <p className="text-sm text-gray-400">SKU: {item.sku}</p>
                    )}
                    <p className="text-sm text-gray-400">
                      Qty: {item.quantity} × $
                      {(item.unitPrice / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      ${(item.subtotal / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-green-400">
                      Your share: ${(item.sellerPayout / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Earnings Summary */}
          <div className="bg-gradient-to-br from-green-900/20 to-gray-900 rounded-lg border border-green-700/30 p-6">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <DollarSign size={20} />
              <h3 className="text-lg font-semibold">Your Earnings</h3>
            </div>
            <p className="text-4xl font-bold text-green-400 mb-4">
              ${(totalEarnings / 100).toFixed(2)}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>${(order.subtotalAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Platform Fee (10%)</span>
                <span>-${(order.platformFee / 100).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-gray-700 flex justify-between font-semibold text-green-400">
                <span>Net Payout</span>
                <span>${(totalEarnings / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-2 text-white mb-4">
              <MapPin size={20} />
              <h3 className="text-lg font-semibold">Shipping Address</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-500" />
                <span>{order.shippingAddress.name}</span>
              </div>
              <p className="pl-6">{order.shippingAddress.street}</p>
              <p className="pl-6">
                {order.shippingAddress.city}
                {order.shippingAddress.state &&
                  `, ${order.shippingAddress.state}`}{' '}
                {order.shippingAddress.zipCode}
              </p>
              <p className="pl-6">{order.shippingAddress.country}</p>
              {order.shippingAddress.phoneNumber && (
                <div className="flex items-center gap-2 pt-2">
                  <Phone size={16} className="text-gray-500" />
                  <span>{order.shippingAddress.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <h3 className="text-white text-lg font-semibold mb-4">
              Order Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>${(order.subtotalAmount / 100).toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-${(order.discountAmount / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-300">
                <span>Shipping</span>
                <span>${(order.shippingCost / 100).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-gray-700 flex justify-between font-semibold text-white">
                <span>Total</span>
                <span>${(order.finalAmount / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
