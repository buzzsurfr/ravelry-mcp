const BASE_URL = 'https://api.ravelry.com';
const MAX_RETRIES = 3;

let cachedUsername: string | null = null;

function buildAuthHeader(): string {
  const accessKey = process.env.RAVELRY_ACCESS_KEY;
  const personalKey = process.env.RAVELRY_PERSONAL_KEY;

  if (!accessKey || !personalKey) {
    throw new Error(
      'Missing RAVELRY_ACCESS_KEY or RAVELRY_PERSONAL_KEY environment variables. ' +
      'Set these in your claude_desktop_config.json under the ravelry server env section.'
    );
  }

  const credentials = Buffer.from(`${accessKey}:${personalKey}`).toString('base64');
  return `Basic ${credentials}`;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Build auth header once before the retry loop — throw immediately on missing credentials
  const authHeader = buildAuthHeader();
  const url = `${BASE_URL}${path}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }

    let response: Response;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    try {
      response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new Error(
          'Ravelry API request timed out after 30s — the server did not respond. ' +
          'Check your network connection and try again.'
        );
      } else {
        lastError = new Error(
          `Network error calling Ravelry API: ${err instanceof Error ? err.message : String(err)}`
        );
      }
      if (attempt === MAX_RETRIES) throw lastError;
      continue;
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status === 401) {
      throw new Error(
        'Ravelry API authentication failed (401). ' +
        'Check that RAVELRY_ACCESS_KEY and RAVELRY_PERSONAL_KEY are correct in your ' +
        'claude_desktop_config.json. You can regenerate credentials at ' +
        'https://www.ravelry.com/pro/developer'
      );
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Ravelry API rate limit exceeded (429). ` +
          (retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please try again later.')
        );
      }
      lastError = new Error('Rate limited, retrying with backoff');
      continue;
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    if (!response.ok) {
      let body = '';
      try { body = await response.text(); } catch { /* ignore */ }
      throw new Error(`Ravelry API error ${response.status}: ${body || response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  throw lastError ?? new Error('Request failed after retries');
}

export async function validateCredentials(): Promise<string> {
  if (!process.env.RAVELRY_ACCESS_KEY || !process.env.RAVELRY_PERSONAL_KEY) {
    throw new Error(
      'RAVELRY_ACCESS_KEY and RAVELRY_PERSONAL_KEY must be set in your ' +
      'claude_desktop_config.json env section. Create a Basic Auth app at ' +
      'https://www.ravelry.com/pro/developer to get these credentials.'
    );
  }

  const data = await request<{ user?: { username?: string } }>('/current_user.json');
  const username = data?.user?.username;

  if (!username) {
    throw new Error(
      'Ravelry /current_user.json returned an unexpected response — ' +
      `expected { user: { username: "..." } }, got: ${JSON.stringify(data)}. ` +
      'Verify your RAVELRY_ACCESS_KEY and RAVELRY_PERSONAL_KEY are correct.'
    );
  }

  cachedUsername = username;
  return cachedUsername;
}

export function getUsername(): string {
  if (!cachedUsername) {
    throw new Error(
      'Ravelry username is not cached — startup validation may not have completed. ' +
      'This is a bug; please restart the server.'
    );
  }
  return cachedUsername;
}
