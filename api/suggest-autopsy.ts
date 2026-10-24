import { AutopsySuggestion } from '../src/types/index.js';
import {
  validateAutopsySuggestion,
  generateLocalAutopsyFallback,
  computeActivityFacts,
  ProjectContextInput,
} from '../src/lib/autopsy-ai.js';
import {
  callAiProvider,
  parseAiJson,
  getAutopsyFailureNotice,
} from '../src/lib/ai-provider.js';

// In-memory rate limiting: best-effort on serverless
const ipRequests = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 15;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequests.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    ipRequests.set(ip, recent);
    return false;
  }
  recent.push(now);
  ipRequests.set(ip, recent);
  return true;
}

export async function POST(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({
        notice: 'Diagnostic request limit reached. Showing repository activity facts.',
        reason: 'rate_limited',
        ...generateLocalAutopsyFallback({ name: 'Project' }),
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Reject payloads over 4 KB
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 4096) {
    return new Response(
      JSON.stringify({ error: 'Payload too large. Maximum size is 4 KB.' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return new Response(JSON.stringify({ error: 'Unable to read request payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (bodyText.length > 4096) {
    return new Response(
      JSON.stringify({ error: 'Payload too large. Maximum size is 4 KB.' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { project?: unknown };
  try {
    body = JSON.parse(bodyText);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body || typeof body.project !== 'object' || body.project === null) {
    return new Response(JSON.stringify({ error: 'Project data is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const projectInput = body.project as Record<string, unknown>;
  const name = typeof projectInput.name === 'string' ? projectInput.name.trim() : '';
  if (!name || name.length > 100) {
    return new Response(
      JSON.stringify({ error: 'Project name is required (max 100 characters).' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const projectData: ProjectContextInput = {
    name,
    description: typeof projectInput.description === 'string' ? projectInput.description.trim().slice(0, 500) : '',
    stack: Array.isArray(projectInput.stack)
      ? projectInput.stack.filter((s): s is string => typeof s === 'string').slice(0, 8)
      : [],
    category: typeof projectInput.category === 'string' ? projectInput.category.trim() : undefined,
    completion: typeof projectInput.completion === 'number' ? projectInput.completion : undefined,
    lastActiveAt: typeof projectInput.lastActiveAt === 'string' ? projectInput.lastActiveAt : undefined,
    createdAt: typeof projectInput.createdAt === 'string' ? projectInput.createdAt : undefined,
    repoUrl: typeof projectInput.repoUrl === 'string' ? projectInput.repoUrl.trim() : undefined,
    readmeExcerpt: typeof projectInput.readmeExcerpt === 'string' ? projectInput.readmeExcerpt.trim().slice(0, 1500) : undefined,
  };

  // Compute activity facts deterministically (plain code, no AI)
  const facts = computeActivityFacts({
    lastPushedAt: projectData.lastActiveAt,
    createdAt: projectData.createdAt,
    description: projectData.description,
    readmeExcerpt: projectData.readmeExcerpt,
  });

  const localFallback = generateLocalAutopsyFallback(projectData);

  const systemPrompt = `You are a strict, evidence-based code analysis assistant.
Given verified repository text excerpts (description, README, and notes), summarize ONLY what is explicitly evidenced in the text.

Rules:
1. "whatWasBuilt": A concise 1-2 sentence summary of features explicitly described as built or implemented in the description or README. If the provided text does not describe what was built, return null.
2. "whatBroke": A concise 1-2 sentence summary of a specific technical bug, obstacle, limitation, or error explicitly cited in the README, issues, or TODO text. If no specific technical bug or blocker is documented in the text, you MUST return null.
3. NEVER guess, assume, or invent reasons why the developer stopped, their personal situation, motivation, willingness, full-time job, or schedule. Any mention of developer feelings, personal situation, or non-technical speculation is strictly forbidden.
4. Every sentence must be directly supported by the provided text.
5. Return strictly a JSON object with keys:
   {
     "whatWasBuilt": string | null,
     "whatBroke": string | null
   }`;

  const userPrompt = `REPOSITORY EVIDENCE:
Name: ${projectData.name}
Category: ${projectData.category || 'Unknown'}
Stack: ${projectData.stack?.join(', ') || 'Unknown'}
Description: ${projectData.description || 'None provided'}
README / Notes Excerpt: ${projectData.readmeExcerpt || 'None provided'}

Extract only claims supported directly by the text above. Return JSON only.`;

  const callResult = await callAiProvider({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.1,
    jsonMode: true,
  });

  if (callResult.outcome !== 'ok' || !callResult.rawText) {
    const { notice, reason } = getAutopsyFailureNotice(callResult.outcome, callResult.missingVars);
    return new Response(
      JSON.stringify({
        ...localFallback,
        activityFacts: facts.allFacts,
        notice,
        reason,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const parsedJson = parseAiJson(callResult.rawText);
  if (!parsedJson) {
    const { notice, reason } = getAutopsyFailureNotice('bad_output');
    return new Response(
      JSON.stringify({
        ...localFallback,
        activityFacts: facts.allFacts,
        notice,
        reason,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const validated = validateAutopsySuggestion(parsedJson, facts.allFacts);
  if (!validated) {
    const { notice, reason } = getAutopsyFailureNotice('bad_output');
    return new Response(
      JSON.stringify({
        ...localFallback,
        activityFacts: facts.allFacts,
        notice,
        reason,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // If validation leaves BOTH whatWasBuilt and whatBroke empty, do not label as AI
  if (!validated.whatWasBuilt && !validated.whatBroke) {
    return new Response(
      JSON.stringify({
        ...localFallback,
        activityFacts: facts.allFacts,
        source: 'facts-only',
        notice: 'The AI found nothing in the repository text to suggest.',
        reason: 'empty_suggestions',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const responsePayload: AutopsySuggestion = {
    ...validated,
    activityFacts: facts.allFacts,
    source: 'ai',
    aiProviderName: callResult.providerName,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
