import { Rating } from '@/types';

export const SCORE_MODEL_VERSION = 1;

export interface ScoreInputs {
  completion: number;
  willingness: Rating;
  usefulComponents?: number | null;
  hoursAvailable?: number | null;
  scopeClarity?: Rating | null;
  blockerSeverity?: Rating | null;
}

export interface FactorBreakdown {
  id: string;
  name: string;
  description: string;
  answered: boolean;
  weight: number;
  rawValue?: number | string;
  normalized?: number;
  pointsEarned: number;
  pointsPossible: number;
}

export type ScoreBand = 'low' | 'moderate' | 'high';

export interface ScoreResult {
  score: number;
  band: ScoreBand;
  bandLabel: string;
  pointsEarned: number;
  pointsPossible: number;
  factorsAnsweredCount: number;
  totalFactorsCount: number;
  breakdown: FactorBreakdown[];
}

export function getScoreBand(score: number): { band: ScoreBand; label: string } {
  if (score < 40) return { band: 'low', label: 'Low Revival Potential' };
  if (score < 70) return { band: 'moderate', label: 'Moderate Revival Potential' };
  return { band: 'high', label: 'High Revival Potential' };
}

export function computeResurrectionScore(inputs: ScoreInputs): ScoreResult {
  // Defensive normalization and clamps
  const rawComp = Number(inputs.completion);
  const completion = isNaN(rawComp) ? 0 : Math.max(0, Math.min(100, rawComp));

  const rawWill = Number(inputs.willingness);
  const willingness = isNaN(rawWill) ? 1 : Math.max(1, Math.min(5, Math.round(rawWill))) as Rating;

  const breakdown: FactorBreakdown[] = [];

  // Factor 1: Completion % (Required, weight 20)
  const normComp = completion / 100;
  breakdown.push({
    id: 'completion',
    name: 'Completion %',
    description: 'More already built means less work remaining to ship',
    answered: true,
    weight: 20,
    rawValue: `${completion}%`,
    normalized: normComp,
    pointsEarned: 20 * normComp,
    pointsPossible: 20,
  });

  // Factor 2: Reusable components (Optional, weight 20)
  const hasComps = inputs.usefulComponents !== undefined && inputs.usefulComponents !== null && !isNaN(Number(inputs.usefulComponents));
  if (hasComps) {
    const clampedComps = Math.max(0, Math.min(50, Number(inputs.usefulComponents)));
    const normComps = Math.min(clampedComps, 5) / 5;
    breakdown.push({
      id: 'usefulComponents',
      name: 'Salvageable Components',
      description: 'Valuable parts remaining (capped at 5 for score credit)',
      answered: true,
      weight: 20,
      rawValue: clampedComps,
      normalized: normComps,
      pointsEarned: 20 * normComps,
      pointsPossible: 20,
    });
  } else {
    breakdown.push({
      id: 'usefulComponents',
      name: 'Salvageable Components',
      description: 'Valuable parts remaining',
      answered: false,
      weight: 20,
      pointsEarned: 0,
      pointsPossible: 0,
    });
  }

  // Factor 3: Willingness (Required, weight 15)
  const normWill = (willingness - 1) / 4;
  breakdown.push({
    id: 'willingness',
    name: 'Willingness to Continue',
    description: 'Personal motivation and energy to finish the project',
    answered: true,
    weight: 15,
    rawValue: `${willingness} / 5`,
    normalized: normWill,
    pointsEarned: 15 * normWill,
    pointsPossible: 15,
  });

  // Factor 4: Hours available (Optional, weight 15)
  const hasHours = inputs.hoursAvailable !== undefined && inputs.hoursAvailable !== null && !isNaN(Number(inputs.hoursAvailable));
  if (hasHours) {
    const clampedHours = Math.max(0, Math.min(500, Number(inputs.hoursAvailable)));
    const normHours = Math.min(clampedHours, 24) / 24;
    breakdown.push({
      id: 'hoursAvailable',
      name: 'Hours Available',
      description: 'Available sprint hours (capped at 24h = 3-day MVP sprint)',
      answered: true,
      weight: 15,
      rawValue: `${clampedHours} hrs`,
      normalized: normHours,
      pointsEarned: 15 * normHours,
      pointsPossible: 15,
    });
  } else {
    breakdown.push({
      id: 'hoursAvailable',
      name: 'Hours Available',
      description: 'Available sprint hours',
      answered: false,
      weight: 15,
      pointsEarned: 0,
      pointsPossible: 0,
    });
  }

  // Factor 5: Scope clarity (Optional, weight 15)
  const hasScope = inputs.scopeClarity !== undefined && inputs.scopeClarity !== null && !isNaN(Number(inputs.scopeClarity));
  if (hasScope) {
    const clampedScope = Math.max(1, Math.min(5, Math.round(Number(inputs.scopeClarity)))) as Rating;
    const normScope = (clampedScope - 1) / 4;
    breakdown.push({
      id: 'scopeClarity',
      name: 'Scope Clarity',
      description: 'Clear definition of minimum viable features',
      answered: true,
      weight: 15,
      rawValue: `${clampedScope} / 5`,
      normalized: normScope,
      pointsEarned: 15 * normScope,
      pointsPossible: 15,
    });
  } else {
    breakdown.push({
      id: 'scopeClarity',
      name: 'Scope Clarity',
      description: 'Scope clarity',
      answered: false,
      weight: 15,
      pointsEarned: 0,
      pointsPossible: 0,
    });
  }

  // Factor 6: Blocker severity (Optional, weight 15 - inverse)
  const hasBlocker = inputs.blockerSeverity !== undefined && inputs.blockerSeverity !== null && !isNaN(Number(inputs.blockerSeverity));
  if (hasBlocker) {
    const clampedBlocker = Math.max(1, Math.min(5, Math.round(Number(inputs.blockerSeverity)))) as Rating;
    const normBlocker = 1 - (clampedBlocker - 1) / 4;
    breakdown.push({
      id: 'blockerSeverity',
      name: 'Blocker Severity (Inverse)',
      description: 'Absence of deep architectural or platform blockers',
      answered: true,
      weight: 15,
      rawValue: `${clampedBlocker} / 5`,
      normalized: normBlocker,
      pointsEarned: 15 * normBlocker,
      pointsPossible: 15,
    });
  } else {
    breakdown.push({
      id: 'blockerSeverity',
      name: 'Blocker Severity',
      description: 'Technical blocker severity',
      answered: false,
      weight: 15,
      pointsEarned: 0,
      pointsPossible: 0,
    });
  }

  const answeredFactors = breakdown.filter((f) => f.answered);
  const totalEarned = answeredFactors.reduce((sum, f) => sum + f.pointsEarned, 0);
  const totalPossible = answeredFactors.reduce((sum, f) => sum + f.pointsPossible, 0);

  const rawScore = totalPossible > 0 ? (100 * totalEarned) / totalPossible : 0;
  const clampedScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  const { band, label } = getScoreBand(clampedScore);

  return {
    score: clampedScore,
    band,
    bandLabel: label,
    pointsEarned: Math.round(totalEarned * 100) / 100,
    pointsPossible: totalPossible,
    factorsAnsweredCount: answeredFactors.length,
    totalFactorsCount: 6,
    breakdown,
  };
}
