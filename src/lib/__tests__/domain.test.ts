import { describe, it, expect } from 'vitest';
import { computeResurrectionScore, getScoreBand } from '../score';
import { recommendRevivalPath, suggestStopCategory } from '../recommend';
import { canTransition, applyPath } from '../status';
import { validateProject } from '../validation';
import { Project } from '@/types';

describe('Resurrection Score Heuristic Formula', () => {
  it('correctly calculates worked Example A: email-worker -> 92', () => {
    const result = computeResurrectionScore({
      completion: 84,
      usefulComponents: 4,
      willingness: 5,
      hoursAvailable: 22,
      scopeClarity: 5,
      blockerSeverity: 1,
    });
    expect(result.score).toBe(92);
    expect(result.band).toBe('high');
    expect(result.factorsAnsweredCount).toBe(6);
  });

  it('correctly calculates worked Example B: payment-core -> 67', () => {
    const result = computeResurrectionScore({
      completion: 58,
      usefulComponents: 4,
      willingness: 4,
      hoursAvailable: 15,
      scopeClarity: 4,
      blockerSeverity: 3,
    });
    expect(result.score).toBe(67);
    expect(result.band).toBe('moderate');
  });

  it('correctly calculates worked Example C: legacy-auth -> 41', () => {
    const result = computeResurrectionScore({
      completion: 32,
      usefulComponents: 3,
      willingness: 2,
      hoursAvailable: 6,
      scopeClarity: 3,
      blockerSeverity: 3,
    });
    expect(result.score).toBe(41);
    expect(result.band).toBe('moderate');
  });

  it('correctly calculates worked Example D: skipped optionals (legacy-auth minus hours & blocker) -> 42', () => {
    const result = computeResurrectionScore({
      completion: 32,
      usefulComponents: 3,
      willingness: 2,
      hoursAvailable: null,
      scopeClarity: 3,
      blockerSeverity: null,
    });
    expect(result.score).toBe(42);
    expect(result.factorsAnsweredCount).toBe(4);
    expect(result.pointsPossible).toBe(70);
  });

  it('correctly calculates worked Example E: campus-pulse -> 36', () => {
    const result = computeResurrectionScore({
      completion: 22,
      usefulComponents: 1,
      willingness: 3,
      hoursAvailable: 8,
      scopeClarity: 2,
      blockerSeverity: 2,
    });
    expect(result.score).toBe(36);
    expect(result.band).toBe('low');
  });

  it('handles worst-case boundary (0 score)', () => {
    const result = computeResurrectionScore({
      completion: 0,
      usefulComponents: 0,
      willingness: 1,
      hoursAvailable: 0,
      scopeClarity: 1,
      blockerSeverity: 5,
    });
    expect(result.score).toBe(0);
    expect(result.band).toBe('low');
  });

  it('handles best-case boundary (100 score)', () => {
    const result = computeResurrectionScore({
      completion: 100,
      usefulComponents: 5,
      willingness: 5,
      hoursAvailable: 24,
      scopeClarity: 5,
      blockerSeverity: 1,
    });
    expect(result.score).toBe(100);
    expect(result.band).toBe('high');
  });

  it('caps hours at 24 so 500 hours equals 24 hours credit', () => {
    const score24 = computeResurrectionScore({
      completion: 50,
      willingness: 3,
      hoursAvailable: 24,
    });
    const score500 = computeResurrectionScore({
      completion: 50,
      willingness: 3,
      hoursAvailable: 500,
    });
    expect(score500.score).toBe(score24.score);
  });

  it('correctly classifies score bands and edge boundaries', () => {
    expect(getScoreBand(39).band).toBe('low');
    expect(getScoreBand(40).band).toBe('moderate');
    expect(getScoreBand(69).band).toBe('moderate');
    expect(getScoreBand(70).band).toBe('high');
  });
});

