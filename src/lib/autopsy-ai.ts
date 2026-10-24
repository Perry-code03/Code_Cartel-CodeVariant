import { AutopsySuggestion, Rating, StopCategory } from '@/types';

const VALID_STOP_CATEGORIES: StopCategory[] = [
  'scope',
  'burnout',
  'priorities',
  'technical',
  'other',
];

/**
 * Validates and sanitizes raw model output for autopsy suggestions.
 * Strictly checks types, character boundaries, and category enums.
 * Never trusts untrusted model input.
 */
export function validateAutopsySuggestion(raw: unknown): AutopsySuggestion | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const obj = raw as Record<string, unknown>;

  const whatBroke = typeof obj.whatBroke === 'string' ? obj.whatBroke.trim() : '';
  const whyStopped = typeof obj.whyStopped === 'string' ? obj.whyStopped.trim() : '';

  if (whatBroke.length < 10 || whatBroke.length > 600) {
    return null;
  }

  if (whyStopped.length < 10 || whyStopped.length > 600) {
    return null;
  }

  let stopCategory: StopCategory = 'other';
  if (
    typeof obj.stopCategory === 'string' &&
    VALID_STOP_CATEGORIES.includes(obj.stopCategory.toLowerCase() as StopCategory)
  ) {
    stopCategory = obj.stopCategory.toLowerCase() as StopCategory;
  }

  let whatWasBuilt: string | undefined = undefined;
  if (typeof obj.whatWasBuilt === 'string' && obj.whatWasBuilt.trim().length >= 10) {
    whatWasBuilt = obj.whatWasBuilt.trim().slice(0, 600);
  }

  const clampRating = (val: unknown): Rating | undefined => {
    const num = typeof val === 'number' ? val : parseInt(String(val), 10);
    if (!isNaN(num) && num >= 1 && num <= 5) {
      return num as Rating;
    }
    return undefined;
  };

  const clampUsefulComps = (val: unknown): number | undefined => {
    const num = typeof val === 'number' ? val : parseInt(String(val), 10);
    if (!isNaN(num) && num >= 0 && num <= 20) {
      return num;
    }
    return undefined;
  };

  return {
    whatBroke,
    whyStopped,
    stopCategory,
    whatWasBuilt,
    scopeClarity: clampRating(obj.scopeClarity),
    blockerSeverity: clampRating(obj.blockerSeverity),
    suggestedUsefulComponents: clampUsefulComps(obj.suggestedUsefulComponents),
    source: 'ai',
  };
}

export interface ProjectContextInput {
  name: string;
  description?: string;
  stack?: string[];
  category?: string;
  completion?: number;
  whatWasBuilt?: string;
}

/**
 * Deterministic rule-based fallback when AI is offline, missing keys, or rate-limited.
 * Synthesizes stack heuristics and completion rates into plausible diagnostic findings.
 */
export function generateLocalAutopsyFallback(project: ProjectContextInput): AutopsySuggestion {
  const stack = (project.stack || []).map((s) => s.toLowerCase());
  const completion = typeof project.completion === 'number' ? project.completion : 50;
  const name = project.name || 'This project';

  const isBackend =
    stack.some((s) => ['node', 'express', 'postgres', 'redis', 'sql', 'fastapi', 'django', 'go'].includes(s)) ||
    project.category === 'API / Backend';

  const isFrontend =
    stack.some((s) => ['react', 'vue', 'svelte', 'tailwind', 'next', 'css'].includes(s)) ||
    project.category === 'Web App' ||
    project.category === 'Mobile App';

  let whatBroke = '';
  let whyStopped = '';
  let stopCategory: StopCategory = 'technical';
  let blockerSeverity: Rating = 3;
  let scopeClarity: Rating = 3;

  if (isBackend) {
    whatBroke = `Encountered persistent integration friction with data persistence and authentication lifecycle edge-cases in ${name}.`;
    whyStopped = `Solo debugging of database schemas, connection pooling, and token refresh races consumed allocated sprint time.`;
    stopCategory = 'technical';
    blockerSeverity = 4;
    scopeClarity = 3;
  } else if (isFrontend) {
    whatBroke = `Component state coordination and styling inconsistencies grew unmanageable as the UI expanded.`;
    whyStopped = `Scope expanded beyond initial prototype designs, leading to fatigue refining responsiveness and edge-case layouts.`;
    stopCategory = 'scope';
    blockerSeverity = 3;
    scopeClarity = 2;
  } else {
    whatBroke = `Core technical requirements diverged from the initial architecture, creating friction advancing key milestones.`;
    whyStopped = `Time and motivation were diverted toward competing deadlines and other higher-priority initiatives.`;
    stopCategory = 'priorities';
    blockerSeverity = 3;
    scopeClarity = 3;
  }

  if (completion >= 75) {
    stopCategory = 'burnout';
    whyStopped = `Near-completion polish, deployment hurdles, and diminishing developer momentum stalled the final push.`;
    blockerSeverity = 2;
  }

  const whatWasBuilt =
    project.whatWasBuilt && project.whatWasBuilt.trim().length >= 10
      ? project.whatWasBuilt.trim()
      : `Core architecture, foundational configurations, and preliminary workflows for ${name}.`;

  return {
    whatWasBuilt,
    whatBroke,
    whyStopped,
    stopCategory,
    blockerSeverity,
    scopeClarity,
    suggestedUsefulComponents: Math.min(Math.max(Math.round(completion / 20), 1), 5),
    source: 'heuristic',
    notice: 'Using deterministic rule-based diagnostic suggestions.',
  };
}
