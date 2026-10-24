import { Project, Status, Category } from '@/types';
import { getAgeInMonths } from './date';

export type AgeFilter = 'all' | '<3mo' | '3-6mo' | '6-12mo' | '12mo+';
export type CompletionFilter = 'all' | '0-25' | '26-50' | '51-75' | '76-100';
export type SortOption = 'score_desc' | 'completion_desc' | 'age_desc' | 'name_asc' | 'updated_desc';

export interface ProjectFilterCriteria {
  search?: string;
  status?: Status | 'all';
  category?: Category | 'all';
  stacks?: string[];
  age?: AgeFilter;
  completion?: CompletionFilter;
  sort?: SortOption;
  pinnedFirst?: boolean;
}

export function filterProjects(projects: Project[], criteria: ProjectFilterCriteria): Project[] {
  let result = [...projects];

  // Search by name, description, stack
  if (criteria.search && criteria.search.trim()) {
    const q = criteria.search.trim().toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.stack.some((s) => s.toLowerCase().includes(q))
    );
  }

  // Status
  if (criteria.status && criteria.status !== 'all') {
    result = result.filter((p) => p.status === criteria.status);
  }

  // Category
  if (criteria.category && criteria.category !== 'all') {
    result = result.filter((p) => p.category === criteria.category);
  }

  // Stack tags (OR within the selected stacks: project must contain at least one)
  if (criteria.stacks && criteria.stacks.length > 0) {
    result = result.filter((p) =>
      criteria.stacks!.some((tag) =>
        p.stack.some((s) => s.toLowerCase() === tag.toLowerCase())
      )
    );
  }

  // Age in months
  if (criteria.age && criteria.age !== 'all') {
    result = result.filter((p) => {
      const months = getAgeInMonths(p.lastActiveAt);
      switch (criteria.age) {
        case '<3mo':
          return months < 3;
        case '3-6mo':
          return months >= 3 && months <= 6;
        case '6-12mo':
          return months > 6 && months <= 12;
        case '12mo+':
          return months > 12;
        default:
          return true;
      }
    });
  }

  // Completion bracket
  if (criteria.completion && criteria.completion !== 'all') {
    result = result.filter((p) => {
      const c = p.completion;
      switch (criteria.completion) {
        case '0-25':
          return c >= 0 && c <= 25;
        case '26-50':
          return c >= 26 && c <= 50;
        case '51-75':
          return c >= 51 && c <= 75;
        case '76-100':
          return c >= 76 && c <= 100;
        default:
          return true;
      }
    });
  }

  // Sort
  result.sort((a, b) => {
    // Pinned to top if enabled
    if (criteria.pinnedFirst) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
    }

    switch (criteria.sort) {
      case 'score_desc':
        return (b.autopsy?.score ?? -1) - (a.autopsy?.score ?? -1);
      case 'completion_desc':
        return b.completion - a.completion;
      case 'age_desc':
        return new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime();
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'updated_desc':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  return result;
}
