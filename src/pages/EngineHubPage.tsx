import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreProvider';
import { Flame, ArrowRight, Zap, RefreshCw, Scissors, Archive, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recommendRevivalPath } from '@/lib/recommend';

export const EngineHubPage: React.FC = () => {
  const { state } = useStore();
  const navigate = useNavigate();

  const resurrectingProjects = state.projects.filter((p) => p.status === 'resurrecting');
  const otherProjects = state.projects.filter((p) => p.status !== 'resurrecting');

  const getPathIcon = (path?: string) => {
    switch (path) {
      case 'phoenix':
        return <Zap size={14} className="text-acid" />;
      case 'pivot':
        return <RefreshCw size={14} className="text-violet-soft" />;
      case 'salvage':
        return <Scissors size={14} className="text-amber" />;
      case 'archive':
        return <Archive size={14} className="text-muted" />;
      default:
        return <Flame size={14} className="text-muted" />;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-violet-soft">
          <Flame size={14} />
          <span>Workspace &bull; Revival Operations</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-text mt-2">
          Resurrection Engine
        </h1>
        <p className="text-sm text-muted mt-2 max-w-2xl font-sans leading-relaxed">
          The four strategic revival pathways: Phoenix Protocol (72-hour MVP sprint), Pivot Path (reframe core thesis), Component Salvage (extract reusable primitives), or Peaceful Archive.
        </p>
      </div>

      {/* Active Resurrections */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-acid" />
          <h2 className="font-mono text-sm uppercase tracking-wider font-bold text-text">
            Active Resurrections ({resurrectingProjects.length})
          </h2>
        </div>

        {resurrectingProjects.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface border border-border text-center">
            <p className="text-sm text-muted">No projects are currently resurrecting.</p>
            <Button
              onClick={() => navigate('/vault')}
              className="mt-4 bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold"
            >
              Select a Project from Vault
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resurrectingProjects.map((p) => {
              const tasks = p.plan?.tasks || [];
              const doneTasks = tasks.filter((t) => t.done).length;
              return (
                <div
                  key={p.id}
                  className="p-6 rounded-2xl bg-surface border border-acid/40 hover:border-acid transition-colors flex flex-col justify-between space-y-4 shadow-[0_0_15px_rgba(182,255,60,0.06)]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-mono text-lg font-bold text-text">{p.name}</h3>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 border border-border text-xs font-mono capitalize text-acid">
                        {getPathIcon(p.plan?.path)}
                        <span>{p.plan?.path || 'phoenix'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted mt-2">{p.description}</p>
                    {tasks.length > 0 && (
                      <div className="mt-4 flex items-center justify-between text-xs font-mono text-muted">
                        <span>Sprint Tasks</span>
                        <span className="text-acid font-bold">{doneTasks} / {tasks.length} done</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-mono text-muted">
                      Score: <strong className="text-text">{p.autopsy?.score ?? 'N/A'}/100</strong>
                    </span>
                    <Button
                      onClick={() => navigate(`/project/${p.id}?tab=engine`)}
                      className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold"
                    >
                      Open Sprint Plan
                      <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Other Projects Available for Revival */}
      <div className="space-y-4 pt-6 border-t border-border">
        <h2 className="font-mono text-sm uppercase tracking-wider font-bold text-text">
          Available in Crypt ({otherProjects.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherProjects.map((p) => {
            const recommendation = p.autopsy
              ? recommendRevivalPath({
                  score: p.autopsy.score,
                  willingness: p.autopsy.willingness,
                  stopCategory: p.autopsy.stopCategory,
                  usefulComponents: p.autopsy.usefulComponents,
                  hoursAvailable: p.autopsy.hoursAvailable,
                  scopeClarity: p.autopsy.scopeClarity,
                  blockerSeverity: p.autopsy.blockerSeverity,
                })
              : null;
            return (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-surface border border-border flex items-center justify-between hover:border-border/80 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-base font-bold text-text">{p.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-muted uppercase bg-surface-2 border border-border">
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1 line-clamp-1">{p.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-violet-soft">
                    <span>Rec: {recommendation ? recommendation.primary.toUpperCase() : 'PENDING AUTOPSY'}</span>
                    <span>&bull;</span>
                    <span>Score: {p.autopsy?.score ?? 'N/A'}/100</span>
                  </div>
                </div>

                <Button
                  onClick={() => navigate(`/project/${p.id}?tab=engine`)}
                  variant="outline"
                  className="border-border text-text hover:bg-surface-2 font-mono text-xs shrink-0 ml-4"
                >
                  Revive
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
