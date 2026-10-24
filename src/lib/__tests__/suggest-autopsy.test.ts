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

  it('falls back when AI_API_KEY is missing (no_key)', async () => {
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
    expect(data.reason).toBe('no_key');
    expect(data.notice).toContain('AI is not configured on this deployment');
    expect(data.notice).toContain('missing AI_API_KEY');
    expect(data.activityFacts).toBeInstanceOf(Array);
    expect(data.activityFacts.length).toBeGreaterThan(0);
    // Scoring fields must NEVER be returned
    expect(data.stopCategory).toBeUndefined();
    expect(data.blockerSeverity).toBeUndefined();
    expect(data.scopeClarity).toBeUndefined();
    expect(data.whyStopped).toBeUndefined();
  });

  it('falls back when key is provided without model (no_model)', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    delete process.env.AI_MODEL;

    const req = createRequest({
      project: {
        name: 'legacy-auth',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('facts-only');
    expect(data.reason).toBe('no_model');
    expect(data.notice).toContain('AI is not configured on this deployment');
    expect(data.notice).toContain('missing AI_MODEL');
  });

  it('handles provider 401/403 with provider_auth notice', async () => {
    process.env.AI_API_KEY = 'gsk_invalid_key_123';
    process.env.AI_MODEL = 'llama-3.3-70b-versatile';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Invalid API Key provided: gsk_invalid_key_123',
    } as Response);

    const req = createRequest({ project: { name: 'legacy-auth' } });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('facts-only');
    expect(data.reason).toBe('provider_auth');
    expect(data.notice).toBe('The AI provider rejected the key.');
    // Must never leak secret key or raw provider error body
    expect(JSON.stringify(data)).not.toContain('gsk_invalid_key_123');
    expect(JSON.stringify(data)).not.toContain('Invalid API Key provided');
  });

  it('handles provider 400/404 model error with provider_model notice', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    process.env.AI_MODEL = 'llama-3.1-decommissioned';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Model llama-3.1-decommissioned does not exist',
    } as Response);

    const req = createRequest({ project: { name: 'legacy-auth' } });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('facts-only');
    expect(data.reason).toBe('provider_model');
    expect(data.notice).toBe('The configured AI model was not found.');
    expect(JSON.stringify(data)).not.toContain('decommissioned');
  });

  it('falls back to facts-only on upstream 429 rate limit (provider_rate)', async () => {
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
    expect(data.reason).toBe('provider_rate');
    expect(data.notice).toBe('The AI provider is rate limiting requests.');
    expect(JSON.stringify(data)).not.toContain('quota depleted');
  });

  it('handles provider 500 error with provider_error notice', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    process.env.AI_MODEL = 'llama-3.3-70b-versatile';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal cluster failure in inference engine',
    } as Response);

    const req = createRequest({ project: { name: 'legacy-auth' } });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('facts-only');
    expect(data.reason).toBe('provider_error');
    expect(data.notice).toBe('The AI answer could not be used.');
    expect(JSON.stringify(data)).not.toContain('inference engine');
  });

  it('falls back to facts-only cleanly on network failure / timeout (timeout)', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    process.env.AI_MODEL = 'openai/gpt-oss-120b';

    const err = new Error('Connection timed out');
    err.name = 'AbortError';
    globalThis.fetch = vi.fn().mockRejectedValue(err);

    const req = createRequest({
      project: {
        name: 'payment-core',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('facts-only');
    expect(data.reason).toBe('timeout');
    expect(data.notice).toBe('The AI request timed out.');
  });

  it('returns validated AI suggestions on a good answer', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    process.env.AI_MODEL = 'llama-3.3-70b-versatile';

    const mockAiPayload = {
      whatWasBuilt: 'Express API with JWT middleware and PostgreSQL user accounts table.',
      whatBroke: 'Race condition occurred during Redis session token revocation in multi-pod cluster.',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockAiPayload) } }],
      }),
    } as Response);

    const req = createRequest({
      project: {
        name: 'legacy-auth',
        stack: ['Node.js', 'PostgreSQL'],
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('ai');
    expect(data.whatWasBuilt).toContain('Express API');
    expect(data.whatBroke).toContain('Race condition');
    expect(JSON.stringify(data)).not.toContain('gsk_test_key_123');
  });

  it('handles an answer wrapped in text like "Here is the JSON: {...}"', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    process.env.AI_MODEL = 'llama-3.3-70b-versatile';

    const raw =
      'Here is the JSON: {"whatWasBuilt": "Express API with JWT middleware.", "whatBroke": "RabbitMQ pool starvation after 2 hours."} Hope that helps!';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: raw } }],
      }),
    } as Response);

    const req = createRequest({ project: { name: 'legacy-auth' } });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('ai');
    expect(data.whatWasBuilt).toBe('Express API with JWT middleware.');
    expect(data.whatBroke).toBe('RabbitMQ pool starvation after 2 hours.');
  });

  it('handles an answer inside a code fence', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    process.env.AI_MODEL = 'llama-3.3-70b-versatile';

    const raw =
      '```json\n{"whatWasBuilt": "React dashboard with Chart.js charts.", "whatBroke": "CORS preflight failures on production ingress."}\n```';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: raw } }],
      }),
    } as Response);

    const req = createRequest({ project: { name: 'analytics-dash' } });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('ai');
    expect(data.whatWasBuilt).toBe('React dashboard with Chart.js charts.');
  });

  it('handles an answer with a <think> block', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    process.env.AI_MODEL = 'llama-3.3-70b-versatile';

    const raw =
      '<think>Analyzing project files and readme...</think> {"whatWasBuilt": "Go microservice processing image uploads.", "whatBroke": "OOM killer terminating pod on 4K files."}';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: raw } }],
      }),
    } as Response);

    const req = createRequest({ project: { name: 'image-proc' } });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('ai');
    expect(data.whatWasBuilt).toBe('Go microservice processing image uploads.');
  });

  it('uses facts-only with notice when BOTH whatWasBuilt and whatBroke are empty', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    process.env.AI_MODEL = 'llama-3.3-70b-versatile';

    const raw = '{"whatWasBuilt": null, "whatBroke": null}';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: raw } }],
      }),
    } as Response);

    const req = createRequest({ project: { name: 'empty-repo' } });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('facts-only');
    expect(data.notice).toBe('The AI found nothing in the repository text to suggest.');
    expect(data.reason).toBe('empty_suggestions');
    expect(data.whatWasBuilt).toBeNull();
    expect(data.whatBroke).toBeNull();
  });
});
