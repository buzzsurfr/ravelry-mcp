import { request } from './client.js';
import type { Yarn, YarnSearchResult, Paginator } from '../types/ravelry.js';

export interface YarnSearchParams {
  query?: string;
  weight?: string;
  fiber_type?: string;
  company_name?: string;
  rating_min?: number;
  discontinued?: boolean;
  page?: number;
  page_size?: number;
  sort?: string;
}

export interface YarnSearchResponse {
  yarns: YarnSearchResult[];
  paginator: Paginator;
}

export async function searchYarns(params: YarnSearchParams): Promise<YarnSearchResponse> {
  const qs = new URLSearchParams();
  if (params.query) qs.set('query', params.query);
  if (params.weight) qs.set('weight', params.weight);
  if (params.fiber_type) qs.set('fiber_type', params.fiber_type);
  if (params.company_name) qs.set('company_name', params.company_name);
  if (params.rating_min !== undefined) qs.set('rating_min', String(params.rating_min));
  if (params.discontinued !== undefined) qs.set('discontinued', params.discontinued ? 'yes' : 'no');
  qs.set('page', String(params.page ?? 1));
  qs.set('page_size', String(params.page_size ?? 10));
  if (params.sort) qs.set('sort', params.sort);

  return request<YarnSearchResponse>(`/yarns/search.json?${qs}`);
}

export async function getYarn(id: number): Promise<{ yarn: Yarn }> {
  return request<{ yarn: Yarn }>(`/yarns/${id}.json`);
}

export async function getYarns(ids: number[]): Promise<{ yarns: Record<string, Yarn> }> {
  const results: Record<string, Yarn> = {};

  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const data = await request<{ yarns: Record<string, Yarn> }>(
      `/yarns.json?ids=${chunk.join(',')}`
    );
    Object.assign(results, data.yarns);
  }

  return { yarns: results };
}
