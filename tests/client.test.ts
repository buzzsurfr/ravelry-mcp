import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const MOCK_ACCESS_KEY = 'test_access_key';
const MOCK_PERSONAL_KEY = 'test_personal_key';
const EXPECTED_AUTH = `Basic ${Buffer.from(`${MOCK_ACCESS_KEY}:${MOCK_PERSONAL_KEY}`).toString('base64')}`;

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('API Client', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.RAVELRY_ACCESS_KEY = MOCK_ACCESS_KEY;
    process.env.RAVELRY_PERSONAL_KEY = MOCK_PERSONAL_KEY;
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    delete process.env.RAVELRY_ACCESS_KEY;
    delete process.env.RAVELRY_PERSONAL_KEY;
  });

  describe('auth header construction', () => {
    it('sends the correct Basic Auth header on every request', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ test: true }));

      const { request } = await import('../src/api/client.js');
      await request('/test.json');

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.ravelry.com/test.json');
      const headers = options.headers as Record<string, string>;
      expect(headers['Authorization']).toBe(EXPECTED_AUTH);
    });

    it('throws immediately if RAVELRY_ACCESS_KEY is missing (no retries)', async () => {
      delete process.env.RAVELRY_ACCESS_KEY;
      const { request } = await import('../src/api/client.js');
      await expect(request('/test.json')).rejects.toThrow('RAVELRY_ACCESS_KEY');
      // fetch should never be called — we throw before entering the retry loop
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('throws immediately if RAVELRY_PERSONAL_KEY is missing (no retries)', async () => {
      delete process.env.RAVELRY_PERSONAL_KEY;
      const { request } = await import('../src/api/client.js');
      await expect(request('/test.json')).rejects.toThrow('RAVELRY_PERSONAL_KEY');
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('throws a clear 401 error message pointing to credentials', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));

      const { request } = await import('../src/api/client.js');
      await expect(request('/current_user.json')).rejects.toThrow(/authentication failed/i);
    });

    it('includes the pro developer URL in the 401 error', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));

      const { request } = await import('../src/api/client.js');
      await expect(request('/current_user.json')).rejects.toThrow('ravelry.com/pro/developer');
    });

    it('throws a clean error on non-OK response', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('Not Found', { status: 404 }));

      const { request } = await import('../src/api/client.js');
      await expect(request('/patterns/99999.json')).rejects.toThrow('404');
    });

    it('wraps network errors without exposing a stack trace', async () => {
      vi.useFakeTimers();
      fetchSpy.mockRejectedValue(new TypeError('Failed to connect'));

      const { request } = await import('../src/api/client.js');
      const promise = request('/test.json').catch(e => e);
      await vi.runAllTimersAsync();

      const err = await promise;
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toMatch(/Network error/i);
      expect(err.message).toContain('Failed to connect');
      // fetch should have been called once per attempt (1 initial + MAX_RETRIES)
      expect(fetchSpy.mock.calls.length).toBeGreaterThan(1);
    });
  });

  describe('429 rate limit backoff', () => {
    it('retries on 429 and succeeds when a later attempt returns 200', async () => {
      vi.useFakeTimers();

      fetchSpy
        .mockResolvedValueOnce(
          new Response('Too Many Requests', {
            status: 429,
            headers: { 'Retry-After': '1' },
          })
        )
        .mockResolvedValueOnce(mockResponse({ patterns: [] }));

      const { request } = await import('../src/api/client.js');
      const promise = request<{ patterns: unknown[] }>('/patterns/search.json');
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toEqual({ patterns: [] });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('throws a rate limit error after MAX_RETRIES consecutive 429s', async () => {
      vi.useFakeTimers();

      fetchSpy.mockResolvedValue(
        new Response('Too Many Requests', { status: 429 })
      );

      const { request } = await import('../src/api/client.js');
      // Catch immediately so the rejection is never "unhandled"
      const promise = request('/patterns/search.json').catch(e => e);
      await vi.runAllTimersAsync();

      const err = await promise;
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toMatch(/rate limit/i);
    });
  });

  describe('validateCredentials', () => {
    it('caches and returns the username from current_user', async () => {
      fetchSpy.mockResolvedValueOnce(
        mockResponse({ user: { username: 'testuser' } })
      );

      const { validateCredentials, getUsername } = await import('../src/api/client.js');
      const username = await validateCredentials();

      expect(username).toBe('testuser');
      expect(getUsername()).toBe('testuser');
    });

    it('throws a helpful message when env vars are missing before making a request', async () => {
      delete process.env.RAVELRY_ACCESS_KEY;
      delete process.env.RAVELRY_PERSONAL_KEY;

      const { validateCredentials } = await import('../src/api/client.js');
      await expect(validateCredentials()).rejects.toThrow('claude_desktop_config.json');
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
