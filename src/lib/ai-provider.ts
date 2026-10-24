export type AiOutcome =
  | 'ok'
  | 'no_key'
  | 'no_model'
  | 'provider_auth'
  | 'provider_model'
  | 'provider_rate'
  | 'provider_error'
  | 'timeout'
  | 'bad_output';

export interface AiConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  missingVars: string[];
}

export interface AiEndpoint {
  url: string;
  providerName: 'Groq' | 'xAI';
}

export interface AiCallResult {
  outcome: AiOutcome;
  status?: number;
  rawText?: string;
  providerName?: 'Groq' | 'xAI';
  errorSnippet?: string;
  missingVars?: string[];
}

export interface CallAiProviderOptions {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  jsonMode?: boolean;
  config?: AiConfig;
  timeoutMs?: number;
  retryDelayMs?: number;
}

export const ALLOWED_AI_HOSTS: Record<string, 'Groq' | 'xAI'> = {
  'api.groq.com': 'Groq',
  'api.x.ai': 'xAI',
};

/**
 * Reads, trims, and cleans AI environment variables.
 * Strips accidental surrounding quotes and treats empty AI_BASE_URL as default.
 */
export function getAiConfig(
  env: Record<string, string | undefined> = typeof process !== 'undefined' && process.env ? process.env : {}
): AiConfig {
  let apiKey = (env.AI_API_KEY || env.GROQ_API_KEY || env.XAI_API_KEY)?.trim();
  if (apiKey) {
    apiKey = apiKey.replace(/^["']|["']$/g, '').trim();
  }
  let model = env.AI_MODEL?.trim();
  if (model) {
    model = model.replace(/^["']|["']$/g, '').trim();
  }
  let baseUrl = env.AI_BASE_URL?.trim();
  if (baseUrl) {
    baseUrl = baseUrl.replace(/^["']|["']$/g, '').trim();
  }
  if (!baseUrl) {
    baseUrl = undefined;
  }

  const missingVars: string[] = [];
  if (!apiKey) missingVars.push('AI_API_KEY');
  if (!model) missingVars.push('AI_MODEL');

  return {
    apiKey,
    model,
    baseUrl,
    missingVars,
  };
}

/**
 * Validates and resolves the chat completion endpoint for allowlisted providers.
 * Automatically adds /openai/v1 for Groq and /v1 for xAI if omitted.
 */
export function resolveAiEndpoint(rawBaseUrl?: string): AiEndpoint | null {
  const base = (rawBaseUrl || 'https://api.groq.com/openai/v1').trim();
  try {
    const parsed = new URL(base);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    const host = parsed.hostname.toLowerCase();
    const providerName = ALLOWED_AI_HOSTS[host];
    if (!providerName) {
      return null;
    }
    let cleanBase = base.replace(/\/+$/, '');
    if (host === 'api.groq.com' && !cleanBase.includes('/openai/v1')) {
      cleanBase = `${cleanBase}/openai/v1`;
    }
    if (host === 'api.x.ai' && !cleanBase.endsWith('/v1')) {
      cleanBase = `${cleanBase}/v1`;
    }
    return {
      url: `${cleanBase}/chat/completions`,
      providerName,
    };
  } catch {
    return null;
  }
}

/**
 * Cleans raw model output: removes <think>...</think> blocks and code fences,
 * then extracts the first balanced {...} block.
 */
export function extractBalancedJson(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;

  // 1. Remove <think>...</think> blocks
  let cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/gi, '');

  // 2. Remove code fences ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/```(?:json)?/gi, '').replace(/```/g, '');

  // 3. Find first '{'
  const start = cleaned.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      if (inString) {
        escape = true;
      }
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          return cleaned.slice(start, i + 1);
        }
      }
    }
  }

  return null;
}

/**
 * Extracts and parses balanced JSON from raw AI text.
 */
export function parseAiJson<T = unknown>(raw: string): T | null {
  const jsonStr = extractBalancedJson(raw);
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/**
 * Logs failure on server: one short line, outcome code, HTTP status, and first 200 chars.
 * Missing configuration logs ONLY variable names. Never logs secrets or prompts.
 */
export function logAiFailure(
  outcome: AiOutcome,
  status?: number,
  errorMessage?: string,
  missingVars?: string[]
): void {
  if (outcome === 'ok') return;

  if (outcome === 'no_key' || outcome === 'no_model') {
    const vars =
      missingVars && missingVars.length > 0
        ? missingVars.join(', ')
        : outcome === 'no_key'
          ? 'AI_API_KEY'
          : 'AI_MODEL';
    console.error(`[ai-provider] ${outcome}: missing configuration (${vars})`);
    return;
  }

  let cleanMsg = (errorMessage || '')
    .slice(0, 200)
    .replace(/[\r\n]+/g, ' ')
    .trim();

  const statusStr = status !== undefined ? ` (status: ${status})` : '';
  const msgStr = cleanMsg ? `: ${cleanMsg}` : '';
  console.error(`[ai-provider] ${outcome}${statusStr}${msgStr}`);
}

/**
 * Maps AI failure outcomes to honest, safe UI notices and reason codes for Autopsy suggestions.
 */
export function getAutopsyFailureNotice(
  outcome: AiOutcome,
  missingVars?: string[]
): { notice: string; reason: string } {
  switch (outcome) {
    case 'no_key':
    case 'no_model': {
      const vars =
        missingVars && missingVars.length > 0
          ? missingVars.join(' or ')
          : 'AI_API_KEY or AI_MODEL';
      return {
        notice: `AI is not configured on this deployment (missing ${vars}). Showing repository activity facts.`,
        reason: outcome,
      };
    }
    case 'provider_auth':
      return {
        notice: 'The AI provider rejected the key.',
        reason: 'provider_auth',
      };
    case 'provider_model':
      return {
        notice: 'The configured AI model was not found.',
        reason: 'provider_model',
      };
    case 'provider_rate':
      return {
        notice: 'The AI provider is rate limiting requests.',
        reason: 'provider_rate',
      };
    case 'timeout':
      return {
        notice: 'The AI request timed out.',
        reason: 'timeout',
      };
    case 'bad_output':
      return {
        notice: 'The AI answer could not be used.',
        reason: 'bad_output',
      };
    case 'provider_error':
    default:
      return {
        notice: 'The AI answer could not be used.',
        reason: 'provider_error',
      };
  }
}

/**
 * Maps AI failure outcomes to honest, safe UI notices for Oracle Chat.
 */
export function getOracleFailureNotice(
  outcome: AiOutcome,
  missingVars?: string[]
): { notice: string; reason: string } {
  switch (outcome) {
    case 'no_key':
    case 'no_model': {
      const vars =
        missingVars && missingVars.length > 0
          ? missingVars.join(' or ')
          : 'AI_API_KEY or AI_MODEL';
      return {
        notice: `AI is not configured on this deployment (missing ${vars}). Using local heuristic engine.`,
        reason: outcome,
      };
    }
    case 'provider_auth':
      return {
        notice: 'The AI provider rejected the key. Showing local guidance.',
        reason: 'provider_auth',
      };
    case 'provider_model':
      return {
        notice: 'The configured AI model was not found. Showing local guidance.',
        reason: 'provider_model',
      };
    case 'provider_rate':
      return {
        notice: 'The AI provider is rate limiting requests. Showing local guidance.',
        reason: 'provider_rate',
      };
    case 'timeout':
      return {
        notice: 'The AI request timed out. Showing local guidance.',
        reason: 'timeout',
      };
    case 'bad_output':
    case 'provider_error':
    default:
      return {
        notice: 'AI Oracle unavailable right now. Showing local guidance.',
        reason: outcome,
      };
  }
}

async function executeSingleFetch(
  url: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  useJsonMode: boolean,
  timeoutMs: number
): Promise<{ res?: Response; timedOut?: boolean; err?: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const bodyPayload: Record<string, unknown> = {
      model,
      temperature,
      messages,
    };
    if (useJsonMode) {
      bodyPayload.response_format = { type: 'json_object' };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });
    return { res };
  } catch (err: unknown) {
    const isTimeout =
      (err as { name?: string })?.name === 'AbortError' ||
      String(err).toLowerCase().includes('timeout') ||
      String(err).toLowerCase().includes('aborted');
    return { timedOut: isTimeout, err };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls the allowlisted AI provider with timeout (default 12s),
 * optional json_object mode (retry once on 400 without it),
 * and retry once on timeout/429/5xx only after ~1s.
 */
export async function callAiProvider(
  options: CallAiProviderOptions
): Promise<AiCallResult> {
  const cfg = options.config || getAiConfig();
  const timeoutMs = options.timeoutMs ?? 12000;
  const retryDelayMs = options.retryDelayMs ?? 1000;

  if (!cfg.apiKey) {
    logAiFailure('no_key', undefined, undefined, cfg.missingVars);
    return { outcome: 'no_key', missingVars: cfg.missingVars };
  }

  if (!cfg.model) {
    logAiFailure('no_model', undefined, undefined, cfg.missingVars);
    return { outcome: 'no_model', missingVars: cfg.missingVars };
  }

  const endpoint = resolveAiEndpoint(cfg.baseUrl);
  if (!endpoint) {
    const msg = 'AI endpoint not allowlisted';
    logAiFailure('provider_error', undefined, msg);
    return { outcome: 'provider_error', errorSnippet: msg };
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // First fetch attempt
  let initial = await executeSingleFetch(
    endpoint.url,
    cfg.apiKey,
    cfg.model,
    options.messages,
    options.temperature ?? 0.1,
    Boolean(options.jsonMode),
    timeoutMs
  );

  // If first attempt timed out, retry once after ~1s
  if (initial.timedOut) {
    if (retryDelayMs > 0) await sleep(retryDelayMs);
    const retry = await executeSingleFetch(
      endpoint.url,
      cfg.apiKey,
      cfg.model,
      options.messages,
      options.temperature ?? 0.1,
      Boolean(options.jsonMode),
      timeoutMs
    );
    if (retry.timedOut || !retry.res) {
      logAiFailure('timeout', undefined, 'Request timed out after retry');
      return { outcome: 'timeout', providerName: endpoint.providerName };
    }
    initial = retry;
  }

  if (!initial.res) {
    logAiFailure('timeout', undefined, 'Network connection failure');
    return { outcome: 'timeout', providerName: endpoint.providerName };
  }

  let res = initial.res;

  // Handle 400 when jsonMode was sent: retry ONCE without response_format
  if (res.status === 400 && options.jsonMode) {
    const retryWithoutJson = await executeSingleFetch(
      endpoint.url,
      cfg.apiKey,
      cfg.model,
      options.messages,
      options.temperature ?? 0.1,
      false,
      timeoutMs
    );
    if (retryWithoutJson.res) {
      res = retryWithoutJson.res;
    }
  }

  // Handle 429 or 5xx: retry ONCE after ~1s
  if (res.status === 429 || res.status >= 500) {
    if (retryDelayMs > 0) await sleep(retryDelayMs);
    const retry = await executeSingleFetch(
      endpoint.url,
      cfg.apiKey,
      cfg.model,
      options.messages,
      options.temperature ?? 0.1,
      Boolean(options.jsonMode),
      timeoutMs
    );
    if (retry.res) {
      res = retry.res;
    }
  }

  // Check final response status
  if (res.ok) {
    try {
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        logAiFailure('bad_output', 200, 'Empty content in provider response choices');
        return {
          outcome: 'bad_output',
          status: 200,
          providerName: endpoint.providerName,
        };
      }
      return {
        outcome: 'ok',
        status: 200,
        rawText: content,
        providerName: endpoint.providerName,
      };
    } catch {
      logAiFailure('bad_output', 200, 'Failed to parse JSON response body');
      return {
        outcome: 'bad_output',
        status: 200,
        providerName: endpoint.providerName,
      };
    }
  }

  // Non-OK responses: Extract safe error snippet (up to 200 chars)
  let rawErr = '';
  if (typeof res.text === 'function') {
    rawErr = (await res.text().catch(() => '')).slice(0, 200);
  }
  const safeErr = cfg.apiKey ? rawErr.replaceAll(cfg.apiKey, '[REDACTED]') : rawErr;

  let outcome: AiOutcome;
  if (res.status === 401 || res.status === 403) {
    outcome = 'provider_auth';
  } else if (res.status === 400 || res.status === 404) {
    outcome = 'provider_model';
  } else if (res.status === 429) {
    outcome = 'provider_rate';
  } else {
    outcome = 'provider_error';
  }

  logAiFailure(outcome, res.status, safeErr);

  return {
    outcome,
    status: res.status,
    errorSnippet: safeErr,
    providerName: endpoint.providerName,
  };
}
