import { request } from './client.js';
import type { ColorFamily, YarnWeight, PatternCategory } from '../types/ravelry.js';

const cache = new Map<string, unknown>();

async function getCached<T>(key: string, path: string): Promise<T> {
  if (!cache.has(key)) {
    cache.set(key, await request<T>(path));
  }
  return cache.get(key) as T;
}

export function getColorFamilies(): Promise<{ color_families: ColorFamily[] }> {
  return getCached('color_families', '/color_families.json');
}

export function getYarnWeights(): Promise<{ yarn_weights: YarnWeight[] }> {
  return getCached('yarn_weights', '/yarn_weights.json');
}

export function getPatternCategories(): Promise<{ pattern_categories: PatternCategory[] }> {
  return getCached('pattern_categories', '/pattern_categories.json');
}
