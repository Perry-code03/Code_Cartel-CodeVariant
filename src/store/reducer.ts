import {
  AppData,
  Project,
  SalvagedComponent,
  RoadmapEvent,
  Autopsy,
  RevivalPlan,
  PathId,
} from '@/types';
import { applyPath } from '@/lib/status';
import { computeResurrectionScore, SCORE_MODEL_VERSION } from '@/lib/score';
import { getInitialSeedData } from '@/data/seed';

export type Action =
  | { type: 'ADD_PROJECT'; payload: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'> }
  | { type: 'UPDATE_PROJECT'; payload: { id: string } & Partial<Project> }
  | { type: 'DELETE_PROJECT'; payload: { id: string } }
  | { type: 'TOGGLE_PIN'; payload: { id: string } }
  | { type: 'SAVE_AUTOPSY'; payload: { projectId: string; autopsyData: Omit<Autopsy, 'score' | 'scoreModelVersion' | 'completedAt'> } }
  | { type: 'SELECT_PATH'; payload: { projectId: string; plan: Omit<RevivalPlan, 'chosenAt'> } }
  | { type: 'TOGGLE_TASK'; payload: { projectId: string; taskId: string } }
  | { type: 'ADD_COMPONENT'; payload: Omit<SalvagedComponent, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_COMPONENT'; payload: { id: string } & Partial<SalvagedComponent> }
  | { type: 'DELETE_COMPONENT'; payload: { id: string } }
  | { type: 'IMPORT_DATA'; payload: AppData }
  | { type: 'RESTORE_DEMO'; payload?: { resetAll?: boolean } };

export function graveyardReducer(state: AppData, action: Action): AppData {
  const now = new Date().toISOString();

  switch (action.type) {
    case 'ADD_PROJECT': {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `proj-${Date.now()}`;
      const newProject: Project = {
        ...action.payload,
        id,
        status: 'deceased',
        createdAt: now,
        updatedAt: now,
      };

      const event: RoadmapEvent = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        projectId: id,
        kind: 'project_created',
        message: `Project buried in the Necropolis Vault with ${newProject.completion}% completion.`,
        at: now,
      };

      return {
        ...state,
        projects: [newProject, ...state.projects],
        events: [event, ...state.events],
      };
    }

    case 'UPDATE_PROJECT': {
      const { id, ...updates } = action.payload;
      const target = state.projects.find((p) => p.id === id);
      if (!target) return state;

      const updatedProject: Project = {
        ...target,
        ...updates,
        updatedAt: now,
      };

      const event: RoadmapEvent = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        projectId: id,
        kind: 'project_updated',
        message: `Project metadata updated.`,
        at: now,
      };

      return {
        ...state,
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        events: [event, ...state.events],
      };
    }

    case 'DELETE_PROJECT': {
      const { id } = action.payload;
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== id),
        components: state.components.filter((c) => c.projectId !== id),
        events: state.events.filter((e) => e.projectId !== id),
      };
    }

    case 'TOGGLE_PIN': {
      const { id } = action.payload;
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, pinned: !p.pinned, updatedAt: now } : p
        ),
      };
    }

    case 'SAVE_AUTOPSY': {
      const { projectId, autopsyData } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return state;

      const scoreResult = computeResurrectionScore({
        completion: project.completion,
        willingness: autopsyData.willingness,
        usefulComponents: autopsyData.usefulComponents,
        hoursAvailable: autopsyData.hoursAvailable,
        scopeClarity: autopsyData.scopeClarity,
        blockerSeverity: autopsyData.blockerSeverity,
      });

      const autopsy: Autopsy = {
        ...autopsyData,
        score: scoreResult.score,
        scoreModelVersion: SCORE_MODEL_VERSION,
        completedAt: now,
      };

      const event: RoadmapEvent = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        projectId,
        kind: 'autopsy_completed',
        message: `Autopsy post-mortem completed. Resurrection Score calculated at ${scoreResult.score} (${scoreResult.bandLabel}).`,
        at: now,
        meta: { score: scoreResult.score, band: scoreResult.band },
      };

      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === projectId ? { ...p, autopsy, updatedAt: now } : p
        ),
        events: [event, ...state.events],
      };
    }

    case 'SELECT_PATH': {
      const { projectId, plan: planInput } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return state;

      const projectComponents = state.components.filter((c) => c.projectId === projectId);
      const transition = applyPath(project, planInput.path, projectComponents.length);

      if (!transition.allowed) {
        return state;
      }

      const plan: RevivalPlan = {
        ...planInput,
        chosenAt: now,
        archivedAt: planInput.path === 'archive' ? now : undefined,
      };

      const newEvents: RoadmapEvent[] = [];

      newEvents.push({
        id: `ev-${Date.now()}-path`,
        projectId,
        kind: 'path_selected',
        message: `Revival path chosen: ${formatPathName(planInput.path)}.`,
        at: now,
        meta: { path: planInput.path },
      });

      if (transition.statusChanged) {
        newEvents.push({
          id: `ev-${Date.now()}-status`,
          projectId,
          kind: 'status_changed',
          message: `Status transitioned from ${project.status} to ${transition.newStatus}.`,
          at: now,
          meta: { from: project.status, to: transition.newStatus },
        });
      }

      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                status: transition.newStatus,
                plan,
                updatedAt: now,
              }
            : p
        ),
        events: [...newEvents, ...state.events],
      };
    }

    case 'TOGGLE_TASK': {
      const { projectId, taskId } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
      if (!project || !project.plan || !project.plan.tasks) return state;

      const updatedTasks = project.plan.tasks.map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t
      );

      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                plan: {
                  ...p.plan!,
                  tasks: updatedTasks,
                },
                updatedAt: now,
              }
            : p
        ),
      };
    }

    case 'ADD_COMPONENT': {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `comp-${Date.now()}`;
      const newComp: SalvagedComponent = {
        ...action.payload,
        id,
        createdAt: now,
        updatedAt: now,
      };

      const event: RoadmapEvent = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        projectId: newComp.projectId,
        kind: 'component_added',
        message: `Harvested reusable component: ${newComp.name} (${newComp.type}).`,
        at: now,
      };

      return {
        ...state,
        components: [newComp, ...state.components],
        events: [event, ...state.events],
      };
    }

    case 'UPDATE_COMPONENT': {
      const { id, ...updates } = action.payload;
      return {
        ...state,
        components: state.components.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: now } : c
        ),
      };
    }

    case 'DELETE_COMPONENT': {
      const { id } = action.payload;
      const comp = state.components.find((c) => c.id === id);
      const newEvents = comp
        ? [
            {
              id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              projectId: comp.projectId,
              kind: 'component_removed' as const,
              message: `Removed salvaged component: ${comp.name}.`,
              at: now,
            },
          ]
        : [];

      return {
        ...state,
        components: state.components.filter((c) => c.id !== id),
        events: [...newEvents, ...state.events],
      };
    }

    case 'IMPORT_DATA': {
      return action.payload;
    }

    case 'RESTORE_DEMO': {
      const seed = getInitialSeedData();
      if (action.payload?.resetAll) {
        return seed;
      }
      // Keep user-created projects and components
      const userProjects = state.projects.filter((p) => !p.isSample);
      const userProjectIds = new Set(userProjects.map((p) => p.id));
      const userComponents = state.components.filter((c) => userProjectIds.has(c.projectId));
      const userEvents = state.events.filter((e) => userProjectIds.has(e.projectId));

      return {
        schemaVersion: 1,
        projects: [...userProjects, ...seed.projects],
        components: [...userComponents, ...seed.components],
        events: [...userEvents, ...seed.events],
      };
    }

    default:
      return state;
  }
}

function formatPathName(path: PathId): string {
  switch (path) {
    case 'phoenix':
      return 'Phoenix Protocol';
    case 'pivot':
      return 'Pivot Path';
    case 'salvage':
      return 'Salvage Yard';
    case 'archive':
      return 'Peaceful Archive';
  }
}
