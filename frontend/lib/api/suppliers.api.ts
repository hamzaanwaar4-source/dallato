import apiClient from './apiInterceptor';
import { ManagedSuppliersResponse, ApiManagedSupplier } from '@/lib/types/supplier';

/**
 * Fetches managed suppliers data
 */
export const getManagedSuppliers = async (): Promise<ApiManagedSupplier[]> => {
  const response = await apiClient.get<ManagedSuppliersResponse>('/agency/managed-suppliers/');
  return response.data.suppliers;
};
