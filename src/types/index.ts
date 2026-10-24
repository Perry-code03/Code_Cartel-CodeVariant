export type Status = 'deceased' | 'in_stasis' | 'resurrecting' | 'salvaged';
export type PathId = 'phoenix' | 'pivot' | 'salvage' | 'archive';
export type StopCategory = 'scope' | 'burnout' | 'priorities' | 'technical' | 'other';
export type Rating = 1 | 2 | 3 | 4 | 5;
export type ComponentType = 'snippet' | 'schema' | 'ui_block';

export const CATEGORIES = [
  'Web App',
  'API / Backend',
  'CLI Tool',
  'Mobile App',
  'Data / ML',
  'Game',
  'Library',
  'Other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Autopsy {
  whatWasBuilt: string;
  whatBroke: string;
  whyStopped: string;
  stopCategory: StopCategory;
  willingness: Rating;
  usefulComponents?: number;
  hoursAvailable?: number;
  scopeClarity?: Rating;
  blockerSeverity?: Rating;
  score: number;
  scoreModelVersion: number;
  completedAt: string;
}

export interface PlanTask {
  id: string;
  text: string;
  done: boolean;
}

export interface RevivalPlan {
  path: PathId;
  chosenAt: string;
  recommendedPath?: PathId;
  notes?: string;
  tasks?: PlanTask[];
  pivotDirection?: string;
  pivotReason?: string;
  epitaph?: string;
  archivedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  stack: string[];
  category: Category;
  completion: number;
  status: Status;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  isSample?: boolean;
  autopsy?: Autopsy;
  plan?: RevivalPlan;
}

export interface SalvagedComponent {
  id: string;
  projectId: string;
  name: string;
  type: ComponentType;
  description: string;
  stack: string[];
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type EventKind =
  | 'project_created'
  | 'autopsy_completed'
  | 'path_selected'
  | 'status_changed'
  | 'component_added'
  | 'component_removed'
  | 'project_updated';

export interface RoadmapEvent {
  id: string;
  projectId: string;
  kind: EventKind;
  message: string;
  at: string;
  meta?: Record<string, string | number>;
}

export interface AppData {
  schemaVersion: 1;
  projects: Project[];
  components: SalvagedComponent[];
  events: RoadmapEvent[];
}

export interface RepoAnalysis {
  name: string;
  description: string;
  stack: string[];
  category: Category;
  lastPushedAt?: string;
  source: 'github+ai' | 'github-only';
  repoUrl: string;
  aiProviderName?: string;
  notice?: string;
  reason?: string;
}

export interface GraveyardProjectSummary {
  name: string;
  status: Status;
  completion: number;
  score?: number;
  category: Category;
  stack: string[];
  stopCategory?: StopCategory;
}

export interface OracleAiResponse {
  answer?: string;
  suggestedFollowUps?: string[];
  source?: 'ai' | 'local';
  aiProviderName?: string;
  fallback?: boolean;
  notice?: string;
  reason?: string;
}

export interface AutopsySuggestion {
  whatWasBuilt?: string | null;
  whatBroke?: string | null;
  activityFacts: string[];
  source: 'ai' | 'facts-only';
  aiProviderName?: string;
  notice?: string;
  reason?: string;
}
