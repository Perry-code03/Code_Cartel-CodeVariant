import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreProvider';
import { Activity, ArrowRight, CheckCircle2, Clock, Skull, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AutopsyHubPage: React.FC = () => {
  const { state } = useStore();
  const navigate = useNavigate();

  const autopsied = state.projects.filter((p) => p.autopsy);
  const pending = state.projects.filter((p) => !p.autopsy);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-acid">
          <Activity size={14} />
          <span>Workspace &bull; Diagnostic Suite</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-text mt-2">
          The Autopsy Suite
        </h1>
        <p className="text-sm text-muted mt-2 max-w-2xl font-sans leading-relaxed">
          Post-mortem diagnostic analysis for stalled codebases. Evaluate completion, motivation, hours, and blockers to determine the rule-based Resurrection Score.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border">
          <span className="text-xs font-mono uppercase tracking-wider text-muted">Total Buried</span>
          <p className="text-3xl font-mono font-bold text-text mt-1">{state.projects.length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-surface border border-border">
          <span className="text-xs font-mono uppercase tracking-wider text-acid">Autopsied</span>
          <p className="text-3xl font-mono font-bold text-acid mt-1">{autopsied.length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-surface border border-border col-span-2 sm:col-span-1">
          <span className="text-xs font-mono uppercase tracking-wider text-amber">Pending Diagnostics</span>
          <p className="text-3xl font-mono font-bold text-amber mt-1">{pending.length}</p>
        </div>
      </div>

      {/* Projects Requiring Autopsy */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber" />
            <h2 className="font-mono text-sm uppercase tracking-wider font-bold text-text">
              Unexamined Codebases ({pending.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-surface border border-border flex items-center justify-between hover:border-amber/50 transition-colors"
              >
                <div>
                  <h3 className="font-mono text-base font-bold text-text">{p.name}</h3>
                  <p className="text-xs text-muted mt-1 line-clamp-1">{p.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-muted">
                    <span>{p.category}</span>
                    <span>&bull;</span>
                    <span>{p.completion}% built</span>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(`/projects/${p.id}/autopsy`)}
                  className="bg-amber text-bg hover:bg-amber/90 font-mono text-xs font-bold shrink-0 ml-4"
                >
                  Start Autopsy
                  <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Autopsies */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-acid" />
          <h2 className="font-mono text-sm uppercase tracking-wider font-bold text-text">
            Diagnosed Codebases ({autopsied.length})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {autopsied.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-surface border border-border flex items-center justify-between hover:border-violet/50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-base font-bold text-text">{p.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-2 border border-border text-acid">
                    Score: {p.autopsy?.score}/100
                  </span>
                </div>
                <p className="text-xs text-muted mt-1 line-clamp-1">
                  Why stopped: {p.autopsy?.whyStopped || 'Not recorded'}
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-muted">
                  <span>Category: {p.autopsy?.stopCategory}</span>
                  <span>&bull;</span>
                  <span>Willingness: {p.autopsy?.willingness}/5</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button
                  onClick={() => navigate(`/projects/${p.id}/autopsy`)}
                  variant="outline"
                  className="border-border text-text hover:bg-surface-2 font-mono text-xs"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="bg-violet text-text hover:bg-violet/90 font-mono text-xs"
                >
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
