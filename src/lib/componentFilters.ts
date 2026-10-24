import { SalvagedComponent, ComponentType } from '@/types';

export interface ComponentFilterCriteria {
  search?: string;
  type?: ComponentType | 'all';
  projectId?: string | 'all';
  stack?: string;
  tag?: string;
  sort?: 'newest' | 'name';
}

export function filterComponents(
  components: SalvagedComponent[],
  criteria: ComponentFilterCriteria
): SalvagedComponent[] {
  let result = [...components];

  if (criteria.search && criteria.search.trim()) {
    const q = criteria.search.trim().toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (criteria.type && criteria.type !== 'all') {
    result = result.filter((c) => c.type === criteria.type);
  }

  if (criteria.projectId && criteria.projectId !== 'all') {
    result = result.filter((c) => c.projectId === criteria.projectId);
  }

  if (criteria.stack) {
    const s = criteria.stack.toLowerCase();
    result = result.filter((c) => c.stack.some((item) => item.toLowerCase() === s));
  }

  if (criteria.tag) {
    const t = criteria.tag.toLowerCase();
    result = result.filter((c) => c.tags.some((item) => item.toLowerCase() === t));
  }

  result.sort((a, b) => {
    if (criteria.sort === 'name') {
      return a.name.localeCompare(b.name);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return result;
}
