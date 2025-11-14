import { apiClient } from './client';

export interface ShippingAddress {
  id: string;
  userId: string;
  userProfileId: string;
  label: string;
  name: string;
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  phoneNumber?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressData {
  label: string;
  name: string;
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

export const getShippingAddresses = async (): Promise<ShippingAddress[]> => {
  const response = await apiClient.get('/user/addresses');
  return response.data;
};

export const getShippingAddress = async (
  id: string
): Promise<ShippingAddress> => {
  const response = await apiClient.get(`/user/addresses/${id}`);
  return response.data;
};

export const createShippingAddress = async (
  data: CreateAddressData
): Promise<ShippingAddress> => {
  const response = await apiClient.post('/user/addresses', data);
  return response.data;
};

export const updateShippingAddress = async (
  id: string,
  data: Partial<CreateAddressData>
): Promise<ShippingAddress> => {
  const response = await apiClient.patch(`/user/addresses/${id}`, data);
  return response.data;
};

export const deleteShippingAddress = async (id: string): Promise<void> => {
  await apiClient.delete(`/user/addresses/${id}`);
};

export const setDefaultAddress = async (
  id: string
): Promise<ShippingAddress> => {
  const response = await apiClient.patch(`/user/addresses/${id}/default`);
  return response.data;
};

export const copyShippingAddress = async (
  id: string
): Promise<ShippingAddress> => {
  const response = await apiClient.post(`/user/addresses/${id}/copy`);
  return response.data;
};
