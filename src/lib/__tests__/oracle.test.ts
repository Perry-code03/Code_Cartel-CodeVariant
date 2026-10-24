import { describe, it, expect } from 'vitest';
import { queryGraveyardOracle } from '../oracle';
import { getInitialSeedData } from '@/data/seed';

describe('Graveyard Oracle Local Engine', () => {
  const seedData = getInitialSeedData();

  it('answers "help" intent with available query prompts', () => {
    const res = queryGraveyardOracle('help', seedData);
    expect(res.intent).toBe('help');
    expect(res.answer).toContain('Graveyard Oracle');
    expect(res.suggestedFollowUps?.length).toBeGreaterThan(0);
  });

  it('answers "which project should I revive first" with highest-score non-archived candidate', () => {
    const res = queryGraveyardOracle('which project should I revive first?', seedData);
    expect(res.intent).toBe('revive_first');
    // email-worker has score 92 and is resurrecting
    expect(res.answer).toContain('email-worker');
    expect(res.answer).toContain('92');
  });

  it('answers "why did legacy-auth stall" from autopsy records', () => {
    const res = queryGraveyardOracle('why did legacy-auth stall?', seedData);
    expect(res.intent).toBe('project_autopsy');
    expect(res.answer).toContain('BURNOUT');
    expect(res.answer).toContain('Race conditions');
  });

  it('answers "what components can I salvage" with catalog summary', () => {
    const res = queryGraveyardOracle('what can I salvage?', seedData);
    expect(res.intent).toBe('salvage_list');
    expect(res.answer).toContain('jwt-refresh-middleware');
  });

  it('explains score calculation heuristic formula', () => {
    const res = queryGraveyardOracle('how is the score calculated?', seedData);
    expect(res.intent).toBe('score_explanation');
    expect(res.answer).toContain('Completion %');
    expect(res.answer).toContain('Salvageable Components');
    expect(res.answer).toContain('Willingness');
  });

  it('generates a 3-day sprint plan for email-worker', () => {
    const res = queryGraveyardOracle('show me a 3-day plan for email-worker', seedData);
    expect(res.intent).toBe('phoenix_plan');
    expect(res.answer).toContain('Phoenix Sprint');
  });

  it('provides a full necropolis graveyard summary', () => {
    const res = queryGraveyardOracle('give me a summary of my graveyard', seedData);
    expect(res.intent).toBe('summary');
    expect(res.answer).toContain('Total Projects: 4');
  });

  it('handles unknown queries with friendly fallback', () => {
    const res = queryGraveyardOracle('xyz123randomgibberish', seedData);
    expect(res.intent).toBe('fallback');
    expect(res.suggestedFollowUps).toBeDefined();
  });
});
