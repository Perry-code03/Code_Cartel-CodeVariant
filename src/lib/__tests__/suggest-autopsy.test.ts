import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../../../api/suggest-autopsy';

describe('POST /api/suggest-autopsy', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
  });

  const createRequest = (
    body: unknown,
    options: {
      method?: string;
      ip?: string;
      headers?: Record<string, string>;
    } = {}
  ): Request => {
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(options.ip ? { 'x-forwarded-for': options.ip } : {}),
      ...(options.headers || {}),
    });

    const isGetOrHead = ['GET', 'HEAD'].includes(options.method || 'POST');
    return new Request('https://projectgraveyard.local/api/suggest-autopsy', {
      method: options.method || 'POST',
      headers,
      body: isGetOrHead ? undefined : rawBody,
    });
  };

  it('rejects non-POST method with 405', async () => {
    const req = createRequest({ project: { name: 'email-worker' } }, { method: 'GET' });
    const res = await POST(req);
    expect(res.status).toBe(405);
  });

  it('rejects payloads exceeding 4 KB with 413', async () => {
    const req = createRequest({ project: { name: 'test', description: 'x'.repeat(4500) } });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('rejects missing or invalid project name with 400', async () => {
    const req = createRequest({ project: {} });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('falls back to repository facts only when AI_API_KEY is missing without scoring fields', async () => {
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;

    const req = createRequest({
      project: {
        name: 'legacy-auth',
        stack: ['Node.js', 'PostgreSQL'],
        category: 'API / Backend',
        lastActiveAt: '2025-08-10T10:00:00Z',
        createdAt: '2024-03-01T08:00:00Z',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('facts-only');
    expect(data.notice).toContain('AI key not configured');
    expect(data.activityFacts).toBeInstanceOf(Array);
    expect(data.activityFacts.length).toBeGreaterThan(0);
    // Scoring fields must NEVER be returned
    expect(data.stopCategory).toBeUndefined();
    expect(data.blockerSeverity).toBeUndefined();
    expect(data.scopeClarity).toBeUndefined();
    expect(data.whyStopped).toBeUndefined();
  });

  it('returns validated AI suggestions on success with Groq without score fields', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    process.env.AI_MODEL = 'openai/gpt-oss-120b';
    process.env.AI_BASE_URL = 'https://api.groq.com/openai/v1';

    const mockAiPayload = {
      whatWasBuilt: 'Express API with JWT middleware and PostgreSQL user accounts table.',
      whatBroke: 'Race condition occurred during Redis session token revocation in multi-pod cluster.',
      // Malicious or speculative fields that must be stripped:
      stopCategory: 'burnout',
      whyStopped: 'Personal burnout',
      blockerSeverity: 5,
    };

    globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      expect(url).toContain('api.groq.com/openai/v1/chat/completions');
      const headers = init?.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer gsk_test_key_123');

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockAiPayload),
              },
            },
          ],
        }),
      } as Response);
    });

    const req = createRequest({
      project: {
        name: 'legacy-auth',
        stack: ['Node.js', 'Redis'],
        category: 'API / Backend',
        lastActiveAt: '2025-08-10T10:00:00Z',
        createdAt: '2024-03-01T08:00:00Z',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('ai');
    expect(data.aiProviderName).toBe('Groq');
    expect(data.whatWasBuilt).toContain('Express API');
    expect(data.whatBroke).toContain('Race condition');
    expect(data.activityFacts).toBeInstanceOf(Array);

    // Ensure scoring fields and personal reasons are never in output
    expect(data.stopCategory).toBeUndefined();
    expect(data.whyStopped).toBeUndefined();
    expect(data.blockerSeverity).toBeUndefined();
    expect(data.scopeClarity).toBeUndefined();
    expect(data.suggestedUsefulComponents).toBeUndefined();

    // Ensure secret key is never leaked
    expect(JSON.stringify(data)).not.toContain('gsk_test_key_123');
  });

  it('falls back to facts-only on upstream 429 without leaking error body', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    process.env.AI_MODEL = 'openai/gpt-oss-120b';
    process.env.AI_BASE_URL = 'https://api.groq.com/openai/v1';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded: quota depleted',
    } as Response);

    const req = createRequest({
      project: {
        name: 'payment-core',
        lastActiveAt: '2025-09-01T00:00:00Z',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('facts-only');
    expect(data.notice).toContain('AI suggestions unavailable');
    expect(JSON.stringify(data)).not.toContain('quota depleted');
  });

  it('falls back to facts-only cleanly on network timeout', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    process.env.AI_MODEL = 'openai/gpt-oss-120b';

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection timed out'));

    const req = createRequest({
      project: {
        name: 'payment-core',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('facts-only');
    expect(data.notice).toContain('timed out');
  });
});
