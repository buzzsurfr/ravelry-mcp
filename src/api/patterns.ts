import { request } from './client.js';
import type { Pattern, PatternSearchResult, Paginator } from '../types/ravelry.js';

export interface PatternSearchParams {
  query?: string;
  craft?: string;
  availability?: string;
  yarn_weight?: string;
  difficulty_min?: number;
  difficulty_max?: number;
  fit?: string;
  pc?: string;
  colors?: number;
  page?: number;
  page_size?: number;
  sort?: string;
}

export interface PatternSearchResponse {
  patterns: PatternSearchResult[];
  paginator: Paginator;
}

export async function searchPatterns(params: PatternSearchParams): Promise<PatternSearchResponse> {
  const qs = new URLSearchParams();
  if (params.query) qs.set('query', params.query);
  if (params.craft) qs.set('craft', params.craft);
  if (params.availability) qs.set('availability', params.availability);
  if (params.yarn_weight) qs.set('weight', params.yarn_weight);
  if (params.difficulty_min !== undefined) qs.set('difficulty_min', String(params.difficulty_min));
  if (params.difficulty_max !== undefined) qs.set('difficulty_max', String(params.difficulty_max));
  if (params.fit) qs.set('fit', params.fit);
  if (params.pc) qs.set('pc', params.pc);
  if (params.colors !== undefined) qs.set('colors', String(params.colors));
  qs.set('page', String(params.page ?? 1));
  qs.set('page_size', String(params.page_size ?? 10));
  if (params.sort) qs.set('sort', params.sort);

  return request<PatternSearchResponse>(`/patterns/search.json?${qs}`);
}

export async function getPattern(id: number): Promise<{ pattern: Pattern }> {
  return request<{ pattern: Pattern }>(`/patterns/${id}.json`);
}

export async function getPatterns(ids: number[]): Promise<{ patterns: Record<string, Pattern> }> {
  const results: Record<string, Pattern> = {};

  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const data = await request<{ patterns: Record<string, Pattern> }>(
      `/patterns.json?ids=${chunk.join(',')}`
    );
    Object.assign(results, data.patterns);
  }

  return { patterns: results };
}
