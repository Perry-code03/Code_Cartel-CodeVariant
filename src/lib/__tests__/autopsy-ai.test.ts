import { describe, it, expect } from 'vitest';
import {
  computeActivityFacts,
  calculateMonthsAgo,
  formatCreationDate,
  detectUnfinishedSignals,
  validateAutopsySuggestion,
  generateLocalAutopsyFallback,
  containsPersonalMotivationClaims,
} from '../autopsy-ai';

describe('computeActivityFacts - plain code GitHub & project data facts', () => {
  const referenceDate = new Date('2026-10-24T12:00:00Z');

  it('calculates months since last commit accurately without editorializing', () => {
    // 14 months before Oct 2026 is Aug 2024
    const lastPushed = '2025-08-24T10:00:00Z';
    const months = calculateMonthsAgo(lastPushed, referenceDate);
    expect(months).toBe(14);

    const facts = computeActivityFacts({
      lastPushedAt: lastPushed,
      referenceDate,
    });
    expect(facts.lastCommitFact).toBe('Last commit: 14 months ago');
    expect(facts.allFacts).toContain('Last commit: 14 months ago');
    // Ensure no editorializing about why it died
    expect(facts.allFacts.some((f) => f.includes('why it died'))).toBe(false);
  });

  it('formats repository creation date cleanly', () => {
    const formatted = formatCreationDate('2024-03-15T08:00:00Z');
    expect(formatted).toBe('Repository created: March 2024');

    const facts = computeActivityFacts({
      createdAt: '2024-03-15T08:00:00Z',
      referenceDate,
    });
    expect(facts.createdFact).toBe('Repository created: March 2024');
    expect(facts.allFacts).toContain('Repository created: March 2024');
  });

  it('formats commit count when available', () => {
    const facts = computeActivityFacts({
      commitCount: 42,
      referenceDate,
    });
    expect(facts.commitsFact).toBe('42 commits recorded');
    expect(facts.allFacts).toContain('42 commits recorded');
  });

  it('detects TODO, WIP, and unfinished signals in README or text', () => {
    const readme = `
      # Cool API
      Under construction. Work in progress.
      ## TODO
      - Fix memory leak in auth worker
      - Not finished with stripe webhook handling
    `;
    const signals = detectUnfinishedSignals(readme);
    expect(signals).toContain('README mentions TODO markers');
    expect(signals).toContain('README mentions WIP (work in progress)');
    expect(signals).toContain('README mentions unfinished state');

    const facts = computeActivityFacts({
      readmeExcerpt: readme,
      referenceDate,
    });
    expect(facts.unfinishedSignals.length).toBeGreaterThanOrEqual(2);
  });
});

describe('containsPersonalMotivationClaims', () => {
  it('detects forbidden personal, burnout, or job-related claims', () => {
    expect(containsPersonalMotivationClaims("The developer experienced burnout after work")).toBe(true);
    expect(containsPersonalMotivationClaims("Primary developer's full-time job took priority")).toBe(true);
    expect(containsPersonalMotivationClaims("Personal commitments drained available time")).toBe(true);
    expect(containsPersonalMotivationClaims("Lost motivation and willingness to continue")).toBe(true);
    expect(containsPersonalMotivationClaims("Family obligations took over")).toBe(true);
    expect(containsPersonalMotivationClaims("Tired and exhausted by deadlines")).toBe(true);
  });

  it('allows purely technical and factual descriptions', () => {
    expect(containsPersonalMotivationClaims("Race condition occurred during token refresh rotation.")).toBe(false);
    expect(containsPersonalMotivationClaims("Database schema migration broke foreign key constraints.")).toBe(false);
    expect(containsPersonalMotivationClaims("Built Express REST API with PostgreSQL connection pooling.")).toBe(false);
  });
});

describe('validateAutopsySuggestion', () => {
  it('accepts evidence-based whatWasBuilt and whatBroke from technical text', () => {
    const raw = {
      whatWasBuilt: 'Express boilerplate with bcrypt password hashing and token issue endpoints.',
      whatBroke: 'Race condition during simultaneous token refresh requests caused 401 errors.',
    };

    const result = validateAutopsySuggestion(raw, ['Last commit: 14 months ago']);
    expect(result).not.toBeNull();
    expect(result?.whatWasBuilt).toBe(raw.whatWasBuilt);
    expect(result?.whatBroke).toBe(raw.whatBroke);
    expect(result?.activityFacts).toEqual(['Last commit: 14 months ago']);
    expect(result?.source).toBe('ai');
  });

  it('rejects personal or motivational claims and sets them to null', () => {
    const raw = {
      whatWasBuilt: 'Web app built for scheduling.',
      whatBroke: 'Developer suffered burnout and full-time job deadlines caused them to lose motivation.',
    };

    const result = validateAutopsySuggestion(raw);
    expect(result).not.toBeNull();
    // whatBroke contained burnout/job claims, so it must be stripped
    expect(result?.whatBroke).toBeNull();
    expect(result?.whatWasBuilt).toBe('Web app built for scheduling.');
  });

  it('returns null for whatBroke when text indicates uninformative or not enough info', () => {
    const raw = {
      whatWasBuilt: 'CLI utility with commander.',
      whatBroke: 'Not enough information in the repo',
    };

    const result = validateAutopsySuggestion(raw);
    expect(result?.whatBroke).toBeNull();
  });

  it('NEVER outputs score fields (stopCategory, blockerSeverity, scopeClarity, usefulComponents)', () => {
    const raw = {
      whatWasBuilt: 'Standard scaffolding and auth routes.',
      whatBroke: 'CORS configuration errors in production gateway.',
      // Malicious or accidental model output containing score-altering fields:
      stopCategory: 'burnout',
      blockerSeverity: 5,
      scopeClarity: 1,
      suggestedUsefulComponents: 4,
      whyStopped: 'Personal burnout',
    };

    const result = validateAutopsySuggestion(raw) as unknown as Record<string, unknown>;
    expect(result).not.toBeNull();
    expect(result.stopCategory).toBeUndefined();
    expect(result.blockerSeverity).toBeUndefined();
    expect(result.scopeClarity).toBeUndefined();
    expect(result.suggestedUsefulComponents).toBeUndefined();
    expect(result.whyStopped).toBeUndefined();
  });
});

describe('generateLocalAutopsyFallback', () => {
  it('returns verified activity facts and leaves narrative fields empty', () => {
    const fallback = generateLocalAutopsyFallback({
      name: 'email-worker',
      lastActiveAt: '2025-08-24T10:00:00Z',
      createdAt: '2024-03-15T08:00:00Z',
      description: 'Background email processor with Redis queue',
    });

    expect(fallback.source).toBe('facts-only');
    expect(fallback.whatWasBuilt).toBeNull();
    expect(fallback.whatBroke).toBeNull();
    expect(fallback.activityFacts.length).toBeGreaterThanOrEqual(1);
    expect((fallback as unknown as Record<string, unknown>).stopCategory).toBeUndefined();
    expect((fallback as unknown as Record<string, unknown>).whyStopped).toBeUndefined();
  });
});
