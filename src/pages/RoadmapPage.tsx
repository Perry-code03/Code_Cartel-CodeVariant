import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/StoreProvider';
import { EventKind } from '@/types';
import {
  Milestone,
  Skull,
  Activity,
  Flame,
  Wrench,
  Edit2,
  Trash2,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const RoadmapPage: React.FC = () => {
  const { state } = useStore();
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [kindFilter, setKindFilter] = useState<string>('all');

  const filteredEvents = useMemo(() => {
    let result = [...state.events];

    if (projectFilter !== 'all') {
      result = result.filter((e) => e.projectId === projectFilter);
    }

    if (kindFilter !== 'all') {
      result = result.filter((e) => e.kind === kindFilter);
    }

    result.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return result;
  }, [state.events, projectFilter, kindFilter]);

  const getEventIcon = (kind: EventKind) => {
    switch (kind) {
      case 'project_created':
        return <Skull size={14} className="text-violet-soft" />;
      case 'autopsy_completed':
        return <Activity size={14} className="text-acid" />;
      case 'path_selected':
        return <Flame size={14} className="text-amber" />;
      case 'status_changed':
        return <Milestone size={14} className="text-acid" />;
      case 'component_added':
      case 'component_removed':
        return <Wrench size={14} className="text-violet-soft" />;
      case 'project_updated':
      default:
        return <Edit2 size={14} className="text-muted" />;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Milestone className="text-amber" size={24} />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text">
              Revival Roadmap
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted font-mono mt-1">
            Global append-only historical event log across all graveyard records
          </p>
        </div>
      </div>

      {/* Explanatory Banner */}
      <div className="p-4 rounded-xl bg-surface border border-border text-xs font-mono text-muted leading-relaxed">
        <strong className="text-text">Historical Record vs Execution Checklist:</strong> This roadmap records historical state changes and post-mortem calculations (what has happened). For forward-looking 3-day tasks, inspect the Phoenix Protocol in any resurrecting project dossier.
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-surface p-4 rounded-xl border border-border">
        <Filter size={16} className="text-muted" />

        {/* Filter by Project */}
        <Select value={projectFilter} onValueChange={(val) => setProjectFilter(val || 'all')}>
          <SelectTrigger className="w-auto h-8 bg-surface-2 border-border text-text font-mono text-xs">
            <SelectValue placeholder="Project: All" />
          </SelectTrigger>
          <SelectContent className="bg-surface border-border text-text">
            <SelectItem value="all" className="font-mono text-xs">All Projects</SelectItem>
            {state.projects.map((p) => (
              <SelectItem key={p.id} value={p.id} className="font-mono text-xs">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter by Event Kind */}
        <Select value={kindFilter} onValueChange={(val) => setKindFilter(val || 'all')}>
          <SelectTrigger className="w-auto h-8 bg-surface-2 border-border text-text font-mono text-xs">
            <SelectValue placeholder="Event Kind: All" />
          </SelectTrigger>
          <SelectContent className="bg-surface border-border text-text">
            <SelectItem value="all" className="font-mono text-xs">All Event Types</SelectItem>
            <SelectItem value="project_created" className="font-mono text-xs">Burial / Created</SelectItem>
            <SelectItem value="autopsy_completed" className="font-mono text-xs">Autopsy Completed</SelectItem>
            <SelectItem value="path_selected" className="font-mono text-xs">Path Selected</SelectItem>
            <SelectItem value="status_changed" className="font-mono text-xs">Status Changed</SelectItem>
            <SelectItem value="component_added" className="font-mono text-xs">Component Salvaged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vertical Timeline */}
      <div className="p-6 rounded-2xl bg-surface border border-border">
        {filteredEvents.length > 0 ? (
          <div className="space-y-6 relative border-l-2 border-border ml-4 pl-6">
            {filteredEvents.map((ev) => {
              const project = state.projects.find((p) => p.id === ev.projectId);
              return (
                <div key={ev.id} className="relative group">
                  {/* Glowing Node on Rail */}
                  <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-surface border-2 border-acid flex items-center justify-center shadow-[0_0_8px_rgba(182,255,60,0.4)] group-hover:scale-125 transition-transform" />

                  <div className="p-4 rounded-xl bg-surface-2/60 border border-border group-hover:border-violet/40 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-border/40">
                      <div className="flex items-center gap-2">
                        {getEventIcon(ev.kind)}
                        <span className="font-mono text-xs font-bold text-text">
                          {project ? project.name : ev.projectId}
                        </span>
                        <span className="font-mono text-[10px] px-2 py-0.2 rounded bg-surface border border-border text-muted uppercase">
                          {ev.kind.replace('_', ' ')}
                        </span>
                      </div>

                      <span className="font-mono text-[11px] text-muted flex items-center gap-1">
                        <Calendar size={12} /> {new Date(ev.at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-text/90 mt-2">{ev.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-muted font-mono text-xs">
            No events match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};
