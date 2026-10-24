import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../../../api/oracle-chat';

describe('POST /api/oracle-chat', () => {
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
    return new Request('https://projectgraveyard.local/api/oracle-chat', {
      method: options.method || 'POST',
      headers,
      body: isGetOrHead ? undefined : rawBody,
    });
  };

  it('rejects non-POST method with 405', async () => {
    const req = createRequest({ message: 'Hello' }, { method: 'GET' });
    const res = await POST(req);
    expect(res.status).toBe(405);
  });

  it('rejects payloads over 4096 bytes with 413', async () => {
    const bigString = 'x'.repeat(4500);
    const req = createRequest({ message: bigString });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('rejects missing or empty message with 400', async () => {
    const req1 = createRequest({});
    const res1 = await POST(req1);
    expect(res1.status).toBe(400);

    const req2 = createRequest({ message: '   ' });
    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
  });

  it('rejects message exceeding 500 characters with 400', async () => {
    const req = createRequest({ message: 'a'.repeat(501) });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('falls back when AI_API_KEY or AI_MODEL is missing', async () => {
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;

    const req = createRequest({ message: 'Which project should I revive?' });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.fallback).toBe(true);
    expect(data.notice).toContain('AI_API_KEY not configured');
  });

  it('falls back when AI_MODEL is missing', async () => {
    process.env.AI_API_KEY = 'gsk_test';
    delete process.env.AI_MODEL;

    const req = createRequest({ message: 'Which project should I revive?' });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.fallback).toBe(true);
    expect(data.notice).toContain('AI_MODEL not configured');
  });

  it('rejects non-allowlisted AI_BASE_URL host with fallback', async () => {
    process.env.AI_API_KEY = 'secret-key-123';
    process.env.AI_MODEL = 'llama-3.3-70b-versatile';
    process.env.AI_BASE_URL = 'https://evil-server.com/v1';

    const req = createRequest({ message: 'Which project should I revive?' });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.fallback).toBe(true);
    expect(data.notice).toContain('AI endpoint not allowlisted');
  });

  it('successfully returns AI advice and parses follow-up chips with Groq provider', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    process.env.AI_MODEL = 'llama-3.3-70b-versatile';
    process.env.AI_BASE_URL = 'https://api.groq.com/openai/v1';

    const mockAiAnswer = `You have strong foundations in email-worker. Resurrecting it as an isolated microservice would yield immediate ROI.

FOLLOW_UPS:
- What should be in day 1 of the Phoenix sprint?
- Can I reuse the JWT auth component?`;

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
                content: mockAiAnswer,
              },
            },
          ],
        }),
      } as Response);
    });

    const req = createRequest({
      message: 'Which project should I revive first?',
      graveyardContext: [
        {
          name: 'email-worker',
          status: 'resurrecting',
          completion: 80,
          category: 'Dev Tool',
          stack: ['Node.js', 'Redis'],
        },
      ],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('ai');
    expect(data.aiProviderName).toBe('Groq');
    expect(data.answer).toContain('email-worker');
    expect(data.suggestedFollowUps).toEqual([
      'What should be in day 1 of the Phoenix sprint?',
      'Can I reuse the JWT auth component?',
    ]);

    // Ensure secret key is not in response
    const jsonStr = JSON.stringify(data);
    expect(jsonStr).not.toContain('gsk_test_key_123');
  });

  it('supports xAI provider endpoint and assigns xAI providerName', async () => {
    process.env.AI_API_KEY = 'xai-test-key-456';
    process.env.AI_MODEL = 'grok-beta';
    process.env.AI_BASE_URL = 'https://api.x.ai/v1';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'Revive email-worker.' } }],
      }),
    } as Response);

    const req = createRequest({ message: 'Help me choose' });
    const res = await POST(req);
    const data = await res.json();

    expect(data.source).toBe('ai');
    expect(data.aiProviderName).toBe('xAI');
    expect(data.answer).toBe('Revive email-worker.');
  });

  it('falls back gracefully on upstream 429 or 500 without leaking error bodies', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    process.env.AI_MODEL = 'llama-3.3-70b-versatile';
    process.env.AI_BASE_URL = 'https://api.groq.com/openai/v1';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded: quota depleted for tier',
    } as Response);

    const req = createRequest({ message: 'What about payment-core?' });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.fallback).toBe(true);
    expect(data.notice).toContain('AI Oracle unavailable right now');

    // Never leak upstream error messages
    const bodyText = JSON.stringify(data);
    expect(bodyText).not.toContain('quota depleted');
  });

  it('falls back cleanly on fetch timeout or network failure', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_123';
    process.env.AI_MODEL = 'llama-3.3-70b-versatile';

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection timed out'));

    const req = createRequest({ message: 'What about payment-core?' });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.fallback).toBe(true);
    expect(data.notice).toContain('timed out');
  });
});
