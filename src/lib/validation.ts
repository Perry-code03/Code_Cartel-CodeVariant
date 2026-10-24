import { CATEGORIES, Category } from '@/types';

export interface FieldError {
  field: string;
  message: string;
}

export function validateProject(
  data: {
    name?: string;
    description?: string;
    stack?: string[];
    category?: string;
    completion?: number;
    lastActiveAt?: string;
  },
  existingNames: string[] = [],
  _currentId?: string
): Record<string, string> {
  const errors: Record<string, string> = {};

  // Name: 2-60 chars, unique ignoring case
  const name = (data.name || '').trim();
  if (name.length < 2 || name.length > 60) {
    errors.name = 'Project name must be between 2 and 60 characters.';
  } else {
    const isDuplicate = existingNames.some(
      (n) => n.trim().toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      errors.name = 'A project with this name already rests in the graveyard.';
    }
  }

  // Description: 1-500 chars
  const description = (data.description || '').trim();
  if (description.length < 1 || description.length > 500) {
    errors.description = 'Description must be between 1 and 500 characters.';
  }

  // Stack: 1-8 tags, each 1-24 chars, no duplicates
  const stack = data.stack || [];
  if (stack.length < 1 || stack.length > 8) {
    errors.stack = 'Please provide between 1 and 8 technology stack tags.';
  } else {
    const uniqueTags = new Set(stack.map((t) => t.trim().toLowerCase()));
    if (uniqueTags.size !== stack.length) {
      errors.stack = 'Stack tags cannot contain duplicates.';
    }
    for (const tag of stack) {
      const trimmed = tag.trim();
      if (trimmed.length < 1 || trimmed.length > 24) {
        errors.stack = 'Each tech tag must be between 1 and 24 characters.';
        break;
      }
    }
  }

  // Category
  if (!data.category || !CATEGORIES.includes(data.category as Category)) {
    errors.category = 'Please choose a valid project category.';
  }

  // Completion: integer 0-100
  const comp = Number(data.completion);
  if (isNaN(comp) || !Number.isInteger(comp) || comp < 0 || comp > 100) {
    errors.completion = 'Completion must be an integer between 0% and 100%.';
  }

  // Last Active At: not in the future
  if (!data.lastActiveAt) {
    errors.lastActiveAt = 'Last active date is required.';
  } else {
    const date = new Date(data.lastActiveAt);
    if (isNaN(date.getTime())) {
      errors.lastActiveAt = 'Invalid date format.';
    } else {
      const now = new Date();
      if (date > now) {
        errors.lastActiveAt = 'Last active date cannot be in the future.';
      }
    }
  }

  return errors;
}

export function validateAutopsy(data: {
  whatWasBuilt?: string;
  whatBroke?: string;
  whyStopped?: string;
  stopCategory?: string;
  willingness?: number;
  usefulComponents?: number | null;
  hoursAvailable?: number | null;
  scopeClarity?: number | null;
  blockerSeverity?: number | null;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  const built = (data.whatWasBuilt || '').trim();
  if (built.length < 10 || built.length > 1000) {
    errors.whatWasBuilt = 'Please describe what was built (10–1000 characters).';
  }

  const broke = (data.whatBroke || '').trim();
  if (broke.length < 10 || broke.length > 1000) {
    errors.whatBroke = 'Please describe what broke (10–1000 characters).';
  }

  const stopped = (data.whyStopped || '').trim();
  if (stopped.length < 10 || stopped.length > 1000) {
    errors.whyStopped = 'Please explain why development stopped (10–1000 characters).';
  }

  const validStops = ['scope', 'burnout', 'priorities', 'technical', 'other'];
  if (!data.stopCategory || !validStops.includes(data.stopCategory)) {
    errors.stopCategory = 'Please select a primary stop category.';
  }

  const will = Number(data.willingness);
  if (isNaN(will) || will < 1 || will > 5) {
    errors.willingness = 'Willingness rating is required (1–5).';
  }

  if (data.usefulComponents !== undefined && data.usefulComponents !== null) {
    const comps = Number(data.usefulComponents);
    if (isNaN(comps) || comps < 0 || comps > 50) {
      errors.usefulComponents = 'Useful components must be between 0 and 50.';
    }
  }

  if (data.hoursAvailable !== undefined && data.hoursAvailable !== null) {
    const hrs = Number(data.hoursAvailable);
    if (isNaN(hrs) || hrs < 0 || hrs > 200) {
      errors.hoursAvailable = 'Hours available must be between 0 and 200 hours.';
    }
  }

  if (data.scopeClarity !== undefined && data.scopeClarity !== null) {
    const sc = Number(data.scopeClarity);
    if (isNaN(sc) || sc < 1 || sc > 5) {
      errors.scopeClarity = 'Scope clarity must be a rating between 1 and 5.';
    }
  }

  if (data.blockerSeverity !== undefined && data.blockerSeverity !== null) {
    const bs = Number(data.blockerSeverity);
    if (isNaN(bs) || bs < 1 || bs > 5) {
      errors.blockerSeverity = 'Blocker severity must be a rating between 1 and 5.';
    }
  }

  return errors;
}

export function validateComponent(data: {
  name?: string;
  description?: string;
  content?: string;
  type?: string;
  projectId?: string;
  tags?: string[];
  stack?: string[];
}): Record<string, string> {
  const errors: Record<string, string> = {};

  const name = (data.name || '').trim();
  if (name.length < 2 || name.length > 80) {
    errors.name = 'Component name must be between 2 and 80 characters.';
  }

  const description = (data.description || '').trim();
  if (description.length < 1 || description.length > 300) {
    errors.description = 'Description must be between 1 and 300 characters.';
  }

  const content = (data.content || '').trim();
  if (content.length < 1 || content.length > 20000) {
    errors.content = 'Component code content must be between 1 and 20,000 characters.';
  }

  if (!data.type || !['snippet', 'schema', 'ui_block'].includes(data.type)) {
    errors.type = 'Please select a valid component type.';
  }

  if (!data.projectId) {
    errors.projectId = 'Source project association is required.';
  }

  if (data.tags && data.tags.length > 8) {
    errors.tags = 'Maximum of 8 tags allowed.';
  }

  return errors;
}
