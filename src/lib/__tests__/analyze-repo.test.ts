import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../../../api/analyze-repo';

describe('POST /api/analyze-repo', () => {
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

  const mockGithubFetch = (customAiHandler?: (url: string, init?: RequestInit) => Promise<Response>) => {
    return (url: string | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = url.toString();
      if (urlStr.includes('/chat/completions') && customAiHandler) {
        return customAiHandler(urlStr, init);
      }
      if (urlStr.endsWith('/languages')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ TypeScript: 2000, CSS: 500 }),
        } as Response);
      }
      if (urlStr.endsWith('/contents')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [{ name: 'package.json', type: 'file' }],
        } as Response);
      }
      if (urlStr.includes('/contents/package.json')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ dependencies: { react: '^19.0.0' } }),
        } as Response);
      }
      if (urlStr.endsWith('/readme')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '# Test Repo\nReadme text.',
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          name: 'test-repo',
          description: 'A test project description',
          pushed_at: '2026-03-01T12:00:00Z',
          topics: ['react'],
          private: false,
        }),
      } as Response);
    };
  };

  it('rejects non-POST requests with 405', async () => {
    const req = new Request('http://localhost/api/analyze-repo', { method: 'GET' });
    const res = await POST(req);
    expect(res.status).toBe(405);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain('Method not allowed');
  });

  it('rejects bodies larger than 2 KB with 413', async () => {
    const hugeString = 'a'.repeat(2100);
    const req = new Request('http://localhost/api/analyze-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: hugeString }),
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('rejects invalid JSON payloads with 400', async () => {
    const req = new Request('http://localhost/api/analyze-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not valid json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe('Invalid JSON payload.');
  });

  it('rejects missing or invalid GitHub URLs with 400', async () => {
    const req1 = new Request('http://localhost/api/analyze-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(400);

    const req2 = new Request('http://localhost/api/analyze-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://gitlab.com/owner/repo' }),
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
    const body2 = (await res2.json()) as { error?: string };
    expect(body2.error).toContain('Please provide a valid public GitHub repository URL');
  });

  it('handles GitHub 404 (repo not found or private)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
    } as Response);

    const req = new Request('http://localhost/api/analyze-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://github.com/fake-owner/fake-repo' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe('Repository not found or private (only public repos work).');
  });

  it('handles GitHub 403/429 rate limit errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 403,
      ok: false,
    } as Response);

    const req = new Request('http://localhost/api/analyze-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://github.com/fake-owner/fake-repo' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe('GitHub rate limit, try again later.');
  });

  it('falls back cleanly to deterministic result when AI keys are missing', async () => {
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;
    globalThis.fetch = vi.fn().mockImplementation(mockGithubFetch());

    const req = new Request('http://localhost/api/analyze-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ url: 'https://github.com/test-owner/test-repo' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { source: string; name: string };
    expect(data.source).toBe('github-only');
    expect(data.name).toBe('test-repo');
  });

  it('rejects non-allowlisted AI_BASE_URL (SSRF prevention) and falls back', async () => {
    process.env.AI_API_KEY = 'test-key';
    process.env.AI_MODEL = 'test-model';
    process.env.AI_BASE_URL = 'https://malicious-site.com/v1';

    const aiFetchSpy = vi.fn();
    globalThis.fetch = vi.fn().mockImplementation((url, init) => {
      if (url.toString().includes('malicious')) {
        aiFetchSpy();
      }
      return mockGithubFetch()(url, init);
    });

    const req = new Request('http://localhost/api/analyze-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ url: 'https://github.com/test-owner/test-repo' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { source: string };
    expect(data.source).toBe('github-only');
    expect(aiFetchSpy).not.toHaveBeenCalled();
  });

  it('returns github-only with notice when AI provider returns 429 rate limit', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_12345';
    process.env.AI_MODEL = 'llama-3.3-70b-versatile';
    process.env.AI_BASE_URL = 'https://api.groq.com/openai/v1';

    globalThis.fetch = vi.fn().mockImplementation(
      mockGithubFetch(async () => ({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: { message: 'Rate limit reached' } }),
      } as Response))
    );

    const req = new Request('http://localhost/api/analyze-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ url: 'https://github.com/test-owner/test-repo' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { source: string; notice?: string };
    expect(data.source).toBe('github-only');
    expect(data.notice).toBe('AI suggestions unavailable right now, showing GitHub data only.');
  });

  it('returns github-only with notice when AI provider returns invalid JSON', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_12345';
    process.env.AI_MODEL = 'llama-3.3-70b-versatile';

    globalThis.fetch = vi.fn().mockImplementation(
      mockGithubFetch(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'Not valid json at all' } }],
        }),
      } as Response))
    );

    const req = new Request('http://localhost/api/analyze-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ url: 'https://github.com/test-owner/test-repo' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { source: string; notice?: string };
    expect(data.source).toBe('github-only');
    expect(data.notice).toBe('AI suggestions unavailable right now, showing GitHub data only.');
  });

  it('retries once without response_format if AI provider returns 400', async () => {
    process.env.AI_API_KEY = 'gsk_test_key_12345';
    process.env.AI_MODEL = 'llama-3.3-70b-versatile';
    process.env.AI_BASE_URL = 'https://api.groq.com/openai/v1';

    let attempts = 0;
    globalThis.fetch = vi.fn().mockImplementation(
      mockGithubFetch(async (_url, init) => {
        attempts++;
        const parsedBody = JSON.parse(init?.body as string);
        if (attempts === 1) {
          expect(parsedBody.response_format).toEqual({ type: 'json_object' });
          return { ok: false, status: 400 } as Response;
        }
        // Second attempt must not have response_format
        expect(parsedBody.response_format).toBeUndefined();
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    name: 'retried-ai-project',
                    description: 'Normalized description from retry.',
                    stack: ['React', 'TypeScript'],
                    category: 'Web App',
                  }),
                },
              },
            ],
          }),
        } as Response;
      })
    );

    const req = new Request('http://localhost/api/analyze-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ url: 'https://github.com/test-owner/test-repo' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { source: string; name: string; aiProviderName?: string };
    expect(data.source).toBe('github+ai');
    expect(data.name).toBe('retried-ai-project');
    expect(data.aiProviderName).toBe('Groq');
    expect(attempts).toBe(2);
  });

  it('sets aiProviderName to xAI when using api.x.ai base url', async () => {
    process.env.AI_API_KEY = 'xai-secret-key-123';
    process.env.AI_MODEL = 'grok-2';
    process.env.AI_BASE_URL = 'https://api.x.ai/v1';

    globalThis.fetch = vi.fn().mockImplementation(
      mockGithubFetch(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  name: 'xai-analyzed-repo',
                  description: 'Analyzed using xAI.',
                  stack: ['Python', 'FastAPI'],
                  category: 'API / Backend',
                }),
              },
            },
          ],
        }),
      } as Response))
    );

    const req = new Request('http://localhost/api/analyze-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ url: 'https://github.com/test-owner/test-repo' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { source: string; aiProviderName?: string; name: string };
    expect(data.source).toBe('github+ai');
    expect(data.aiProviderName).toBe('xAI');
    expect(data.name).toBe('xai-analyzed-repo');
  });

  it('never leaks API keys or environment secrets in response body', async () => {
    const SECRET_AI_KEY = 'gsk_SUPER_CONFIDENTIAL_KEY_999';
    const SECRET_GH_TOKEN = 'ghp_SECRET_TOKEN_888';
    process.env.AI_API_KEY = SECRET_AI_KEY;
    process.env.AI_MODEL = 'test-model';
    process.env.GITHUB_TOKEN = SECRET_GH_TOKEN;

    globalThis.fetch = vi.fn().mockImplementation(
      mockGithubFetch(async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Error',
        text: async () => `Upstream failure with key ${SECRET_AI_KEY}`,
      } as Response))
    );

    const req = new Request('http://localhost/api/analyze-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ url: 'https://github.com/test-owner/test-repo' }),
    });

    const res = await POST(req);
    const responseText = await res.text();
    expect(responseText).not.toContain(SECRET_AI_KEY);
    expect(responseText).not.toContain(SECRET_GH_TOKEN);
    expect(responseText).not.toContain('process.env');
  });
});
