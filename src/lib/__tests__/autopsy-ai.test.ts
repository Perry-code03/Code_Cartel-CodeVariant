import { describe, it, expect } from 'vitest';
import { validateAutopsySuggestion, generateLocalAutopsyFallback } from '../autopsy-ai';

describe('validateAutopsySuggestion', () => {
  it('validates a complete and well-formed model output', () => {
    const raw = {
      whatBroke: 'Race condition occurred during token refresh under concurrent requests.',
      whyStopped: 'Solo developer burnout while debugging distributed lock synchronization.',
      stopCategory: 'burnout',
      whatWasBuilt: 'Express server with Redis session store and user routes.',
      blockerSeverity: 4,
      scopeClarity: 3,
      suggestedUsefulComponents: 3,
    };

    const result = validateAutopsySuggestion(raw);
    expect(result).not.toBeNull();
    expect(result?.whatBroke).toBe(raw.whatBroke);
    expect(result?.whyStopped).toBe(raw.whyStopped);
    expect(result?.stopCategory).toBe('burnout');
    expect(result?.blockerSeverity).toBe(4);
    expect(result?.scopeClarity).toBe(3);
    expect(result?.suggestedUsefulComponents).toBe(3);
    expect(result?.source).toBe('ai');
  });

  it('rejects output missing whatBroke or whyStopped', () => {
    expect(validateAutopsySuggestion({ whatBroke: 'Too short' })).toBeNull();
    expect(validateAutopsySuggestion({ whyStopped: 'Short' })).toBeNull();
    expect(validateAutopsySuggestion(null)).toBeNull();
    expect(validateAutopsySuggestion('invalid string')).toBeNull();
  });

  it('rejects text shorter than 10 characters or exceeding length boundaries', () => {
    const rawTooShort = {
      whatBroke: 'Broken',
      whyStopped: 'No time',
    };
    expect(validateAutopsySuggestion(rawTooShort)).toBeNull();

    const rawTooLong = {
      whatBroke: 'x'.repeat(601),
      whyStopped: 'Valid why stopped reason with enough characters',
    };
    expect(validateAutopsySuggestion(rawTooLong)).toBeNull();
  });

  it('defaults invalid stopCategory to other and clamps ratings', () => {
    const raw = {
      whatBroke: 'Database connection pooling failed intermittently.',
      whyStopped: 'Shifted focus to client work with closer deadlines.',
      stopCategory: 'unknown_alien_reason',
      blockerSeverity: 99, // out of range
      scopeClarity: 5,
      suggestedUsefulComponents: 50, // out of range
    };

    const result = validateAutopsySuggestion(raw);
    expect(result).not.toBeNull();
    expect(result?.stopCategory).toBe('other');
    expect(result?.blockerSeverity).toBeUndefined(); // clamped away
    expect(result?.scopeClarity).toBe(5);
    expect(result?.suggestedUsefulComponents).toBeUndefined();
  });
});

describe('generateLocalAutopsyFallback', () => {
  it('generates technical friction fallback for backend stack', () => {
    const fallback = generateLocalAutopsyFallback({
      name: 'auth-service',
      stack: ['Node.js', 'PostgreSQL', 'Redis'],
      category: 'API / Backend',
      completion: 40,
    });

    expect(fallback.source).toBe('heuristic');
    expect(fallback.stopCategory).toBe('technical');
    expect(fallback.whatBroke).toContain('auth-service');
    expect(fallback.whyStopped.length).toBeGreaterThan(10);
  });

  it('generates scope creep fallback for frontend UI stack', () => {
    const fallback = generateLocalAutopsyFallback({
      name: 'design-system',
      stack: ['React', 'Tailwind CSS'],
      category: 'Web App',
      completion: 30,
    });

    expect(fallback.source).toBe('heuristic');
    expect(fallback.stopCategory).toBe('scope');
  });

  it('generates burnout fallback for high completion projects', () => {
    const fallback = generateLocalAutopsyFallback({
      name: 'final-stretch-app',
      completion: 85,
    });

    expect(fallback.source).toBe('heuristic');
    expect(fallback.stopCategory).toBe('burnout');
  });
});
