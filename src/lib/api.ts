import { GraveyardProjectSummary, OracleAiResponse, RepoAnalysis } from '@/types';

/**
 * Calls our serverless function /api/analyze-repo with the provided repository URL.
 * Maps network or server errors to friendly, human-readable error messages.
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
    throw new Error(
      'Unable to reach the analysis service. If running locally, verify your local dev server or vercel dev is running.'
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('Received an unparseable response from the server.');
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
