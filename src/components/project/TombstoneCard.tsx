import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, Status } from '@/types';
import { HauntButton } from '@/components/motion/HauntButton';
import { formatAgeLabel } from '@/lib/date';
import { getScoreBand } from '@/lib/score';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Skull,
  PauseCircle,
  Flame,
  Wrench,
  Activity,
  Trash2,
  Edit2,
  ExternalLink,
} from 'lucide-react';

interface TombstoneCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onTogglePin: (id: string) => void;
}

export const TombstoneCard: React.FC<TombstoneCardProps> = ({
  project,
  onEdit,
  onDelete,
  onTogglePin,
}) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case 'deceased':
        return {
          label: 'Deceased',
          icon: Skull,
          className: 'border-violet/40 text-violet-soft bg-violet/10 shadow-[0_0_8px_rgba(139,92,246,0.15)]',
        };
      case 'in_stasis':
        return {
          label: 'In Stasis',
          icon: PauseCircle,
          className: 'border-amber/40 text-amber bg-amber/10 shadow-[0_0_8px_rgba(255,178,36,0.15)]',
        };
      case 'resurrecting':
        return {
          label: 'Resurrecting',
          icon: Flame,
          className: 'border-acid/40 text-acid bg-acid/10 shadow-[0_0_8px_rgba(182,255,60,0.2)]',
        };
      case 'salvaged':
        return {
          label: 'Salvaged',
          icon: Wrench,
          className: 'border-violet/40 text-violet bg-violet/10',
        };
    }
  };

  const getStatusOutline = (status: Status) => {
    switch (status) {
      case 'deceased':
        return 'stroke-border group-hover:stroke-violet/60';
      case 'in_stasis':
        return 'stroke-border group-hover:stroke-amber/60';
      case 'resurrecting':
        return 'stroke-border group-hover:stroke-acid/60';
      case 'salvaged':
        return 'stroke-border group-hover:stroke-violet/60';
    }
  };

  const getStatusBaseOutline = (status: Status) => {
    switch (status) {
      case 'deceased':
        return 'border-border/80 group-hover:border-violet/50';
      case 'in_stasis':
        return 'border-border/80 group-hover:border-amber/50';
      case 'resurrecting':
        return 'border-border/80 group-hover:border-acid/50';
      case 'salvaged':
        return 'border-border/80 group-hover:border-violet/50';
    }
  };

  const statusConfig = getStatusBadge(project.status);
  const StatusIcon = statusConfig.icon;
  const score = project.autopsy?.score;
  const scoreBand = score !== undefined ? getScoreBand(score) : null;

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className="group relative cursor-pointer flex flex-col justify-between h-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-lg drop-shadow-sm hover:drop-shadow-[0_8px_24px_rgba(139,92,246,0.12)]"
      tabIndex={0}
      role="article"
      aria-label={`Tombstone for ${project.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/project/${project.id}`);
      }}
    >
      {/* Tombstone Body with Arch & Stepped Shoulders */}
      <div className="relative flex-1 flex flex-col justify-between pt-12 pb-5 px-5">
        {/* Background SVG behind the content: arched tombstone top with stepped shoulders */}
        <div className="absolute inset-0 pointer-events-none -z-0">
          <svg
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 1000 1000"
            aria-hidden="true"
          >
            <path
              d="M 1 999 L 1 95 C 1 82, 14 74, 28 74 L 145 74 C 155 74, 162 68, 162 60 L 162 56 C 162 50, 170 48, 176 46 C 270 16, 380 2, 500 2 C 620 2, 730 16, 824 46 C 830 48, 838 50, 838 56 L 838 60 C 838 68, 845 74, 855 74 L 972 74 C 986 74, 999 82, 999 95 L 999 999 Z"
              vectorEffect="non-scaling-stroke"
              strokeWidth="1"
              className={`fill-surface group-hover:fill-surface-2 ${getStatusOutline(
                project.status
              )} transition-colors duration-300`}
            />
          </svg>
        </div>

        {/* Top Arch Banner & Info */}
        <div className="relative z-10">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded bg-surface-2 border border-border text-muted">
                R.I.P.
              </span>
              <span className="font-mono text-xs text-muted">
                {formatAgeLabel(project.lastActiveAt)}
              </span>
            </div>

            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <HauntButton
                isHaunted={!!project.pinned}
                onToggle={() => onTogglePin(project.id)}
              />

              <DropdownMenu>
                <DropdownMenuTrigger
                  className="p-1 rounded text-muted hover:text-text hover:bg-surface-2 focus:ring-1 focus:ring-violet"
                  aria-label="Project actions"
                >
                  <MoreVertical size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-surface border-border text-text">
                  <DropdownMenuItem onClick={() => navigate(`/project/${project.id}`)}>
                    <ExternalLink size={14} className="mr-2" />
                    View Crypt Dossier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}/autopsy`)}>
                    <Activity size={14} className="mr-2 text-acid" />
                    {project.autopsy ? 'Re-run Autopsy' : 'Conduct Autopsy'}
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(project)}>
                      <Edit2 size={14} className="mr-2" />
                      Edit Project
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem
                        onClick={() => onDelete(project)}
                        className="text-danger focus:text-danger focus:bg-danger/10"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Erase from Crypt
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Project Title and Category */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-mono text-lg font-bold text-text group-hover:text-acid transition-colors truncate">
                {project.name}
              </h3>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${statusConfig.className}`}
              >
                <StatusIcon size={12} />
                {statusConfig.label}
              </span>
            </div>
            <p className="font-mono text-[11px] text-muted tracking-wide mt-0.5">
              {project.category}
            </p>

            <p className="text-xs text-muted/90 line-clamp-2 mt-2 leading-relaxed">
              {project.description}
            </p>
          </div>
        </div>

        {/* Middle & Footer Metrics */}
        <div className="relative z-10 mt-5 space-y-4">
          {/* Completion Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-muted mb-1.5">
              <span>Built State</span>
              <span className="text-text font-bold">{project.completion}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden border border-border/40">
              <div
                className="h-full bg-gradient-to-r from-violet to-acid transition-all duration-500 rounded-full"
                style={{ width: `${project.completion}%` }}
              />
            </div>
          </div>

          {/* Resurrection Score Metric Ring */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2/60 border border-border">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
                Resurrection Score
              </span>
              <span className="text-xs font-medium text-text mt-0.5">
                {scoreBand ? scoreBand.label : 'Not Diagnosed'}
              </span>
            </div>

            {score !== undefined ? (
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg font-mono font-bold ${
                    score >= 70 ? 'text-acid' : score >= 40 ? 'text-violet-soft' : 'text-amber'
                  }`}
                >
                  {score}
                </span>
                <span className="text-xs text-muted font-mono">/100</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/projects/${project.id}/autopsy`);
                }}
                className="text-xs font-mono px-2 py-1 rounded bg-violet/20 hover:bg-violet/30 text-violet-soft border border-violet/30"
              >
                Diagnose
              </button>
            )}
          </div>

          {/* Tech Stack Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {project.stack.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-2 text-muted border border-border"
              >
                {tech}
              </span>
            ))}
            {project.stack.length > 4 && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-muted/80">
                +{project.stack.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Flat Base Slab Under the Card */}
      <div
        className={`relative z-10 w-[calc(100%+16px)] -ml-2 h-[10px] rounded-xs bg-[#0A0D12] border ${getStatusBaseOutline(
          project.status
        )} shadow-[0_4px_12px_rgba(0,0,0,0.6)] transition-colors duration-300`}
        aria-hidden="true"
      />
    </div>
  );
};
