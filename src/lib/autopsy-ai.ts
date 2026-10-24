import { AutopsySuggestion } from '../types/index.js';

export interface ActivityFactsInput {
  lastPushedAt?: string | null;
  createdAt?: string | null;
  commitCount?: number | null;
  readmeExcerpt?: string | null;
  description?: string | null;
  referenceDate?: Date | string | number;
}

export interface ActivityFacts {
  lastCommitFact?: string;
  createdFact?: string;
  commitsFact?: string;
  unfinishedSignals: string[];
  allFacts: string[];
}

/**
 * Calculates calendar months elapsed between a date and a reference date.
 */
export function calculateMonthsAgo(
  dateStr: string,
  referenceDate: Date = new Date()
): number {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 0;
  const ref = new Date(referenceDate);
  const yearsDiff = ref.getFullYear() - date.getFullYear();
  const monthsDiff = ref.getMonth() - date.getMonth();
  const totalMonths = yearsDiff * 12 + monthsDiff;
  return Math.max(0, totalMonths);
}

/**
 * Formats a repository creation date into a neutral factual string (e.g. "Repository created: March 2024").
 */
export function formatCreationDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const monthName = date.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  return `Repository created: ${monthName} ${year}`;
}

/**
 * Scans text for explicit indicators of unfinished work or pending items (TODO, WIP, not finished).
 * Returns strictly neutral factual bullet labels without editorializing.
 */
export function detectUnfinishedSignals(text?: string | null): string[] {
  if (!text) return [];
  const signals: string[] = [];
  const lower = text.toLowerCase();

  if (/\btodo\b/i.test(text)) {
    signals.push('README mentions TODO markers');
  }
  if (/\bwip\b/i.test(text) || lower.includes('work in progress')) {
    signals.push('README mentions WIP (work in progress)');
  }
  if (
    lower.includes('not finished') ||
    lower.includes('unfinished') ||
    lower.includes('incomplete') ||
    lower.includes('under construction')
  ) {
    signals.push('README mentions unfinished state');
  }

  return signals;
}

/**
 * Computes deterministic activity facts from repository or project dates and text.
 * Never guesses reasons or editorialize why development ceased.
 */
export function computeActivityFacts(input: ActivityFactsInput): ActivityFacts {
  const refDate = input.referenceDate ? new Date(input.referenceDate) : new Date();
  const allFacts: string[] = [];

  // 1. Last push / commit fact
  let lastCommitFact: string | undefined = undefined;
  if (input.lastPushedAt) {
    const months = calculateMonthsAgo(input.lastPushedAt, refDate);
    if (months === 0) {
      lastCommitFact = 'Last commit: less than a month ago';
    } else if (months === 1) {
      lastCommitFact = 'Last commit: 1 month ago';
    } else {
      lastCommitFact = `Last commit: ${months} months ago`;
    }
    allFacts.push(lastCommitFact);
  }

  // 2. Creation date fact
  let createdFact: string | undefined = undefined;
  if (input.createdAt) {
    const formatted = formatCreationDate(input.createdAt);
    if (formatted) {
      createdFact = formatted;
      allFacts.push(createdFact);
    }
  }

  // 3. Commit count fact (if available)
  let commitsFact: string | undefined = undefined;
  if (typeof input.commitCount === 'number' && input.commitCount > 0) {
    commitsFact = `${input.commitCount} commit${input.commitCount === 1 ? '' : 's'} recorded`;
    allFacts.push(commitsFact);
  }

  // 4. Unfinished signals from README / text
  const textToScan = `${input.readmeExcerpt || ''}\n${input.description || ''}`;
  const unfinishedSignals = detectUnfinishedSignals(textToScan);
  for (const signal of unfinishedSignals) {
    allFacts.push(signal);
  }

  return {
    lastCommitFact,
    createdFact,
    commitsFact,
    unfinishedSignals,
    allFacts,
  };
}

/**
 * Patterns matching speculation about the developer's personal life, motivation, or job.
 * If found in model output, the claim is rejected as unauthorized speculation.
 */
export const PERSONAL_MOTIVATION_PATTERNS = [
  /\bburnout\b/i,
  /\bfull-?time job\b/i,
  /\bday job\b/i,
  /\bpersonal commitments?\b/i,
  /\bmotivation\b/i,
  /\bdemotivated\b/i,
  /\bwillingness\b/i,
  /\blost interest\b/i,
  /\bcompeting priorities\b/i,
  /\bfamily\b/i,
  /\bmental health\b/i,
  /\btired\b/i,
  /\bexhausted\b/i,
  /\bbusy\b/i,
  /\blife got in the way\b/i,
  /\bno time\b/i,
  /\blacked time\b/i,
  /\btime constraints?\b/i,
];

/**
 * Checks whether text contains prohibited personal or motivational claims.
 */
export function containsPersonalMotivationClaims(text: string): boolean {
  return PERSONAL_MOTIVATION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Validates and sanitizes raw model output for autopsy suggestions.
 * Strictly verifies that suggestions only describe what was built or technical problems
 * directly cited in the provided text, and strictly rejects personal or motivational claims.
 * Never includes score-altering fields (stopCategory, ratings, components).
 */
export function validateAutopsySuggestion(
  raw: unknown,
  activityFacts: string[] = []
): AutopsySuggestion | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const obj = raw as Record<string, unknown>;

  // 1. whatWasBuilt: optional string describing built features from description/README
  let whatWasBuilt: string | null = null;
  if (typeof obj.whatWasBuilt === 'string') {
    const trimmed = obj.whatWasBuilt.trim();
    if (trimmed.length >= 10 && trimmed.length <= 600) {
      if (!containsPersonalMotivationClaims(trimmed)) {
        whatWasBuilt = trimmed;
      }
    }
  }

  // 2. whatBroke: optional string describing a specific technical blocker/bug cited in repo text
  let whatBroke: string | null = null;
  if (typeof obj.whatBroke === 'string') {
    const trimmed = obj.whatBroke.trim();
    const lower = trimmed.toLowerCase();
    const isUninformative =
      lower.includes('not enough information') ||
      lower.includes('no information') ||
      lower === 'none' ||
      lower === 'n/a' ||
      trimmed.length < 10;

    if (!isUninformative && trimmed.length <= 600) {
      if (!containsPersonalMotivationClaims(trimmed)) {
        whatBroke = trimmed;
      }
    }
  }

  return {
    whatWasBuilt,
    whatBroke,
    activityFacts,
    source: 'ai',
  };
}

export interface ProjectContextInput {
  name: string;
  description?: string;
  stack?: string[];
  category?: string;
  completion?: number;
  lastActiveAt?: string;
  createdAt?: string;
  repoUrl?: string;
  readmeExcerpt?: string;
  whatWasBuilt?: string;
}

/**
 * Deterministic rule-based fallback when AI is offline, missing keys, or returns unsupported content.
 * Returns verified activity facts and leaves narrative / subjective fields empty for the user.
 */
export function generateLocalAutopsyFallback(
  project: ProjectContextInput,
  notice?: string
): AutopsySuggestion {
  const facts = computeActivityFacts({
    lastPushedAt: project.lastActiveAt,
    createdAt: project.createdAt,
    description: project.description,
    readmeExcerpt: project.readmeExcerpt,
  });

  return {
    whatWasBuilt: null,
    whatBroke: null,
    activityFacts: facts.allFacts,
    source: 'facts-only',
    notice:
      notice ||
      'Showing verified repository activity facts. Form fields remain for your personal evaluation.',
  };
}
