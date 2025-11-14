import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getShippingAddresses,
  getShippingAddress,
  createShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  setDefaultAddress,
  copyShippingAddress,
  type CreateAddressData,
  type ShippingAddress,
} from '../lib/api/address';

/**
 * Hook to fetch all shipping addresses for the current user
 */
export function useShippingAddresses() {
  return useQuery({
    queryKey: ['shipping-addresses'],
    queryFn: getShippingAddresses,
  });
}

/**
 * Hook to fetch a single shipping address by ID
 */
export function useShippingAddress(id: string) {
  return useQuery({
    queryKey: ['shipping-address', id],
    queryFn: () => getShippingAddress(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new shipping address
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShippingAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
      toast.success('Address added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add address');
    },
  });
}

/**
 * Hook to update an existing shipping address
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateAddressData>;
    }) => updateShippingAddress(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shipping-addresses'] });

      // Snapshot previous value
      const previousAddresses = queryClient.getQueryData<ShippingAddress[]>([
        'shipping-addresses',
      ]);

      // Optimistically update
      if (previousAddresses) {
        queryClient.setQueryData<ShippingAddress[]>(
          ['shipping-addresses'],
          previousAddresses.map((addr) =>
            addr.id === id ? { ...addr, ...data } : addr
          )
        );
      }

      return { previousAddresses };
    },
    onError: (_error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousAddresses) {
        queryClient.setQueryData(
          ['shipping-addresses'],
          context.previousAddresses
        );
      }
      toast.error(_error.message || 'Failed to update address');
    },
    onSuccess: () => {
      toast.success('Address updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
    },
  });
}

/**
 * Hook to delete a shipping address
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteShippingAddress,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shipping-addresses'] });

      // Snapshot previous value
      const previousAddresses = queryClient.getQueryData<ShippingAddress[]>([
        'shipping-addresses',
      ]);

      // Optimistically remove
      if (previousAddresses) {
        queryClient.setQueryData<ShippingAddress[]>(
          ['shipping-addresses'],
          previousAddresses.filter((addr) => addr.id !== id)
        );
      }

      return { previousAddresses };
    },
    onError: (_error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousAddresses) {
        queryClient.setQueryData(
          ['shipping-addresses'],
          context.previousAddresses
        );
      }
      toast.error(_error.message || 'Failed to delete address');
    },
    onSuccess: () => {
      toast.success('Address deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
    },
  });
}

/**
 * Hook to set an address as the default
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setDefaultAddress,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shipping-addresses'] });

      // Snapshot previous value
      const previousAddresses = queryClient.getQueryData<ShippingAddress[]>([
        'shipping-addresses',
      ]);

      // Optimistically update - unset all defaults and set new one
      if (previousAddresses) {
        queryClient.setQueryData<ShippingAddress[]>(
          ['shipping-addresses'],
          previousAddresses.map((addr) => ({
            ...addr,
            isDefault: addr.id === id,
          }))
        );
      }

      return { previousAddresses };
    },
    onError: (_error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousAddresses) {
        queryClient.setQueryData(
          ['shipping-addresses'],
          context.previousAddresses
        );
      }
      toast.error(_error.message || 'Failed to set default address');
    },
    onSuccess: () => {
      toast.success('Default address updated');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
    },
  });
}

/**
 * Hook to copy an existing shipping address
 */
export function useCopyAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: copyShippingAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
      toast.success('Address copied successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to copy address');
    },
  });
}
