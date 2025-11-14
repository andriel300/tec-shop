import { useQuery } from '@tanstack/react-query';
import { getUserOrders, getOrderById, getOrderByNumber } from '../lib/api/orders';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: getUserOrders,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  });
}

export function useOrderByNumber(orderNumber: string) {
  return useQuery({
    queryKey: ['order-number', orderNumber],
    queryFn: () => getOrderByNumber(orderNumber),
    enabled: !!orderNumber,
  });
}
