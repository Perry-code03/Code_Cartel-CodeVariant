import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeRepo, chatWithOracle } from '../api';

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

    await expect(analyzeRepo('https://github.com/test/repo')).rejects.toThrow(
      'Unable to reach the analysis service'
    );
  });
});

describe('chatWithOracle in src/lib/api.ts', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns OracleAiResponse on successful 200 response', async () => {
    const mockResponse = {
      answer: 'Revive email-worker first.',
      suggestedFollowUps: ['How to start?'],
      source: 'ai',
      aiProviderName: 'Groq',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const result = await chatWithOracle('What to revive?', []);
    expect(result.answer).toBe('Revive email-worker first.');
    expect(result.source).toBe('ai');
    expect(result.aiProviderName).toBe('Groq');
  });

  it('returns fallback notice cleanly on server 429 rate limit or error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        fallback: true,
        notice: 'Oracle query rate limit reached. Please wait a minute before querying again.',
      }),
    } as Response);

    const result = await chatWithOracle('What to revive?', []);
    expect(result.fallback).toBe(true);
    expect(result.notice).toContain('rate limit');
    expect(result.source).toBe('local');
  });

  it('returns fallback notice on network/fetch failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await chatWithOracle('What to revive?', []);
    expect(result.fallback).toBe(true);
    expect(result.notice).toContain('Unable to reach the Oracle backend service');
    expect(result.source).toBe('local');
  });
});
