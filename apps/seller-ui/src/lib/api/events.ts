import { apiClient } from './client';

export interface CreateEventData {
  title: string;
  description: string;
  bannerImage?: string;
  startDate: Date;
  endDate: Date;
  status?: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  bannerImage?: string;
  startDate?: Date;
  endDate?: Date;
  status?: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface EventResponse {
  id: string;
  shopId: string;
  title: string;
  description: string;
  bannerImage?: string | null;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  isActive: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  shop?: {
    id: string;
    businessName: string;
    category: string;
  };
}

export interface EventsListResponse {
  data: EventResponse[];
  total: number;
}

// Event API functions
export const createEvent = async (eventData: CreateEventData): Promise<EventResponse> => {
  const response = await apiClient.post('/events', eventData);
  return response.data;
};

export const getEvents = async (filters?: {
  status?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<EventsListResponse> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));

  const response = await apiClient.get(`/events?${params.toString()}`);
  return response.data;
};

export const getEventById = async (eventId: string): Promise<EventResponse> => {
  const response = await apiClient.get(`/events/${eventId}`);
  return response.data;
};

export const updateEvent = async (eventId: string, eventData: UpdateEventData): Promise<EventResponse> => {
  const response = await apiClient.put(`/events/${eventId}`, eventData);
  return response.data;
};

export const deleteEvent = async (eventId: string): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/events/${eventId}`);
  return response.data;
};
