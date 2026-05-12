import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const MOCK_ACCESS_KEY = 'test_access_key';
const MOCK_PERSONAL_KEY = 'test_personal_key';
const MOCK_USERNAME = 'testuser';

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const MOCK_PROJECT = {
  id: 12345,
  name: 'My Sweater',
  status_name: 'Finished',
  project_status_id: 2,
  started: '2026/01/01',
  completed: '2026/03/15',
  progress: 100,
  notes: 'Knit in the round.',
};

describe('updateProject', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.RAVELRY_ACCESS_KEY = MOCK_ACCESS_KEY;
    process.env.RAVELRY_PERSONAL_KEY = MOCK_PERSONAL_KEY;
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.RAVELRY_ACCESS_KEY;
    delete process.env.RAVELRY_PERSONAL_KEY;
  });

  it('sends a POST to the correct project URL', async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse({ project: MOCK_PROJECT }));

    const { updateProject } = await import('../src/api/people.js');
    await updateProject(MOCK_USERNAME, 12345, { status: 'finished' });

    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://api.ravelry.com/projects/${MOCK_USERNAME}/12345.json`);
    expect(options.method).toBe('POST');
  });

  it('sends form-encoded Content-Type', async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse({ project: MOCK_PROJECT }));

    const { updateProject } = await import('../src/api/people.js');
    await updateProject(MOCK_USERNAME, 12345, { status: 'finished' });

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
  });

  it('sends status transition using Rails bracket notation', async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse({ project: MOCK_PROJECT }));

    const { updateProject } = await import('../src/api/people.js');
    await updateProject(MOCK_USERNAME, 12345, { status: 'finished' });

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(options.body as string);
    expect(body.get('project[status]')).toBe('finished');
  });

  it('sends completed date using Rails bracket notation', async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse({ project: MOCK_PROJECT }));

    const { updateProject } = await import('../src/api/people.js');
    await updateProject(MOCK_USERNAME, 12345, { completed: '2026/03/15' });

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(options.body as string);
    expect(body.get('project[completed]')).toBe('2026/03/15');
  });

  it('sends multiple fields together (status + completed + progress)', async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse({ project: MOCK_PROJECT }));

    const { updateProject } = await import('../src/api/people.js');
    await updateProject(MOCK_USERNAME, 12345, {
      status: 'finished',
      completed: '2026/03/15',
      progress: 100,
    });

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(options.body as string);
    expect(body.get('project[status]')).toBe('finished');
    expect(body.get('project[completed]')).toBe('2026/03/15');
    expect(body.get('project[progress]')).toBe('100');
  });

  it('omits undefined fields from the request body', async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse({ project: MOCK_PROJECT }));

    const { updateProject } = await import('../src/api/people.js');
    await updateProject(MOCK_USERNAME, 12345, { notes: 'Great pattern!' });

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(options.body as string);
    // Only notes should appear — no status, completed, started, progress, name
    expect(body.get('project[notes]')).toBe('Great pattern!');
    expect(body.get('project[status]')).toBeNull();
    expect(body.get('project[completed]')).toBeNull();
    expect(body.get('project[progress]')).toBeNull();
  });

  it('returns the updated project from the API response', async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse({ project: MOCK_PROJECT }));

    const { updateProject } = await import('../src/api/people.js');
    const result = await updateProject(MOCK_USERNAME, 12345, { status: 'finished' });

    expect(result).toEqual({ project: MOCK_PROJECT });
  });

  it('surfaces a clean error on API failure', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Not Found', { status: 404 }));

    const { updateProject } = await import('../src/api/people.js');
    await expect(updateProject(MOCK_USERNAME, 99999, { status: 'finished' }))
      .rejects.toThrow('404');
  });
});
