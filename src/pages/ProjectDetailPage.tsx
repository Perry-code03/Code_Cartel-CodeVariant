import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore, useProject } from '@/store/StoreProvider';
import { HauntButton } from '@/components/motion/HauntButton';
import { SuccessCheck } from '@/components/motion/SuccessCheck';
import { formatAgeLabel } from '@/lib/date';
import { getScoreBand } from '@/lib/score';
import { generatePhoenixSprintTasks } from '@/lib/phoenix';
import { generateProjectMarkdown, downloadMarkdownFile, copyToClipboard } from '@/lib/markdown';
import { BuryProjectDialog } from '@/components/project/BuryProjectDialog';
import {
  Flame,
  Wrench,
  Archive,
  Compass,
  ArrowLeft,
  Calendar,
  CheckSquare,
  Square,
  Plus,
  Copy,
  Download,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { dispatch } = useStore();
  const { project, components, events } = useProject(id);

  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [editOpen, setEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Phoenix plan state
  const [newTaskInput, setNewTaskInput] = useState('');

  // Pivot plan state
  const [pivotDirection, setPivotDirection] = useState('');
  const [pivotReason, setPivotReason] = useState('');

  // Archive plan state
  const [epitaph, setEpitaph] = useState('');

  // Sync tab with URL search params
  const setTab = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (project?.plan) {
      if (project.plan.pivotDirection) setPivotDirection(project.plan.pivotDirection);
      if (project.plan.pivotReason) setPivotReason(project.plan.pivotReason);
      if (project.plan.epitaph) setEpitaph(project.plan.epitaph);
    }
  }, [project]);

  if (!project) {
    return (
      <div className="p-12 text-center text-muted font-mono">
        Project not found in crypt.{' '}
        <button onClick={() => navigate('/vault')} className="text-acid underline">
          Return to Vault
        </button>
      </div>
    );
  }

  const score = project.autopsy?.score;
  const scoreBand = score !== undefined ? getScoreBand(score) : null;

  // Phoenix Task handlers
  const handleToggleTask = (taskId: string) => {
    dispatch({
      type: 'TOGGLE_TASK',
      payload: { projectId: project.id, taskId },
    });
  };

  const handleAddPhoenixTask = () => {
    if (!newTaskInput.trim()) return;
    const currentTasks = project.plan?.tasks || [];
    if (currentTasks.length >= 12) return;

    const updatedTasks = [
      ...currentTasks,
      { id: `task-${Date.now()}`, text: newTaskInput.trim(), done: false },
    ];

    dispatch({
      type: 'SELECT_PATH',
      payload: {
        projectId: project.id,
        plan: {
          path: 'phoenix',
          tasks: updatedTasks,
        },
      },
    });
    setNewTaskInput('');
  };

  const handleSelectPhoenix = () => {
    const tasks = project.plan?.tasks || generatePhoenixSprintTasks(project);
    dispatch({
      type: 'SELECT_PATH',
      payload: {
        projectId: project.id,
        plan: {
          path: 'phoenix',
          tasks,
        },
      },
    });
  };

  const handleSelectPivot = () => {
    if (!pivotDirection.trim()) return;
    dispatch({
      type: 'SELECT_PATH',
      payload: {
        projectId: project.id,
        plan: {
          path: 'pivot',
          pivotDirection: pivotDirection.trim(),
          pivotReason: pivotReason.trim(),
        },
      },
    });
  };

  const handleSelectSalvage = () => {
    if (components.length < 1) {
      alert('You must harvest at least 1 component before marking this project as Salvaged.');
      return;
    }
    dispatch({
      type: 'SELECT_PATH',
      payload: {
        projectId: project.id,
        plan: {
          path: 'salvage',
          notes: `Project decommissioned with ${components.length} components harvested to market.`,
        },
      },
    });
  };

  const handleSelectArchive = () => {
    dispatch({
      type: 'SELECT_PATH',
      payload: {
        projectId: project.id,
        plan: {
          path: 'archive',
          epitaph: epitaph.trim() || undefined,
        },
      },
    });
  };

  const markdownContent = generateProjectMarkdown(project, components, events);

  const handleCopyMarkdown = async () => {
    const ok = await copyToClipboard(markdownContent);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    downloadMarkdownFile(`${project.name}-graveyard-dossier`, markdownContent);
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <button
          type="button"
          onClick={() => navigate('/vault')}
          className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-text"
        >
          <ArrowLeft size={14} /> Back to Vault
        </button>

        <div className="flex items-center gap-2">
          <HauntButton
            isHaunted={!!project.pinned}
            onToggle={() => dispatch({ type: 'TOGGLE_PIN', payload: { id: project.id } })}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditOpen(true)}
            className="border-border text-text font-mono text-xs"
          >
            <Edit2 size={13} className="mr-1.5" /> Edit
          </Button>
        </div>
      </div>

      {/* Project Header Banner */}
      <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl sm:text-3xl font-bold text-text">
              {project.name}
            </h1>
            <span
              className={`font-mono text-xs px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${
                project.status === 'resurrecting'
                  ? 'bg-acid/15 border-acid/50 text-acid'
                  : project.status === 'in_stasis'
                  ? 'bg-amber/15 border-amber/50 text-amber'
                  : project.status === 'salvaged'
                  ? 'bg-violet/15 border-violet/50 text-violet-soft'
                  : 'bg-violet/10 border-violet/30 text-violet-soft'
              }`}
            >
              {project.status.replace('_', ' ')}
            </span>
          </div>

          <p className="text-sm text-muted font-sans max-w-2xl">{project.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted pt-1">
            <span className="flex items-center gap-1">
              <Calendar size={13} /> {formatAgeLabel(project.lastActiveAt)}
            </span>
            <span>Category: {project.category}</span>
            <span>Built: {project.completion}%</span>
          </div>
        </div>

        {/* Score Ring Display */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-2 border border-border shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase text-muted tracking-wider">
              Resurrection Score
            </span>
            <span className="text-xs font-mono text-text mt-0.5">
              {scoreBand ? scoreBand.label : 'Pending Autopsy'}
            </span>
          </div>

          {score !== undefined ? (
            <div className="text-right font-mono">
              <span
                className={`text-3xl font-black ${
                  score >= 70 ? 'text-acid' : score >= 40 ? 'text-violet-soft' : 'text-amber'
                }`}
              >
                {score}
              </span>
              <span className="text-xs text-muted">/100</span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate(`/projects/${project.id}/autopsy`)}
              className="bg-acid text-bg font-mono text-xs font-bold"
            >
              Run Autopsy
            </Button>
          )}
        </div>
      </div>

      {/* Dead-to-Active Lifecycle Progress Rail */}
      <div className="p-4 rounded-xl bg-surface border border-border">
        <span className="text-[10px] font-mono uppercase text-muted tracking-wider block mb-2">
          Lifecycle State Progression
        </span>
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
          {[
            { id: 'deceased', label: '1. Deceased' },
            { id: 'in_stasis', label: '2. In Stasis' },
            { id: 'resurrecting', label: '3. Resurrecting' },
            { id: 'salvaged', label: '4. Salvaged' },
          ].map((st) => (
            <div
              key={st.id}
              className={`p-2 rounded-lg border transition-all ${
                project.status === st.id
                  ? 'bg-acid/15 border-acid text-acid font-bold shadow-[0_0_8px_rgba(182,255,60,0.2)]'
                  : 'bg-surface-2/40 border-border/50 text-muted'
              }`}
            >
              {st.label}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border overflow-x-auto gap-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'autopsy', label: 'Autopsy & Score' },
          { id: 'engine', label: 'Resurrection Engine' },
          { id: 'components', label: `Salvaged Parts (${components.length})` },
          { id: 'roadmap', label: `Roadmap (${events.length})` },
          { id: 'export', label: 'Export Dossier' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={`py-2.5 px-4 font-mono text-xs whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-acid text-acid font-bold bg-surface-2/30'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-surface border border-border md:col-span-2 space-y-4">
              <h3 className="font-mono text-sm font-bold text-text">Repository Narrative</h3>
              {project.autopsy ? (
                <div className="space-y-3 font-sans text-xs">
                  <div>
                    <span className="font-mono text-muted text-[11px] uppercase block">
                      What Was Built
                    </span>
                    <p className="text-text mt-0.5 leading-relaxed">{project.autopsy.whatWasBuilt}</p>
                  </div>
                  <div>
                    <span className="font-mono text-muted text-[11px] uppercase block">
                      What Broke
                    </span>
                    <p className="text-text mt-0.5 leading-relaxed">{project.autopsy.whatBroke}</p>
                  </div>
                  <div>
                    <span className="font-mono text-muted text-[11px] uppercase block">
                      Why Development Stalled
                    </span>
                    <p className="text-text mt-0.5 leading-relaxed">{project.autopsy.whyStopped}</p>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-muted font-mono text-xs">
                  No post-mortem diagnostic recorded yet.{' '}
                  <button
                    onClick={() => navigate(`/projects/${project.id}/autopsy`)}
                    className="text-acid underline ml-1"
                  >
                    Run Autopsy Now
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions & Meta */}
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-4">
              <h3 className="font-mono text-sm font-bold text-text">Crypt Information</h3>
              <div className="space-y-2 font-mono text-xs text-muted">
                <div className="flex justify-between">
                  <span>Tech Stack:</span>
                  <span className="text-text font-bold">{project.stack.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="text-text">{project.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>Buried At:</span>
                  <span className="text-text">{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Harvested Parts:</span>
                  <span className="text-acid font-bold">{components.length}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <Button
                  onClick={() => setTab('engine')}
                  className="w-full bg-acid text-bg font-mono text-xs font-bold"
                >
                  <Flame size={14} className="mr-1.5" />
                  Open Resurrection Engine
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/salvage?project=${project.id}`)}
                  className="w-full border-border text-text font-mono text-xs"
                >
                  <Wrench size={14} className="mr-1.5" />
                  View Salvaged Parts
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. AUTOPSY TAB */}
      {activeTab === 'autopsy' && (
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <div>
              <h3 className="font-mono text-lg font-bold text-text">Post-Mortem Diagnostic</h3>
              <p className="text-xs text-muted font-mono mt-0.5">
                Rule-based heuristic evaluated against 6 objective variables
              </p>
            </div>
            <Button
              onClick={() => navigate(`/projects/${project.id}/autopsy`)}
              className="bg-acid text-bg font-mono text-xs font-bold"
            >
              {project.autopsy ? 'Re-run Autopsy' : 'Conduct Autopsy'}
            </Button>
          </div>

          {project.autopsy ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-2 border border-border font-mono text-xs space-y-2">
                  <span className="text-muted text-[10px] uppercase">Stop Category</span>
                  <p className="text-text font-bold text-sm uppercase">{project.autopsy.stopCategory}</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-2 border border-border font-mono text-xs space-y-2">
                  <span className="text-muted text-[10px] uppercase">Willingness to Continue</span>
                  <p className="text-acid font-bold text-sm">{project.autopsy.willingness} / 5</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-2 border border-border font-sans text-xs space-y-4">
                <div>
                  <span className="font-mono text-muted text-[10px] uppercase block">What Was Built</span>
                  <p className="text-text mt-1">{project.autopsy.whatWasBuilt}</p>
                </div>
                <div>
                  <span className="font-mono text-muted text-[10px] uppercase block">What Broke</span>
                  <p className="text-text mt-1">{project.autopsy.whatBroke}</p>
                </div>
                <div>
                  <span className="font-mono text-muted text-[10px] uppercase block">Why Stopped</span>
                  <p className="text-text mt-1">{project.autopsy.whyStopped}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-muted font-mono text-xs">
              No autopsy completed yet for {project.name}.
            </div>
          )}
        </div>
      )}

      {/* 3. RESURRECTION ENGINE TAB */}
      {activeTab === 'engine' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <h3 className="font-mono text-sm font-bold text-text">Choose a Strategic Revival Path</h3>
            <p className="text-xs text-muted font-mono mt-0.5">
              The engine provides recommendations based on your score, but you hold absolute autonomy to pick any path.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Path 1: Phoenix Protocol */}
            <div
              className={`p-6 rounded-2xl bg-surface border transition-all ${
                project.plan?.path === 'phoenix'
                  ? 'border-acid shadow-[0_0_16px_rgba(182,255,60,0.2)]'
                  : 'border-border hover:border-acid/50'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Flame size={18} className="text-acid" />
                  <h4 className="font-mono text-base font-bold text-text">Phoenix Protocol</h4>
                </div>
                {project.plan?.path === 'phoenix' && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-acid text-bg font-bold">
                    ACTIVE
                  </span>
                )}
              </div>

              <p className="text-xs text-muted font-sans mt-3 leading-relaxed">
                A high-intensity 3-day MVP sprint plan. Strip non-essential bloat, solve the core blocker, and deploy a live working prototype in 72 hours.
              </p>

              {/* Task Checklist if active */}
              {project.plan?.path === 'phoenix' && project.plan.tasks && (
                <div className="mt-4 space-y-2 pt-3 border-t border-border">
                  <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">
                    3-Day Sprint Tasks ({project.plan.tasks.filter((t) => t.done).length} /{' '}
                    {project.plan.tasks.length} Completed)
                  </span>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {project.plan.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task.id)}
                        className={`cursor-pointer p-2 rounded-lg border font-mono text-xs flex items-center gap-2 transition-colors ${
                          task.done
                            ? 'bg-acid/10 border-acid/30 text-muted line-through'
                            : 'bg-surface-2 border-border text-text hover:border-acid/40'
                        }`}
                      >
                        {task.done ? (
                          <CheckSquare size={14} className="text-acid shrink-0" />
                        ) : (
                          <Square size={14} className="text-muted shrink-0" />
                        )}
                        <span>{task.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Add Task Input */}
                  {project.plan.tasks.length < 12 && (
                    <div className="flex gap-2 pt-2">
                      <Input
                        value={newTaskInput}
                        onChange={(e) => setNewTaskInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddPhoenixTask()}
                        placeholder="Add sprint task (Enter to save)"
                        className="bg-surface-2 border-border text-text font-mono text-xs"
                      />
                      <Button
                        type="button"
                        onClick={handleAddPhoenixTask}
                        className="bg-acid text-bg font-mono text-xs"
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 pt-3 border-t border-border">
                <Button
                  onClick={handleSelectPhoenix}
                  className="w-full bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold"
                >
                  {project.plan?.path === 'phoenix' ? 'Re-generate 3-Day Plan' : 'Activate Phoenix Sprint'}
                </Button>
              </div>
            </div>

            {/* Path 2: Pivot Path */}
            <div
              className={`p-6 rounded-2xl bg-surface border transition-all ${
                project.plan?.path === 'pivot'
                  ? 'border-violet shadow-[0_0_16px_rgba(139,92,246,0.2)]'
                  : 'border-border hover:border-violet/50'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Compass size={18} className="text-violet-soft" />
                  <h4 className="font-mono text-base font-bold text-text">Pivot Path</h4>
                </div>
                {project.plan?.path === 'pivot' && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-violet text-white font-bold">
                    ACTIVE
                  </span>
                )}
              </div>

              <p className="text-xs text-muted font-sans mt-3 leading-relaxed">
                Reposition the core codebase towards a fresh use-case or audience while preserving the original historical post-mortem intact.
              </p>

              {/* Side-by-side Baseline: Original Project State (Preserved) */}
              <div className="mt-4 p-3 rounded-xl bg-surface-2/70 border border-border font-mono text-[11px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber tracking-wider">
                    Original Baseline (Before)
                  </span>
                  <span className="text-[10px] text-muted">{project.category}</span>
                </div>
                <p className="text-muted leading-tight">
                  <strong className="text-text">Scope: </strong>
                  {project.description}
                </p>
                {project.autopsy?.whyStopped && (
                  <p className="text-muted leading-tight">
                    <strong className="text-text">Why it Stalled: </strong>
                    {project.autopsy.whyStopped}
                  </p>
                )}
              </div>

              <div className="mt-4 space-y-3 pt-3 border-t border-border font-mono text-xs">
                <div>
                  <span className="text-[10px] uppercase text-muted block mb-1">
                    New Pivot Direction (10–500 chars)
                  </span>
                  <Input
                    value={pivotDirection}
                    onChange={(e) => setPivotDirection(e.target.value)}
                    placeholder="e.g. Reposition from consumer app to developer API..."
                    className="bg-surface-2 border-border text-text font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted block mb-1">
                    Pivot Rationale
                  </span>
                  <Textarea
                    value={pivotReason}
                    onChange={(e) => setPivotReason(e.target.value)}
                    rows={2}
                    placeholder="Why this pivot solves the previous stall..."
                    className="bg-surface-2 border-border text-text font-mono text-xs"
                  />
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border">
                <Button
                  onClick={handleSelectPivot}
                  disabled={!pivotDirection.trim()}
                  className="w-full bg-violet text-white hover:bg-violet/90 font-mono text-xs font-bold"
                >
                  Commit Pivot Direction
                </Button>
              </div>
            </div>

            {/* Path 3: Salvage Yard */}
            <div
              className={`p-6 rounded-2xl bg-surface border transition-all ${
                project.plan?.path === 'salvage'
                  ? 'border-violet-soft shadow-[0_0_16px_rgba(167,139,250,0.2)]'
                  : 'border-border hover:border-violet-soft/50'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Wrench size={18} className="text-violet-soft" />
                  <h4 className="font-mono text-base font-bold text-text">Salvage Yard</h4>
                </div>
                {project.plan?.path === 'salvage' && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-violet-soft text-bg font-bold">
                    SALVAGED
                  </span>
                )}
              </div>

              <p className="text-xs text-muted font-sans mt-3 leading-relaxed">
                Extract reusable middlewares, database schemas, and frontend components into your local Salvage Market.
              </p>

              <div className="mt-4 p-3 rounded-lg bg-surface-2 border border-border font-mono text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">Linked Components:</span>
                  <span className="text-acid font-bold">{components.length}</span>
                </div>
                {components.length === 0 && (
                  <p className="text-danger text-[11px] font-sans pt-1">
                    * Requires at least 1 component to transition project status to Salvaged.
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-border flex gap-2">
                <Button
                  onClick={() => navigate(`/salvage?newFor=${project.id}`)}
                  variant="outline"
                  className="flex-1 border-border text-text font-mono text-xs"
                >
                  + Extract Component
                </Button>
                <Button
                  onClick={handleSelectSalvage}
                  disabled={components.length < 1}
                  className="flex-1 bg-violet text-white hover:bg-violet/90 font-mono text-xs font-bold"
                >
                  Mark as Salvaged
                </Button>
              </div>
            </div>

            {/* Path 4: Peaceful Archive */}
            <div
              className={`p-6 rounded-2xl bg-surface border transition-all ${
                project.plan?.path === 'archive'
                  ? 'border-amber shadow-[0_0_16px_rgba(255,178,36,0.2)]'
                  : 'border-border hover:border-amber/50'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Archive size={18} className="text-amber" />
                  <h4 className="font-mono text-base font-bold text-text">Peaceful Archive</h4>
                </div>
                {project.plan?.path === 'archive' && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber text-bg font-bold">
                    IN STASIS
                  </span>
                )}
              </div>

              <p className="text-xs text-muted font-sans mt-3 leading-relaxed">
                Retire the project with dignity. Write an engraved epitaph and put the codebase into stasis.
              </p>

              <div className="mt-4 space-y-2 pt-3 border-t border-border">
                <span className="text-[10px] font-mono uppercase text-muted block">
                  Engraved Epitaph (Max 280 chars)
                </span>
                <Textarea
                  value={epitaph}
                  onChange={(e) => setEpitaph(e.target.value)}
                  maxLength={280}
                  rows={2}
                  placeholder="e.g. A valiant attempt at real-time syncing. Rest well in the crypt."
                  className="bg-surface-2 border-border text-text font-epitaph text-sm"
                />

                {project.plan?.epitaph && (
                  <div className="p-3 rounded-lg bg-surface-2 border border-amber/30 text-center">
                    <p className="font-epitaph text-base text-amber">
                      &ldquo;{project.plan.epitaph}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-border">
                <Button
                  onClick={handleSelectArchive}
                  className="w-full bg-amber text-bg hover:bg-amber/90 font-mono text-xs font-bold"
                >
                  Entomb in Stasis
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SALVAGED COMPONENTS TAB */}
      {activeTab === 'components' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <div>
              <h3 className="font-mono text-lg font-bold text-text">
                Salvaged Components ({components.length})
              </h3>
              <p className="text-xs text-muted font-mono">
                Reusable snippets, SQL schemas, and UI blocks extracted from this codebase
              </p>
            </div>
            <Button
              onClick={() => navigate(`/salvage?newFor=${project.id}`)}
              className="bg-acid text-bg font-mono text-xs font-bold"
            >
              + Extract New Component
            </Button>
          </div>

          {components.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {components.map((comp) => (
                <div key={comp.id} className="p-4 rounded-xl bg-surface border border-border space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-mono text-sm font-bold text-text">{comp.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-muted uppercase">
                        {comp.type}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted font-sans line-clamp-2">{comp.description}</p>
                  <pre className="p-2.5 rounded bg-surface-2 text-[11px] font-mono text-muted/90 max-h-24 overflow-hidden border border-border">
                    {comp.content.slice(0, 180)}...
                  </pre>
                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/salvage?highlight=${comp.id}`)}
                      className="border-border text-text font-mono text-xs"
                    >
                      Inspect in Market
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted font-mono text-xs">
              No components have been harvested from {project.name} yet.
            </div>
          )}
        </div>
      )}

      {/* 5. ROADMAP TAB */}
      {activeTab === 'roadmap' && (
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <div>
              <h3 className="font-mono text-lg font-bold text-text">Project Event Log</h3>
              <p className="text-xs text-muted font-mono">
                Append-only lifecycle history recorded by real user actions
              </p>
            </div>
          </div>

          <div className="space-y-4 relative border-l-2 border-border ml-3 pl-6">
            {events.map((ev) => (
              <div key={ev.id} className="relative">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-surface-2 border-2 border-acid" />
                <div className="font-mono text-xs">
                  <span className="text-muted">{new Date(ev.at).toLocaleString()}</span>
                  <p className="text-text font-medium mt-0.5">{ev.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. EXPORT DOSSIER TAB */}
      {activeTab === 'export' && (
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h3 className="font-mono text-lg font-bold text-text">Markdown Dossier Export</h3>
              <p className="text-xs text-muted font-mono">
                Download a clean, fully formatted Markdown archive of this project post-mortem.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopyMarkdown}
                className="border-border text-text font-mono text-xs"
              >
                {copied ? <SuccessCheck size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
                {copied ? 'Copied!' : 'Copy Markdown'}
              </Button>
              <Button
                onClick={handleDownloadMarkdown}
                className="bg-acid text-bg font-mono text-xs font-bold"
              >
                <Download size={14} className="mr-1.5" />
                Download .md File
              </Button>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-surface-2 border border-border text-xs font-mono text-muted max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {markdownContent}
          </pre>
        </div>
      )}

      {/* Edit Dialog Modal */}
      <BuryProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        projectToEdit={project}
      />
    </div>
  );
};
