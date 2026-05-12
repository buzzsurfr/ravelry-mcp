import { request } from './client.js';
import type {
  CurrentUserResponse,
  QueuedProject,
  StashEntry,
  Project,
  Favorite,
  LibraryEntry,
  Paginator,
} from '../types/ravelry.js';

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  return request<CurrentUserResponse>('/current_user.json');
}

// Queue

export interface QueueListParams {
  query?: string;
  page?: number;
  page_size?: number;
}

export interface QueueListResponse {
  queued_projects: QueuedProject[];
  paginator: Paginator;
}

export async function getQueue(username: string, params: QueueListParams): Promise<QueueListResponse> {
  const qs = new URLSearchParams();
  if (params.query) qs.set('query', params.query);
  qs.set('page', String(params.page ?? 1));
  qs.set('page_size', String(params.page_size ?? 25));
  return request<QueueListResponse>(`/people/${username}/queue/list.json?${qs}`);
}

export async function addToQueue(
  username: string,
  params: { pattern_id: number; stash_id?: number; sort_position?: number }
): Promise<{ queued_project: QueuedProject }> {
  const body: Record<string, unknown> = { pattern_id: params.pattern_id };
  if (params.stash_id !== undefined) body.stash_id = params.stash_id;
  if (params.sort_position !== undefined) body.sort_position = params.sort_position;

  return request<{ queued_project: QueuedProject }>(
    `/people/${username}/queue/create.json`,
    { method: 'POST', body: JSON.stringify({ queued_project: body }) }
  );
}

export async function removeFromQueue(username: string, queueEntryId: number): Promise<void> {
  await request(`/people/${username}/queue/${queueEntryId}.json`, { method: 'DELETE' });
}

// Stash

export interface StashListParams {
  query?: string;
  weight?: string;
  color_family?: string;
  stash_status?: string;
  page?: number;
  page_size?: number;
}

export interface StashListResponse {
  stash: StashEntry[];
  paginator: Paginator;
}

export async function getStash(username: string, params: StashListParams): Promise<StashListResponse> {
  const qs = new URLSearchParams();
  if (params.query) qs.set('query', params.query);
  if (params.weight) qs.set('weight', params.weight);
  if (params.color_family) qs.set('color_family', params.color_family);
  if (params.stash_status) qs.set('stash_status', params.stash_status);
  qs.set('page', String(params.page ?? 1));
  qs.set('page_size', String(params.page_size ?? 25));
  return request<StashListResponse>(`/people/${username}/stash.json?${qs}`);
}

// Projects

export interface ProjectListParams {
  status?: string;
  craft?: string;
  page?: number;
  page_size?: number;
}

export interface ProjectListResponse {
  projects: Project[];
  paginator: Paginator;
}

// Ravelry filters projects by numeric ID, not the status string label
const PROJECT_STATUS_IDS: Record<string, number> = {
  inprogress: 1,
  finished: 2,
  hibernating: 3,
  frog: 4,
};

export async function getProjects(username: string, params: ProjectListParams): Promise<ProjectListResponse> {
  const qs = new URLSearchParams();
  if (params.status && params.status in PROJECT_STATUS_IDS) {
    qs.set('project_status_id', String(PROJECT_STATUS_IDS[params.status]));
  }
  if (params.craft) qs.set('craft', params.craft);
  qs.set('page', String(params.page ?? 1));
  qs.set('page_size', String(params.page_size ?? 25));
  return request<ProjectListResponse>(`/people/${username}/projects/list.json?${qs}`);
}

export interface UpdateProjectParams {
  status?: 'inprogress' | 'finished' | 'hibernating' | 'frog';
  completed?: string;
  started?: string;
  progress?: number;
  notes?: string;
  name?: string;
}

export async function updateProject(
  username: string,
  id: number,
  params: UpdateProjectParams
): Promise<{ project: Project }> {
  // Ravelry expects application/x-www-form-urlencoded with Rails bracket notation
  const form = new URLSearchParams();
  if (params.status !== undefined) form.append('project[status]', params.status);
  if (params.completed !== undefined) form.append('project[completed]', params.completed);
  if (params.started !== undefined) form.append('project[started]', params.started);
  if (params.progress !== undefined) form.append('project[progress]', String(params.progress));
  if (params.notes !== undefined) form.append('project[notes]', params.notes);
  if (params.name !== undefined) form.append('project[name]', params.name);

  return request<{ project: Project }>(
    `/projects/${username}/${id}.json`,
    {
      method: 'POST',
      body: form.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );
}

// Favorites

export interface FavoritesListParams {
  type?: string;
  query?: string;
  page?: number;
  page_size?: number;
}

export interface FavoritesListResponse {
  favorites: Favorite[];
  paginator: Paginator;
}

export async function getFavorites(username: string, params: FavoritesListParams): Promise<FavoritesListResponse> {
  const qs = new URLSearchParams();
  qs.set('type', params.type ?? 'patterns');
  if (params.query) qs.set('query', params.query);
  qs.set('page', String(params.page ?? 1));
  qs.set('page_size', String(params.page_size ?? 25));
  return request<FavoritesListResponse>(`/people/${username}/favorites.json?${qs}`);
}

export async function addToFavorites(
  username: string,
  type: string,
  id: number
): Promise<{ favorite: Favorite }> {
  return request<{ favorite: Favorite }>(
    `/people/${username}/favorites/create.json`,
    {
      method: 'POST',
      body: JSON.stringify({ favorite: { type, type_id: id } }),
    }
  );
}

// Library

export interface LibrarySearchParams {
  query?: string;
  page?: number;
  page_size?: number;
}

export interface LibrarySearchResponse {
  volumes: LibraryEntry[];
  paginator: Paginator;
}

export async function getLibrary(username: string, params: LibrarySearchParams): Promise<LibrarySearchResponse> {
  const qs = new URLSearchParams();
  if (params.query) qs.set('query', params.query);
  qs.set('page', String(params.page ?? 1));
  qs.set('page_size', String(params.page_size ?? 25));
  return request<LibrarySearchResponse>(`/people/${username}/library/search.json?${qs}`);
}
