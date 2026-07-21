import { request } from './client';
import type { ApiProduct } from './types';

export interface ProductListParams {
  brand?: string;
  concern?: string;
  toxin_free?: boolean;
  skip?: number;
  limit?: number;
}

export async function apiListProducts(params?: ProductListParams): Promise<ApiProduct[]> {
  const qs = new URLSearchParams();
  if (params?.brand) qs.set('brand', params.brand);
  if (params?.concern) qs.set('concern', params.concern);
  if (params?.toxin_free !== undefined) qs.set('toxin_free', String(params.toxin_free));
  if (params?.skip !== undefined) qs.set('skip', String(params.skip));
  if (params?.limit !== undefined) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return request<ApiProduct[]>(`/products${query ? `?${query}` : ''}`);
}

export async function apiGetProduct(id: string): Promise<ApiProduct> {
  return request<ApiProduct>(`/products/${id}`);
}
