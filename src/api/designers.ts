import { request } from './client.js';
import type { Designer, Paginator } from '../types/ravelry.js';

export interface DesignerSearchResponse {
  designers: Designer[];
  paginator: Paginator;
}

export async function getDesigner(id: number): Promise<{ designer: Designer }> {
  return request<{ designer: Designer }>(`/designers/${id}.json`);
}

export async function searchDesigners(
  query: string,
  page = 1,
  page_size = 10
): Promise<DesignerSearchResponse> {
  const qs = new URLSearchParams({ query, page: String(page), page_size: String(page_size) });
  return request<DesignerSearchResponse>(`/designers/search.json?${qs}`);
}
