import { useQuery } from '@tanstack/react-query';
import { api, ApiError, type Me } from './api';

export const useMe = () => useQuery({
  queryKey: ['me'],
  queryFn: async () => {
    try { return await api<Me>('GET', '/api/auth/me'); } catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; }
  },
  staleTime: 60_000,
});
