import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../../../api/analyze-repo';

describe('POST /api/analyze-repo', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('rejects non-POST requests with 405', async () => {
    const req = new Request('http://localhost/api/analyze-repo', {
      method: 'GET',
    });
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

  it('returns deterministic result when GitHub returns public repo facts', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string | URL) => {
      const urlStr = url.toString();
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
          json: async () => [
            {
              name: 'package.json',
              type: 'file',
            },
          ],
        } as Response);
      }
      if (urlStr.includes('/contents/package.json')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              dependencies: { react: '^19.0.0', tailwindcss: '^4.0.0' },
            }),
        } as Response);
      }
      if (urlStr.endsWith('/readme')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '# Test Repo\nA great test project.',
        } as Response);
      }
      // Main repo
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          name: 'test-repo',
          description: 'A test project description',
          pushed_at: '2026-03-01T12:00:00Z',
          topics: ['react', 'starter'],
          private: false,
        }),
      } as Response);
    });

    const req = new Request('http://localhost/api/analyze-repo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify({ url: 'https://github.com/test-owner/test-repo' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      name: string;
      description: string;
      stack: string[];
      category: string;
      source: string;
      repoUrl: string;
    };
    expect(data.name).toBe('test-repo');
    expect(data.description).toBe('A test project description');
    expect(data.stack).toContain('React');
    expect(data.category).toBe('Web App');
    expect(data.source).toBe('github-only');
    expect(data.repoUrl).toBe('https://github.com/test-owner/test-repo');
  });
});
