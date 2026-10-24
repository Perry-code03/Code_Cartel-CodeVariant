import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeRepo } from '../api';

describe('analyzeRepo in src/lib/api.ts', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns RepoAnalysis on successful 200 response', async () => {
    const mockAnalysis = {
      name: 'react-vault',
      description: 'A personal cemetery for dead projects',
      stack: ['React', 'TypeScript'],
      category: 'Web App',
      source: 'github-only',
      repoUrl: 'https://github.com/test/react-vault',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockAnalysis,
    } as Response);

    const result = await analyzeRepo('https://github.com/test/react-vault');
    expect(result).toEqual(mockAnalysis);
  });

  it('throws friendly error message from server response error field', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Repository not found or private (only public repos work).' }),
    } as Response);

    await expect(analyzeRepo('https://github.com/test/unknown')).rejects.toThrow(
      'Repository not found or private (only public repos work).'
    );
  });

  it('throws friendly network error message when fetch fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    await expect(analyzeRepo('https://github.com/test/network-fail')).rejects.toThrow(
      'Unable to reach the analysis service. If running locally, verify your local dev server or vercel dev is running.'
    );
  });
});
