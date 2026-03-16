import apiClient from './apiInterceptor';

export interface SearchResult {
  id: number;
  type: 'client' | 'trip' | 'quote';
  title: string;
  subtitle: string;
  url: string;
}

export const searchApi = {
  globalSearch: async (query: string) => {
    const response = await apiClient.get<{ results: SearchResult[] }>(`/accounts/search/?q=${encodeURIComponent(query)}`);
    return response.data.results;
  }
};