describe('Path Recommendation Engine', () => {
  it('recommends Phoenix for email-worker conditions', () => {
    const rec = recommendRevivalPath({
      score: 92,
      willingness: 5,
      usefulComponents: 4,
      hoursAvailable: 22,
      scopeClarity: 5,
      blockerSeverity: 1,
      stopCategory: 'scope',
    });
    expect(rec.primary).toBe('phoenix');
    expect(rec.alternatives).toContain('salvage');
  });

  it('recommends Phoenix for payment-core conditions', () => {
    const rec = recommendRevivalPath({
      score: 67,
      willingness: 4,
      usefulComponents: 4,
      hoursAvailable: 15,
      scopeClarity: 4,
      blockerSeverity: 3,
      stopCategory: 'priorities',
    });
    expect(rec.primary).toBe('phoenix');
  });

  it('recommends Salvage for legacy-auth conditions (score < 60 but has 3 components)', () => {
    const rec = recommendRevivalPath({
      score: 41,
      willingness: 2,
      usefulComponents: 3,
      hoursAvailable: 6,
      scopeClarity: 3,
      blockerSeverity: 3,
      stopCategory: 'burnout',
    });
    expect(rec.primary).toBe('salvage');
  });

  it('recommends Pivot for campus-pulse (willingness >= 3 and shifting priorities)', () => {
    const rec = recommendRevivalPath({
      score: 36,
      willingness: 3,
      usefulComponents: 1,
      hoursAvailable: 8,
      scopeClarity: 2,
      blockerSeverity: 2,
      stopCategory: 'priorities',
    });
    expect(rec.primary).toBe('pivot');
  });

  it('detects keywords for stop category suggestion', () => {
    expect(suggestStopCategory('Had way too many features added').category).toBe('scope');
    expect(suggestStopCategory('Got total burnout and no time').category).toBe('burnout');
    expect(suggestStopCategory('Day job took over and new idea surfaced').category).toBe('priorities');
    expect(suggestStopCategory('A critical dependency broken and bug crashed').category).toBe('technical');
    expect(suggestStopCategory('Random unspecified cause').category).toBe('other');
  });
});

describe('Status Machine Transitions', () => {
  it('allows legal transitions', () => {
    expect(canTransition('deceased', 'resurrecting')).toBe(true);
    expect(canTransition('deceased', 'salvaged')).toBe(true);
    expect(canTransition('deceased', 'in_stasis')).toBe(true);
    expect(canTransition('resurrecting', 'deceased')).toBe(true);
    expect(canTransition('in_stasis', 'resurrecting')).toBe(true);
  });

  it('blocks salvage path if project has 0 components', () => {
    const stubProject: Project = {
      id: 'stub-1',
      name: 'stub',
      description: 'stub',
      stack: ['React'],
      category: 'Web App',
      completion: 50,
      status: 'deceased',
      lastActiveAt: '2026-01-01',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    const attemptWithoutComps = applyPath(stubProject, 'salvage', 0);
    expect(attemptWithoutComps.allowed).toBe(false);
    expect(attemptWithoutComps.newStatus).toBe('deceased');

    const attemptWithComps = applyPath(stubProject, 'salvage', 2);
    expect(attemptWithComps.allowed).toBe(true);
    expect(attemptWithComps.newStatus).toBe('salvaged');
  });
});

describe('Domain Validation Rules', () => {
  it('validates project fields correctly', () => {
    const invalid = validateProject({
      name: 'a', // too short
      description: '',
      stack: [],
      category: 'NotACategory',
      completion: 150,
      lastActiveAt: '2099-01-01', // future
    });
    expect(invalid.name).toBeDefined();
    expect(invalid.description).toBeDefined();
    expect(invalid.stack).toBeDefined();
    expect(invalid.category).toBeDefined();
    expect(invalid.completion).toBeDefined();
    expect(invalid.lastActiveAt).toBeDefined();

    const valid = validateProject({
      name: 'my-project',
      description: 'A valid description',
      stack: ['React', 'TypeScript'],
      category: 'Web App',
      completion: 75,
      lastActiveAt: '2026-01-01',
    });
    expect(Object.keys(valid).length).toBe(0);
  });

  it('rejects duplicate project names case-insensitively', () => {
    const errors = validateProject(
      {
        name: 'Legacy-Auth',
        description: 'valid',
        stack: ['Node'],
        category: 'API / Backend',
        completion: 30,
        lastActiveAt: '2026-01-01',
      },
      ['legacy-auth']
    );
    expect(errors.name).toContain('already rests in the graveyard');
  });
});
