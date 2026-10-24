import { AutopsySuggestion, GraveyardProjectSummary, OracleAiResponse, RepoAnalysis } from '@/types';
import { generateLocalAutopsyFallback, ProjectContextInput } from '@/lib/autopsy-ai';
import { generateLocalRepoFallback } from '@/lib/github';

/**
 * Calls our serverless function /api/analyze-repo with the provided repository URL.
 * Maps network or server errors to friendly, human-readable error messages.
 * Gracefully falls back locally when backend is unreachable or on a static host.
 */
export async function analyzeRepo(url: string): Promise<RepoAnalysis> {
  let response: Response;
  try {
    response = await fetch('/api/analyze-repo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
  } catch {
    return generateLocalRepoFallback(
      url,
      'Unable to reach backend service. Extracted repository name from URL.'
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return generateLocalRepoFallback(
      url,
      response.status === 404
        ? 'Backend analysis service (/api/analyze-repo) was not found (404). If hosted on GitHub Pages, serverless functions are not supported—deploy on Vercel or enter project details manually.'
        : 'Received an unparseable response from the server. Using local repository details from URL.'
    );
  }

  if (!response.ok) {
    const errorObj = data as { error?: string };
    const message =
      errorObj?.error ||
      `Analysis failed with status ${response.status} (${response.statusText || 'Error'}).`;
    throw new Error(message);
  }

  return data as RepoAnalysis;
}

/**
 * Calls our serverless function /api/oracle-chat with the developer query and project context.
 * Returns either the AI-enhanced response or a clean fallback notification.
 */
export async function chatWithOracle(
  message: string,
  graveyardContext: GraveyardProjectSummary[]
): Promise<OracleAiResponse> {
  let response: Response;
  try {
    response = await fetch('/api/oracle-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, graveyardContext }),
    });
  } catch {
    return {
      fallback: true,
      notice: 'Unable to reach the Oracle backend service. Showing local guidance.',
      source: 'local',
    };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return {
      fallback: true,
      notice: 'Received an unparseable response from the server. Showing local guidance.',
      source: 'local',
    };
  }

  if (!response.ok) {
    const errorObj = data as { error?: string; notice?: string };
    const notice =
      errorObj?.notice ||
      errorObj?.error ||
      `Oracle request failed with status ${response.status}. Showing local guidance.`;
    return {
      fallback: true,
      notice,
      source: 'local',
    };
  }

  return data as OracleAiResponse;
}

/**
 * Calls our serverless function /api/suggest-autopsy with the project metadata.
 * Returns either the AI-enhanced suggestion or a deterministic heuristic fallback.
 */
export async function suggestAutopsy(
  project: ProjectContextInput
): Promise<AutopsySuggestion> {
  let response: Response;
  try {
    response = await fetch('/api/suggest-autopsy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ project }),
    });
  } catch {
    return generateLocalAutopsyFallback(project);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return generateLocalAutopsyFallback(project);
  }

  if (!response.ok) {
    const errorObj = data as { error?: string; notice?: string };
    const fallback = generateLocalAutopsyFallback(project);
    return {
      ...fallback,
      notice:
        errorObj?.notice ||
        errorObj?.error ||
        'Diagnostic request failed. Showing rule-based suggestions.',
    };
  }

  return data as AutopsySuggestion;
}
