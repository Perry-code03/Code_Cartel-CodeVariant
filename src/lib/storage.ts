import { AppData, Project } from '@/types';
import { getInitialSeedData } from '@/data/seed';
import { computeResurrectionScore, SCORE_MODEL_VERSION } from './score';

export const STORAGE_KEY = 'graveyard:data';

export interface StorageLoadResult {
  data: AppData;
  isCorrupt: boolean;
  isNewlySeeded: boolean;
  recomputedCount: number;
}

export function isValidAppData(val: unknown): val is AppData {
  if (!val || typeof val !== 'object') return false;
  const candidate = val as Partial<AppData>;
  return (
    candidate.schemaVersion === 1 &&
    Array.isArray(candidate.projects) &&
    Array.isArray(candidate.components) &&
    Array.isArray(candidate.events)
  );
}

export function recomputeStaleScores(projects: Project[]): { projects: Project[]; count: number } {
  let count = 0;
  const updated = projects.map((p) => {
    if (p.autopsy && (p.autopsy.scoreModelVersion || 0) < SCORE_MODEL_VERSION) {
      count++;
      const res = computeResurrectionScore({
        completion: p.completion,
        willingness: p.autopsy.willingness,
        usefulComponents: p.autopsy.usefulComponents,
        hoursAvailable: p.autopsy.hoursAvailable,
        scopeClarity: p.autopsy.scopeClarity,
        blockerSeverity: p.autopsy.blockerSeverity,
      });
      return {
        ...p,
        autopsy: {
          ...p.autopsy,
          score: res.score,
          scoreModelVersion: SCORE_MODEL_VERSION,
        },
      };
    }
    return p;
  });
  return { projects: updated, count };
}

export function loadGraveyardData(): StorageLoadResult {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      data: getInitialSeedData(),
      isCorrupt: false,
      isNewlySeeded: true,
      recomputedCount: 0,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSeedData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return {
        data: initial,
        isCorrupt: false,
        isNewlySeeded: true,
        recomputedCount: 0,
      };
    }

    const parsed = JSON.parse(raw);
    if (!isValidAppData(parsed)) {
      // Backup corrupted data for recovery
      const corruptKey = `graveyard:data:corrupt-${Date.now()}`;
      try {
        window.localStorage.setItem(corruptKey, raw);
      } catch {
        // storage quota full
      }
      const fallback = getInitialSeedData();
      return {
        data: fallback,
        isCorrupt: true,
        isNewlySeeded: true,
        recomputedCount: 0,
      };
    }

    // Check for stale score model version and recompute if necessary
    const { projects: modernProjects, count } = recomputeStaleScores(parsed.projects);
    const data: AppData = {
      ...parsed,
      projects: modernProjects,
    };

    if (count > 0) {
      saveGraveyardDataImmediate(data);
    }

    return {
      data,
      isCorrupt: false,
      isNewlySeeded: false,
      recomputedCount: count,
    };
  } catch {
    const fallback = getInitialSeedData();
    return {
      data: fallback,
      isCorrupt: true,
      isNewlySeeded: true,
      recomputedCount: 0,
    };
  }
}

export function saveGraveyardDataImmediate(data: AppData): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Failed to save graveyard data to localStorage', err);
    return false;
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
export function saveGraveyardDataDebounced(data: AppData, delayMs: number = 300) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    saveGraveyardDataImmediate(data);
    debounceTimer = null;
  }, delayMs);
}

export function exportGraveyardJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importGraveyardJson(jsonString: string): AppData {
  const parsed = JSON.parse(jsonString);
  if (!isValidAppData(parsed)) {
    throw new Error('Invalid Project Graveyard backup JSON schema.');
  }
  return parsed;
}
