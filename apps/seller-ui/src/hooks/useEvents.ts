import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as eventApi from '../lib/api/events';
import type {
  CreateEventData,
  UpdateEventData,
  EventResponse,
  EventsListResponse,
} from '../lib/api/events';

// Query keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...eventKeys.lists(), { filters }] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

// Hooks
export const useEvents = (filters?: {
  status?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) => {
  return useQuery<EventsListResponse, Error>({
    queryKey: eventKeys.list(filters),
    queryFn: () => eventApi.getEvents(filters),
    staleTime: 30000, // 30 seconds
  });
};

export const useEvent = (eventId: string) => {
  return useQuery<EventResponse, Error>({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => eventApi.getEventById(eventId),
    enabled: !!eventId,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<EventResponse, Error, CreateEventData>({
    mutationFn: eventApi.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<EventResponse, Error, { eventId: string; eventData: UpdateEventData }>({
    mutationFn: ({ eventId, eventData }) => eventApi.updateEvent(eventId, eventData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: eventApi.deleteEvent,
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
};
