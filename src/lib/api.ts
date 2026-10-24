import { RepoAnalysis } from '@/types';

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
