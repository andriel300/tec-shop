'use client';

import React, { useState } from 'react';
import { useOrders } from '../../hooks/use-orders';
import { Loader2, Package, Truck, CheckCircle, Clock, XCircle, X } from 'lucide-react';
import Image from 'next/image';
import { Link } from '../../i18n/navigation';
import ReviewForm from '../reviews/review-form';
import type { Order } from '../../lib/api/orders';

const ReviewItemsModal = ({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) => (
  <div
    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Review Items</h2>
          <p className="text-xs text-gray-500 mt-0.5">Order #{order.orderNumber}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition"
          aria-label="Close"
        >
          <X size={18} className="text-gray-600" />
        </button>
      </div>

      <div className="px-6 py-4 space-y-6">
        {order.items.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
              {item.productImage ? (
                <Image
                  src={item.productImage}
                  alt={item.productName}
                  width={44}
                  height={44}
                  className="rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-11 h-11 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <Package size={18} className="text-gray-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {item.productName}
                </p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
            </div>
            <div className="px-4 py-3">
              <ReviewForm productId={item.productId} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const OrdersSection = () => {
  const { data: orders = [], isLoading, error } = useOrders();
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);

  const reviewOrder = reviewOrderId
    ? orders.find((o) => o.id === reviewOrderId) ?? null
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading your orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">Failed to load orders</p>
        <p className="text-sm text-gray-500 mt-1">Please try again later</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orders Yet</h3>
        <p className="text-sm text-gray-500 mb-6">
          Start shopping and your orders will appear here.
        </p>
        <Link
          href="/products"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
        >
          {/* Order Header */}
          <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Order #{order.orderNumber}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="text-right">
              <StatusBadge status={order.status} />
              <p className="text-sm font-semibold text-gray-800 mt-1">
                ${(order.finalAmount / 100).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-2 mb-3">
            {order.items.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    width={50}
                    height={50}
                    className="rounded object-cover"
                  />
                ) : (
                  <div className="w-[50px] h-[50px] bg-gray-200 rounded flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <Link
                    href={`/product/${item.productSlug || item.productId}`}
                    className="text-sm font-medium text-gray-800 hover:text-blue-600 hover:underline"
                  >
                    {item.productName}
                  </Link>
                  <p className="text-xs text-gray-500">
                    Quantity: {item.quantity} × ${(item.unitPrice / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            {order.items.length > 2 && (
              <p className="text-xs text-gray-500 mt-2">
                +{order.items.length - 2} more item(s)
              </p>
            )}
          </div>

          {/* Shipping Address */}
          <div className="text-xs text-gray-600 mb-3 p-2 bg-gray-50 rounded">
            <p className="font-semibold mb-1">Shipping to:</p>
            <p>
              {order.shippingAddress.name}
              <br />
              {order.shippingAddress.street}
              <br />
              {order.shippingAddress.city}
              {order.shippingAddress.state && `, ${order.shippingAddress.state}`}{' '}
              {order.shippingAddress.zipCode}
              <br />
              {order.shippingAddress.country}
            </p>
          </div>

          {/* Tracking Info */}
          {order.trackingNumber && (
            <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
              <Truck className="w-4 h-4" />
              <span>Tracking: {order.trackingNumber}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Link
              href={`/orders/${order.id}`}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition"
            >
              View Details
            </Link>
            {order.status === 'DELIVERED' && (
              <button
                onClick={() => setReviewOrderId(order.id)}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded transition"
              >
                Review Items
              </button>
            )}
          </div>
        </div>
      ))}

      {reviewOrder && (
        <ReviewItemsModal
          order={reviewOrder}
          onClose={() => setReviewOrderId(null)}
        />
      )}
    </div>
  );
};

export default OrdersSection;

// Helper component for status badges
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    PENDING: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
    PAID: { icon: CheckCircle, color: 'bg-blue-100 text-blue-700', label: 'Paid' },
    SHIPPED: { icon: Truck, color: 'bg-purple-100 text-purple-700', label: 'Shipped' },
    DELIVERED: {
      icon: CheckCircle,
      color: 'bg-green-100 text-green-700',
      label: 'Delivered',
    },
    CANCELLED: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Cancelled' },
  };

  const { icon: Icon, color, label } = config[status as keyof typeof config] || config.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};
