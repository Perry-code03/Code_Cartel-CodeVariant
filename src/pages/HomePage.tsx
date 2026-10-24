import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreProvider';
import { TombstoneCard } from '@/components/project/TombstoneCard';
import { BuryProjectDialog } from '@/components/project/BuryProjectDialog';
import { TextSwap } from '@/components/motion/TextSwap';
import {
  Skull,
  Flame,
  Wrench,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
  Database,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HomePage: React.FC = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [buryOpen, setBuryOpen] = useState(false);

  // Cycling status words for hero live card demonstration
  const statusCycle = ['DECEASED', 'AUTOPSIED', 'RESURRECTING', 'SALVAGED'];
  const [cycleIndex, setCycleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % statusCycle.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [statusCycle.length]);

  // Compute live stats from store
  const totalBuried = state.projects.length;
  const resurrectingCount = state.projects.filter((p) => p.status === 'resurrecting').length;
  const salvagedCount = state.components.length;
  const scoredProjects = state.projects.filter((p) => p.autopsy);
  const avgScore =
    scoredProjects.length > 0
      ? Math.round(
          scoredProjects.reduce((sum, p) => sum + (p.autopsy?.score || 0), 0) /
            scoredProjects.length
        )
      : 0;

  // Real store projects for hero preview (top 3)
  const heroProjects = state.projects.slice(0, 3);

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 pt-12 pb-20 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-border text-xs font-mono text-muted mb-6">
          <span className="w-2 h-2 rounded-full bg-acid animate-pulse" />
          <span>Local Engine &bull; Zero Cloud &bull; Heuristic Diagnostics</span>
        </div>

        {/* Display Headline */}
        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-text max-w-4xl leading-[1.1]">
          Your abandoned code isn&apos;t dead.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-soft via-acid to-violet">
            It&apos;s waiting.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-muted max-w-2xl font-sans leading-relaxed">
          Autopsy it. Score it. Resurrect it, or harvest the parts. A private local sanctuary
          for side projects that never quite shipped.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={() => navigate('/vault')}
            className="bg-acid text-bg hover:bg-acid/90 font-mono text-sm font-bold px-6 py-6 rounded-xl shadow-[0_0_24px_rgba(182,255,60,0.3)] transition-all hover:scale-105"
          >
            Enter the Necropolis
            <ArrowRight size={18} className="ml-2" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => setBuryOpen(true)}
            className="border-border text-text hover:bg-surface-2 font-mono text-sm px-6 py-6 rounded-xl"
          >
            <Skull size={18} className="mr-2 text-violet-soft" />
            Bury a Project
          </Button>
        </div>

        {/* Hero Interactive Status Cycle Demonstration */}
        <div className="mt-6 flex items-center gap-2 text-xs font-mono text-muted">
          <span>Project State Evolution:</span>
          <span className="px-2.5 py-0.5 rounded bg-surface-2 border border-border text-acid font-bold">
            <TextSwap text={statusCycle[cycleIndex]} />
          </span>
        </div>

        {/* Product-as-Hero Cards Preview */}
        <div className="mt-14 w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {heroProjects.map((project) => (
            <TombstoneCard
              key={project.id}
              project={project}
              onTogglePin={(id) => dispatch({ type: 'TOGGLE_PIN', payload: { id } })}
            />
          ))}
        </div>

        {/* Real Store Metrics Strip */}
        <div className="mt-12 w-full grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-surface border border-border">
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-text">{totalBuried}</span>
            <span className="text-xs font-mono text-muted uppercase tracking-wider mt-1">Buried Projects</span>
          </div>
          <div className="flex flex-col items-center border-l border-border">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-acid">{resurrectingCount}</span>
            <span className="text-xs font-mono text-muted uppercase tracking-wider mt-1">Resurrecting</span>
          </div>
          <div className="flex flex-col items-center border-l border-border">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-violet-soft">{salvagedCount}</span>
            <span className="text-xs font-mono text-muted uppercase tracking-wider mt-1">Salvaged Parts</span>
          </div>
          <div className="flex flex-col items-center border-l border-border">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-amber">{avgScore}/100</span>
            <span className="text-xs font-mono text-muted uppercase tracking-wider mt-1">Avg Heuristic</span>
          </div>
        </div>
      </section>

      {/* Numbered Workflow Stages: 01 to 04 */}
      <section className="px-4 sm:px-8 py-16 max-w-7xl mx-auto border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono uppercase tracking-widest text-violet-soft">
            The Resuscitation Protocol
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text mt-2">
            From Abandoned Code to Shipped MVP
          </h2>
          <p className="text-sm text-muted mt-3">
            A structured four-step post-mortem method tuned for engineering clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Stage 01 */}
          <div className="p-6 rounded-2xl bg-surface border border-border relative overflow-hidden group hover:border-violet/50 transition-colors">
            <span className="font-mono text-4xl font-black text-border group-hover:text-violet/30 transition-colors">
              01
            </span>
            <h3 className="font-mono text-lg font-bold text-text mt-3">Intake & Burial</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Deposit your repository into the crypt. Record stack tags, completion percentage, and last active date.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-violet-soft">
              <Skull size={13} /> Status: Deceased
            </div>
          </div>

          {/* Stage 02 */}
          <div className="p-6 rounded-2xl bg-surface border border-border relative overflow-hidden group hover:border-acid/50 transition-colors">
            <span className="font-mono text-4xl font-black text-border group-hover:text-acid/30 transition-colors">
              02
            </span>
            <h3 className="font-mono text-lg font-bold text-text mt-3">The Autopsy</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Diagnose what was built, what broke, and why momentum died. Six objective factors feed the Resurrection Score.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-acid">
              <Activity size={13} /> Rule-Based Heuristic
            </div>
          </div>

          {/* Stage 03 */}
          <div className="p-6 rounded-2xl bg-surface border border-border relative overflow-hidden group hover:border-amber/50 transition-colors">
            <span className="font-mono text-4xl font-black text-border group-hover:text-amber/30 transition-colors">
              03
            </span>
            <h3 className="font-mono text-lg font-bold text-text mt-3">The Decision</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Choose one of four explicit paths: Phoenix Sprint, Pivot Path, Component Salvage, or Peaceful Archive.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-amber">
              <Flame size={13} /> 4 Strategic Options
            </div>
          </div>

          {/* Stage 04 */}
          <div className="p-6 rounded-2xl bg-surface border border-border relative overflow-hidden group hover:border-violet-soft/50 transition-colors">
            <span className="font-mono text-4xl font-black text-border group-hover:text-violet-soft/30 transition-colors">
              04
            </span>
            <h3 className="font-mono text-lg font-bold text-text mt-3">Harvest & Ship</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Extract battle-tested components into your personal Salvage Market or execute a tight 72-hour Phoenix sprint.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-violet-soft">
              <Wrench size={13} /> Reusable Snippets
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Modules Grid */}
      <section className="px-4 sm:px-8 py-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => navigate('/vault')}
            className="cursor-pointer p-8 rounded-2xl bg-surface border border-border hover:border-acid/60 hover:bg-surface-2 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-acid mb-4 group-hover:scale-110 transition-transform">
              <Layers size={20} />
            </div>
            <h3 className="font-mono text-xl font-bold text-text group-hover:text-acid transition-colors">
              Necropolis Vault
            </h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Searchable, filterable directory of all your stalled codebases with tombstone cards, completion meters, and instant autopsy triggers.
            </p>
          </div>

          <div
            onClick={() => navigate('/salvage')}
            className="cursor-pointer p-8 rounded-2xl bg-surface border border-border hover:border-violet/60 hover:bg-surface-2 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-violet-soft mb-4 group-hover:scale-110 transition-transform">
              <Wrench size={20} />
            </div>
            <h3 className="font-mono text-xl font-bold text-text group-hover:text-violet-soft transition-colors">
              Component Salvage Market
            </h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              A private local library of extracted auth middlewares, webhook idempotency locks, SQL schemas, and UI components ready to copy.
            </p>
          </div>

          <div
            onClick={() => navigate('/roadmap')}
            className="cursor-pointer p-8 rounded-2xl bg-surface border border-border hover:border-amber/60 hover:bg-surface-2 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-amber mb-4 group-hover:scale-110 transition-transform">
              <Terminal size={20} />
            </div>
            <h3 className="font-mono text-xl font-bold text-text group-hover:text-amber transition-colors">
              Lifecycle Roadmap
            </h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              An honest, append-only chronological log tracing every action from initial burial, autopsy calculation, and sprint task completions.
            </p>
          </div>

          <div
            onClick={() => navigate('/vault')}
            className="cursor-pointer p-8 rounded-2xl bg-surface border border-border hover:border-acid/60 hover:bg-surface-2 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-acid mb-4 group-hover:scale-110 transition-transform">
              <Sparkles size={20} />
            </div>
            <h3 className="font-mono text-xl font-bold text-text group-hover:text-acid transition-colors">
              The Graveyard Oracle
            </h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Rule-based conversational queries directly against your local graveyard database. Ask which project to revive, analyze stall reasons, and compare candidates.
            </p>
          </div>
        </div>
      </section>

      {/* Closing CTA & Serif Epitaph */}
      <section className="px-4 sm:px-8 py-20 max-w-4xl mx-auto text-center border-t border-border">
        <blockquote className="font-epitaph text-2xl sm:text-3xl text-text/80 mb-6 tracking-wide">
          &ldquo;Here lies what we built in the dark of night. Not forgotten, merely waiting for the spark.&rdquo;
        </blockquote>

        <p className="text-xs font-mono text-muted mb-8">
          The Project Graveyard &bull; Client-Side Browser Storage &bull; No Tracking
        </p>

        <Button
          onClick={() => setBuryOpen(true)}
          className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold px-6 py-5 rounded-xl shadow-[0_0_20px_rgba(182,255,60,0.2)]"
        >
          <Skull size={16} className="mr-2" />
          Bury Your First Project
        </Button>
      </section>

      {/* Bury Project Dialog */}
      <BuryProjectDialog open={buryOpen} onOpenChange={setBuryOpen} />
    </div>
  );
};
