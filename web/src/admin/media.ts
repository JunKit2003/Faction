import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type LibraryItem } from './api';

export const useLibrary = () => useQuery({ queryKey: ['media'], queryFn: () => api<LibraryItem[]>('GET', '/api/admin/media') });

export function useUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, purpose, alt = '' }: { file: File; purpose?: 'logo'; alt?: string }) => {
      const form = new FormData();
      form.append('file', file);
      form.append('alt', alt);
      return api<LibraryItem>('POST', `/api/admin/media${purpose ? '?purpose=logo' : ''}`, form);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
}
