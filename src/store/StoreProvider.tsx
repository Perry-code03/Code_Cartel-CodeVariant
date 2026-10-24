import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { AppData, Project, SalvagedComponent, RoadmapEvent } from '@/types';
import { graveyardReducer, Action } from './reducer';
import { loadGraveyardData, saveGraveyardDataDebounced, StorageLoadResult } from '@/lib/storage';

interface StoreContextValue {
  state: AppData;
  dispatch: React.Dispatch<Action>;
  storageStatus: {
    isCorrupt: boolean;
    isNewlySeeded: boolean;
    recomputedCount: number;
  };
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialResult = useMemo<StorageLoadResult>(() => loadGraveyardData(), []);
  const [state, dispatch] = useReducer(graveyardReducer, initialResult.data);

  // Auto-save on state mutation
  useEffect(() => {
    saveGraveyardDataDebounced(state);
  }, [state]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      storageStatus: {
        isCorrupt: initialResult.isCorrupt,
        isNewlySeeded: initialResult.isNewlySeeded,
        recomputedCount: initialResult.recomputedCount,
      },
    }),
    [state, initialResult]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}

export function useProject(id: string | undefined): {
  project: Project | undefined;
  components: SalvagedComponent[];
  events: RoadmapEvent[];
} {
  const { state } = useStore();
  return useMemo(() => {
    if (!id) return { project: undefined, components: [], events: [] };
    const project = state.projects.find((p) => p.id === id);
    const components = state.components.filter((c) => c.projectId === id);
    const events = state.events.filter((e) => e.projectId === id);
    return { project, components, events };
  }, [state, id]);
}
