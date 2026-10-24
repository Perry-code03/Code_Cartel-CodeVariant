import { Status, PathId, Project } from '@/types';

export interface PathApplicationResult {
  allowed: boolean;
  newStatus: Status;
  statusChanged: boolean;
  reason?: string;
}

export function canTransition(current: Status, target: Status): boolean {
  if (current === target) return true;

  switch (current) {
    case 'deceased':
      return target === 'resurrecting' || target === 'salvaged' || target === 'in_stasis';
    case 'resurrecting':
      return target === 'deceased' || target === 'salvaged' || target === 'in_stasis';
    case 'salvaged':
      return target === 'resurrecting' || target === 'in_stasis';
    case 'in_stasis':
      return target === 'resurrecting' || target === 'salvaged';
    default:
      return false;
  }
}

export function applyPath(
  project: Project,
  path: PathId,
  componentCount: number
): PathApplicationResult {
  const currentStatus = project.status;

  if (path === 'phoenix' || path === 'pivot') {
    const newStatus: Status = 'resurrecting';
    return {
      allowed: true,
      newStatus,
      statusChanged: currentStatus !== newStatus,
    };
  }

  if (path === 'salvage') {
    if (componentCount < 1) {
      return {
        allowed: false,
        newStatus: currentStatus,
        statusChanged: false,
        reason: 'Salvage requires at least 1 component linked to this project before changing status.',
      };
    }
    const newStatus: Status = 'salvaged';
    return {
      allowed: true,
      newStatus,
      statusChanged: currentStatus !== newStatus,
    };
  }

  if (path === 'archive') {
    const newStatus: Status = 'in_stasis';
    return {
      allowed: true,
      newStatus,
      statusChanged: currentStatus !== newStatus,
    };
  }

  return {
    allowed: false,
    newStatus: currentStatus,
    statusChanged: false,
    reason: 'Unknown path requested.',
  };
}
