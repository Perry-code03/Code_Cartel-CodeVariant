import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAiConfig,
  resolveAiEndpoint,
  extractBalancedJson,
  parseAiJson,
  logAiFailure,
  getAutopsyFailureNotice,
  callAiProvider,
} from '../ai-provider.js';

describe('ai-provider', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('getAiConfig', () => {
    it('cleans quotes, trims whitespace and returns missingVars', () => {
      const config = getAiConfig({
        AI_API_KEY: '  "gsk_my_secret_key"  ',
        AI_MODEL: " 'llama-3.3-70b-versatile' ",
        AI_BASE_URL: '   ',
      });
      expect(config.apiKey).toBe('gsk_my_secret_key');
      expect(config.model).toBe('llama-3.3-70b-versatile');
      expect(config.baseUrl).toBeUndefined();
      expect(config.missingVars).toEqual([]);
    });

    it('identifies missing variables', () => {
      const config = getAiConfig({});
      expect(config.apiKey).toBeUndefined();
      expect(config.model).toBeUndefined();
      expect(config.missingVars).toContain('AI_API_KEY');
      expect(config.missingVars).toContain('AI_MODEL');
    });
  });

  describe('resolveAiEndpoint', () => {
    it('auto-normalizes Groq baseUrl with /openai/v1', () => {
      const ep1 = resolveAiEndpoint('https://api.groq.com');
      expect(ep1?.url).toBe('https://api.groq.com/openai/v1/chat/completions');
      expect(ep1?.providerName).toBe('Groq');

      const ep2 = resolveAiEndpoint('https://api.groq.com/openai/v1');
      expect(ep2?.url).toBe('https://api.groq.com/openai/v1/chat/completions');
    });

    it('auto-normalizes xAI baseUrl with /v1', () => {
      const ep = resolveAiEndpoint('https://api.x.ai');
      expect(ep?.url).toBe('https://api.x.ai/v1/chat/completions');
      expect(ep?.providerName).toBe('xAI');
    });

    it('rejects unallowlisted hosts or non-https protocols', () => {
      expect(resolveAiEndpoint('http://api.groq.com')).toBeNull();
      expect(resolveAiEndpoint('https://untrusted-api.com/v1')).toBeNull();
    });
  });

  describe('extractBalancedJson & parseAiJson', () => {
    it('handles a clean JSON answer', () => {
      const raw = '{"whatWasBuilt": "Core API", "whatBroke": "Memory leak"}';
      expect(parseAiJson(raw)).toEqual({
        whatWasBuilt: 'Core API',
        whatBroke: 'Memory leak',
      });
    });

    it('handles an answer wrapped in text like "Here is the JSON: {...}"', () => {
      const raw =
        'Here is the JSON: {"whatWasBuilt": "Core API", "whatBroke": "Memory leak"} Hope this helps!';
      expect(parseAiJson(raw)).toEqual({
        whatWasBuilt: 'Core API',
        whatBroke: 'Memory leak',
      });
    });

    it('handles an answer inside a code fence', () => {
      const raw = '```json\n{"whatWasBuilt": "Core API", "whatBroke": "Memory leak"}\n```';
      expect(parseAiJson(raw)).toEqual({
        whatWasBuilt: 'Core API',
        whatBroke: 'Memory leak',
      });
    });

    it('handles an answer with a <think> block', () => {
      const raw =
        '<think>Analyzing code repository...\nUser wants JSON</think>\n{"whatWasBuilt": "Core API", "whatBroke": "Memory leak"}';
      expect(parseAiJson(raw)).toEqual({
        whatWasBuilt: 'Core API',
        whatBroke: 'Memory leak',
      });
    });

    it('handles combined <think>, markdown fences, and outer text', () => {
      const raw =
        '<think>Thinking</think> Sure, here is your answer:\n```json\n{"whatWasBuilt": "Done", "whatBroke": null}\n```';
      expect(parseAiJson(raw)).toEqual({
        whatWasBuilt: 'Done',
        whatBroke: null,
      });
    });

    it('returns null for unbalanced or invalid JSON', () => {
      expect(extractBalancedJson('No JSON here')).toBeNull();
      expect(extractBalancedJson('{"unclosed": true')).toBeNull();
      expect(parseAiJson('{"invalid": badJson}')).toBeNull();
    });
  });

  describe('logAiFailure', () => {
    it('never logs keys and only logs variable names for missing configuration', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logAiFailure('no_key', undefined, undefined, ['AI_API_KEY']);
      expect(errorSpy).toHaveBeenCalledWith(
        '[ai-provider] no_key: missing configuration (AI_API_KEY)'
      );

      logAiFailure('provider_auth', 401, 'Unauthorized request with secret token');
      expect(errorSpy).toHaveBeenCalledWith(
        '[ai-provider] provider_auth (status: 401): Unauthorized request with secret token'
      );
    });
  });

  describe('callAiProvider outcomes', () => {
    const config = {
      apiKey: 'gsk_test_secret_123',
      model: 'llama-3.3-70b-versatile',
      missingVars: [],
    };

    it('reports no_key when apiKey is missing', async () => {
      const res = await callAiProvider({
        messages: [{ role: 'user', content: 'test' }],
        config: { model: 'llama-3.3', missingVars: ['AI_API_KEY'] },
      });
      expect(res.outcome).toBe('no_key');
    });

    it('reports no_model when model is missing', async () => {
      const res = await callAiProvider({
        messages: [{ role: 'user', content: 'test' }],
        config: { apiKey: 'gsk_test', missingVars: ['AI_MODEL'] },
      });
      expect(res.outcome).toBe('no_model');
    });

    it('reports provider_auth on 401/403 and never retries', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 401,
          text: async () => 'Invalid API Key',
        } as Response);
      });

      const res = await callAiProvider({
        messages: [{ role: 'user', content: 'test' }],
        config,
        retryDelayMs: 0,
      });
      expect(res.outcome).toBe('provider_auth');
      expect(res.status).toBe(401);
      expect(callCount).toBe(1); // Never retries
    });

    it('reports provider_model on 400 or 404', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Model not found: llama-3.1-old',
      } as Response);

      const res = await callAiProvider({
        messages: [{ role: 'user', content: 'test' }],
        config,
        retryDelayMs: 0,
      });
      expect(res.outcome).toBe('provider_model');
      expect(res.status).toBe(404);
    });

    it('retries once without response_format if provider returns 400 on jsonMode', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation((_url, init?: RequestInit) => {
        callCount++;
        const body = JSON.parse(init?.body as string);
        if (body.response_format) {
          return Promise.resolve({
            ok: false,
            status: 400,
            text: async () => 'response_format is not supported by this model',
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: '{"success": true}' } }],
          }),
        } as Response);
      });

      const res = await callAiProvider({
        messages: [{ role: 'user', content: 'test' }],
        config,
        jsonMode: true,
        retryDelayMs: 0,
      });
      expect(res.outcome).toBe('ok');
      expect(callCount).toBe(2);
      expect(res.rawText).toBe('{"success": true}');
    });

    it('reports provider_rate on 429 after 1 retry', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 429,
          text: async () => 'Rate limit exceeded',
        } as Response);
      });

      const res = await callAiProvider({
        messages: [{ role: 'user', content: 'test' }],
        config,
        retryDelayMs: 0,
      });
      expect(res.outcome).toBe('provider_rate');
      expect(callCount).toBe(2); // Retried once
    });

    it('reports provider_error on 500 after 1 retry', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 500,
          text: async () => 'Internal server error',
        } as Response);
      });

      const res = await callAiProvider({
        messages: [{ role: 'user', content: 'test' }],
        config,
        retryDelayMs: 0,
      });
      expect(res.outcome).toBe('provider_error');
      expect(callCount).toBe(2);
    });

    it('reports timeout on AbortError / network timeout after 1 retry', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const res = await callAiProvider({
        messages: [{ role: 'user', content: 'test' }],
        config,
        retryDelayMs: 0,
      });
      expect(res.outcome).toBe('timeout');
      expect(callCount).toBe(2);
    });

    it('reports bad_output if provider returns 200 with empty choices', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ choices: [] }),
      } as Response);

      const res = await callAiProvider({
        messages: [{ role: 'user', content: 'test' }],
        config,
        retryDelayMs: 0,
      });
      expect(res.outcome).toBe('bad_output');
    });

    it('never leaks the API key in the errorSnippet', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => `Token error with key gsk_test_secret_123 in authorization`,
      } as Response);

      const res = await callAiProvider({
        messages: [{ role: 'user', content: 'test' }],
        config,
        retryDelayMs: 0,
      });
      expect(res.errorSnippet).not.toContain('gsk_test_secret_123');
      expect(res.errorSnippet).toContain('[REDACTED]');
    });
  });
});
