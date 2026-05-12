import { request } from './client.js';
import type { Shop, Paginator } from '../types/ravelry.js';

export interface ShopSearchParams {
  query?: string;
  lat?: number;
  lng?: number;
  miles?: number;
  page?: number;
  page_size?: number;
}

export interface ShopSearchResponse {
  shops: Shop[];
  paginator: Paginator;
}

export async function searchShops(params: ShopSearchParams): Promise<ShopSearchResponse> {
  const qs = new URLSearchParams();
  if (params.query) qs.set('query', params.query);
  if (params.lat !== undefined) qs.set('lat', String(params.lat));
  if (params.lng !== undefined) qs.set('lng', String(params.lng));
  if (params.miles !== undefined) qs.set('miles', String(params.miles));
  qs.set('page', String(params.page ?? 1));
  qs.set('page_size', String(params.page_size ?? 10));
  return request<ShopSearchResponse>(`/shops/search.json?${qs}`);
}

export async function getShop(id: number): Promise<{ shop: Shop }> {
  return request<{ shop: Shop }>(`/shops/${id}.json`);
}
