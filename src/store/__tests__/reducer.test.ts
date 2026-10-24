import { describe, it, expect } from 'vitest';
import { graveyardReducer } from '../reducer';
import { getInitialSeedData } from '@/data/seed';

describe('Graveyard State Reducer', () => {
  const initial = getInitialSeedData();

  it('adds a project with status deceased and logs a project_created event', () => {
    const next = graveyardReducer(initial, {
      type: 'ADD_PROJECT',
      payload: {
        name: 'test-project',
        description: 'testing project addition',
        stack: ['React', 'Vite'],
        category: 'Web App',
        completion: 45,
        lastActiveAt: '2026-01-01',
      },
    });

    expect(next.projects.length).toBe(initial.projects.length + 1);
    const added = next.projects[0];
    expect(added.name).toBe('test-project');
    expect(added.status).toBe('deceased');
    expect(next.events[0].kind).toBe('project_created');
    expect(next.events[0].projectId).toBe(added.id);
  });

  it('toggles pin state on a project', () => {
    const targetId = initial.projects[0].id;
    const initialPinned = !!initial.projects[0].pinned;

    const toggled = graveyardReducer(initial, {
      type: 'TOGGLE_PIN',
      payload: { id: targetId },
    });

    const target = toggled.projects.find((p) => p.id === targetId);
    expect(target?.pinned).toBe(!initialPinned);
  });

  it('computes score and creates autopsy_completed event on SAVE_AUTOPSY', () => {
    const targetId = 'seed-legacy-auth';
    const next = graveyardReducer(initial, {
      type: 'SAVE_AUTOPSY',
      payload: {
        projectId: targetId,
        autopsyData: {
          whatWasBuilt: 'Rebuilt auth layer with cookies',
          whatBroke: 'Nothing broke',
          whyStopped: 'Ran out of motivation',
          stopCategory: 'burnout',
          willingness: 5,
          usefulComponents: 4,
          hoursAvailable: 20,
          scopeClarity: 5,
          blockerSeverity: 1,
        },
      },
    });

    const project = next.projects.find((p) => p.id === targetId);
    expect(project?.autopsy?.score).toBe(80);
    expect(next.events[0].kind).toBe('autopsy_completed');
    expect(next.events[0].meta?.score).toBe(project?.autopsy?.score);
  });

  it('transitions status and logs events when SELECT_PATH is dispatched', () => {
    // email-worker selecting phoenix
    const next = graveyardReducer(initial, {
      type: 'SELECT_PATH',
      payload: {
        projectId: 'seed-email-worker',
        plan: {
          path: 'phoenix',
          notes: 'Moving forward',
        },
      },
    });

    const project = next.projects.find((p) => p.id === 'seed-email-worker');
    expect(project?.status).toBe('resurrecting');
    expect(next.events.some((e) => e.kind === 'path_selected')).toBe(true);
  });

  it('preserves user projects when restoring demo data', () => {
    // First add a user project
    const withUser = graveyardReducer(initial, {
      type: 'ADD_PROJECT',
      payload: {
        name: 'user-unique-app',
        description: 'my personal side project',
        stack: ['Rust'],
        category: 'CLI Tool',
        completion: 90,
        lastActiveAt: '2026-05-01',
      },
    });

    // Restore demo data
    const restored = graveyardReducer(withUser, {
      type: 'RESTORE_DEMO',
      payload: { resetAll: false },
    });

    expect(restored.projects.some((p) => p.name === 'user-unique-app')).toBe(true);
    expect(restored.projects.some((p) => p.id === 'seed-legacy-auth')).toBe(true);
  });
});
