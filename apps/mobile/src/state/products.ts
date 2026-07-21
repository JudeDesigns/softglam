import { create } from 'zustand';
import { apiListProducts, type ProductListParams } from '@/api/products';
import type { ApiProduct } from '@/api/types';

interface ProductsState {
  products: ApiProduct[];
  isLoading: boolean;
  error: string | null;
  fetch: (params?: ProductListParams, force?: boolean) => Promise<void>;
}

export const useProducts = create<ProductsState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  fetch: async (params?: ProductListParams, force = false) => {
    const { products, isLoading } = get();
    if (!force && (products.length > 0 || isLoading)) return;
    set({ isLoading: true, error: null });
    try {
      const data = await apiListProducts(params);
      set({ products: data, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load products';
      set({ error: message, isLoading: false });
    }
  },
}));
