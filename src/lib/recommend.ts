import { PathId, StopCategory, Rating } from '@/types';

export interface RecommendationInputs {
  score: number;
  willingness: Rating;
  stopCategory?: StopCategory;
  usefulComponents?: number | null;
  hoursAvailable?: number | null;
  scopeClarity?: Rating | null;
  blockerSeverity?: Rating | null;
}

export interface RecommendationResult {
  primary: PathId;
  alternatives: PathId[];
  reason: string;
}

export function recommendRevivalPath(inputs: RecommendationInputs): RecommendationResult {
  const {
    score,
    willingness,
    stopCategory,
    usefulComponents = 0,
    hoursAvailable,
    scopeClarity,
    blockerSeverity,
  } = inputs;

  const comps = usefulComponents ?? 0;

  // 1. Phoenix Protocol: score >= 60, willingness >= 3, hours >= 12 (if given), blocker <= 3 (if given)
  const hoursOk = hoursAvailable === undefined || hoursAvailable === null || hoursAvailable >= 12;
  const blockerOk = blockerSeverity === undefined || blockerSeverity === null || blockerSeverity <= 3;
  const phoenixMatches = score >= 60 && willingness >= 3 && hoursOk && blockerOk;

  // 2. Pivot Path: willingness >= 3 AND (stopCategory == priorities OR scopeClarity <= 2)
  // (If scopeClarity is undefined, scopeClarity <= 2 is false)
  const lowScope = scopeClarity !== undefined && scopeClarity !== null && scopeClarity <= 2;
  const pivotMatches = willingness >= 3 && (stopCategory === 'priorities' || lowScope);

  // 3. Salvage Yard: usefulComponents >= 1
  const salvageMatches = comps >= 1;

  // 4. Peaceful Archive: (willingness <= 2 AND usefulComponents == 0) OR score < 25
  const archiveMatches = (willingness <= 2 && comps === 0) || score < 25;

  const matches: PathId[] = [];
  if (phoenixMatches) matches.push('phoenix');
  if (pivotMatches) matches.push('pivot');
  if (salvageMatches) matches.push('salvage');
  if (archiveMatches) matches.push('archive');

  let primary: PathId;
  let reason: string;

  if (matches.length > 0) {
    primary = matches[0];
  } else {
    // Fallback: Salvage if components exist, else Archive
    primary = comps > 0 ? 'salvage' : 'archive';
  }

  const alternatives = (['phoenix', 'pivot', 'salvage', 'archive'] as PathId[]).filter(
    (p) => p !== primary && matches.includes(p)
  );

  // Add remaining paths to alternatives if list is sparse so user always has options
  if (alternatives.length === 0) {
    const defaultAlt = primary === 'archive' ? (comps > 0 ? 'salvage' : 'pivot') : 'archive';
    alternatives.push(defaultAlt as PathId);
  }

  switch (primary) {
    case 'phoenix':
      reason = `High score (${score}) and strong willingness (${willingness}/5) indicate prime conditions for a focused 3-day revival sprint.`;
      break;
    case 'pivot':
      reason = `Strong user motivation (${willingness}/5) but shifting priorities or unclear scope suggest repositioning the concept.`;
      break;
    case 'salvage':
      reason = `Project contains ${comps} valuable reusable component${comps > 1 ? 's' : ''} ready to harvest for other active builds.`;
      break;
    case 'archive':
      reason = `Low momentum or low score (${score}) makes graceful retirement the most peaceful path forward.`;
      break;
  }

  return {
    primary,
    alternatives,
    reason,
  };
}

export function suggestStopCategory(text: string): { category: StopCategory; matchedKeyword?: string } {
  const lower = text.toLowerCase();

  const rules: { keywords: string[]; category: StopCategory }[] = [
    {
      keywords: ['too many features', 'scope creep', 'overcomplicated', 'feature creep', 'rabbit hole', 'too complex', 'bloat'],
      category: 'scope',
    },
    {
      keywords: ['burnout', 'no time', 'tired', 'exhausted', 'overwhelmed', 'lost motivation', 'drained', 'fatigue'],
      category: 'burnout',
    },
    {
      keywords: ['new idea', 'priorities', 'day job', 'work took over', 'pivot', 'other project', 'distracted', 'started another'],
      category: 'priorities',
    },
    {
      keywords: ['bug', 'broken', 'technical', 'library died', 'api changed', 'dependency', 'performance', 'blocker', 'crash', 'error'],
      category: 'technical',
    },
  ];

  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        return { category: rule.category, matchedKeyword: kw };
      }
    }
  }

  return { category: 'other' };
}
