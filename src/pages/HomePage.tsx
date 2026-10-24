import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown, Layers, Activity, Flame, Wrench, Shield, GitBranch, AlertOctagon } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative overflow-hidden selection:bg-violet-900/40">
      {/* SECTION A: Hero */}
      <section className="relative px-4 sm:px-8 pt-16 pb-24 max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-2 border border-border text-xs font-mono text-muted mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-acid animate-pulse" />
          <span>Local Engine &bull; Zero Cloud &bull; Heuristic Diagnostics</span>
        </div>

        {/* Display Headline */}
        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-text max-w-4xl leading-[1.08]">
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
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={() => navigate('/vault')}
            className="bg-acid text-bg hover:bg-acid/90 font-mono text-sm font-bold px-7 py-6 rounded-xl shadow-[0_0_24px_rgba(182,255,60,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Open the Vault
            <ArrowRight size={18} className="ml-2" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={scrollToHowItWorks}
            className="border-border text-text hover:bg-surface-2 font-mono text-sm px-7 py-6 rounded-xl transition-all"
          >
            See how it works
            <ChevronDown size={18} className="ml-2 text-muted" />
          </Button>
        </div>
      </section>

      {/* Decorative Fence-Line Divider */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-900/40 to-transparent border-t border-dashed border-violet-950/60" />
      </div>

      {/* SECTION B: How It Works (Four-stage workflow from SPEC.md) */}
      <section id="how-it-works" className="px-4 sm:px-8 py-24 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-violet-soft">
            The Resuscitation Protocol
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text mt-2">
            How It Works
          </h2>
          <p className="text-sm text-muted mt-3 font-sans">
            A structured four-step post-mortem method tuned for engineering clarity.
          </p>
        </div>

        {/* 4 Steps with Connector Line */}
        <div className="relative">
          {/* Desktop horizontal connector line */}
          <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-[1px] bg-gradient-to-r from-violet-950 via-violet-800/40 to-violet-950 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {/* Step 01 */}
            <div className="flex flex-col items-center text-center p-6 rounded-t-2xl rounded-b-md bg-surface border border-border hover:border-violet-soft/40 transition-colors">
              <div className="w-12 h-12 rounded-full bg-surface-2 border border-violet-soft/30 flex items-center justify-center font-mono text-sm font-bold text-violet-soft mb-5 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
                01
              </div>
              <h3 className="font-mono text-base font-bold text-text mb-2">Bury</h3>
              <p className="text-xs text-muted leading-relaxed">
                Deposit your stalled repository into the crypt with its stack tags, completion level, and last active timestamp.
              </p>
            </div>

            {/* Step 02 */}
            <div className="flex flex-col items-center text-center p-6 rounded-t-2xl rounded-b-md bg-surface border border-border hover:border-acid/40 transition-colors">
              <div className="w-12 h-12 rounded-full bg-surface-2 border border-acid/30 flex items-center justify-center font-mono text-sm font-bold text-acid mb-5 shadow-[0_0_12px_rgba(182,255,60,0.15)]">
                02
              </div>
              <h3 className="font-mono text-base font-bold text-text mb-2">Autopsy</h3>
              <p className="text-xs text-muted leading-relaxed">
                Diagnose why momentum stalled across six objective factors to calculate your heuristic 0–100 Resurrection Score.
              </p>
            </div>

            {/* Step 03 */}
            <div className="flex flex-col items-center text-center p-6 rounded-t-2xl rounded-b-md bg-surface border border-border hover:border-amber/40 transition-colors">
              <div className="w-12 h-12 rounded-full bg-surface-2 border border-amber/30 flex items-center justify-center font-mono text-sm font-bold text-amber mb-5 shadow-[0_0_12px_rgba(251,191,36,0.15)]">
                03
              </div>
              <h3 className="font-mono text-base font-bold text-text mb-2">Decide</h3>
              <p className="text-xs text-muted leading-relaxed">
                Commit to an explicit path: launch a 72-hour Phoenix sprint, pivot scope, harvest components, or peacefully archive.
              </p>
            </div>

            {/* Step 04 */}
            <div className="flex flex-col items-center text-center p-6 rounded-t-2xl rounded-b-md bg-surface border border-border hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-full bg-surface-2 border border-emerald-500/30 flex items-center justify-center font-mono text-sm font-bold text-emerald-400 mb-5 shadow-[0_0_12px_rgba(52,211,153,0.15)]">
                04
              </div>
              <h3 className="font-mono text-base font-bold text-text mb-2">Harvest</h3>
              <p className="text-xs text-muted leading-relaxed">
                Extract tested auth middlewares, SQL schemas, and UI components into your private market or ship the focused MVP.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Fence-Line Divider */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-900/40 to-transparent border-t border-dashed border-violet-950/60" />
      </div>

      {/* SECTION C: Problem (Three Short Cards) */}
      <section className="px-4 sm:px-8 py-24 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-amber">
            The Stagnation Cycle
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text mt-2">
            Why Abandoned Projects Fester
          </h2>
          <p className="text-sm text-muted mt-3 font-sans">
            Side projects rarely fail because the idea was bad. They stall from friction and lack of diagnostic closure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Problem Card 1 */}
          <div className="p-7 rounded-t-2xl rounded-b-md bg-surface border border-border relative flex flex-col justify-between hover:border-amber/50 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-amber mb-5">
                <AlertOctagon size={20} />
              </div>
              <h3 className="font-mono text-lg font-bold text-text mb-3">The Scrap Trap</h3>
              <p className="text-xs text-muted leading-relaxed">
                When developers stall, they tend to abandon the entire repository. Handcrafted database schemas, webhook idempotency handlers, and clean API wrappers are thrown away with the idea.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60 text-[11px] font-mono text-muted">
              Loss: Reusable engineering primitives
            </div>
          </div>

          {/* Problem Card 2 */}
          <div className="p-7 rounded-t-2xl rounded-b-md bg-surface border border-border relative flex flex-col justify-between hover:border-violet-soft/50 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-violet-soft mb-5">
                <GitBranch size={20} />
              </div>
              <h3 className="font-mono text-lg font-bold text-text mb-3">Missing Diagnostics</h3>
              <p className="text-xs text-muted leading-relaxed">
                Without a post-mortem examining whether momentum died from exhaustion, runaway scope, or technical roadblocks, developers repeat the exact same trap on their next weekend repo.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60 text-[11px] font-mono text-muted">
              Loss: Retrospective pattern clarity
            </div>
          </div>

          {/* Problem Card 3 */}
          <div className="p-7 rounded-t-2xl rounded-b-md bg-surface border border-border relative flex flex-col justify-between hover:border-acid/50 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-acid mb-5">
                <Shield size={20} />
              </div>
              <h3 className="font-mono text-lg font-bold text-text mb-3">The Ghost Repo Problem</h3>
              <p className="text-xs text-muted leading-relaxed">
                Dozens of half-built repositories linger in local directories and GitHub accounts as chronic guilt. Without an archive verdict, they remain indefinitely unresolved.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60 text-[11px] font-mono text-muted">
              Loss: Psychological bandwidth
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Fence-Line Divider */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-900/40 to-transparent border-t border-dashed border-violet-950/60" />
      </div>

      {/* SECTION D: Single Preview Tombstone Card Centerpiece */}
      <section className="px-4 sm:px-8 py-24 max-w-4xl mx-auto flex flex-col items-center text-center">
        <span className="text-xs font-mono uppercase tracking-widest text-violet-soft mb-2">
          Centerpiece Preview
        </span>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-text mb-4">
          The Anatomy of a Buried Codebase
        </h2>
        <p className="text-sm text-muted max-w-xl font-sans mb-12">
          Every project in the crypt receives an arched tombstone card displaying its heuristic revival odds, completion meter, and diagnostic status.
        </p>

        {/* Centerpiece Tombstone Card */}
        <div className="w-full max-w-md text-left rounded-t-3xl rounded-b-lg bg-surface border border-violet-soft/40 shadow-[0_0_40px_rgba(168,85,247,0.12)] p-7 space-y-6 relative overflow-hidden">
          {/* Subtle top arch glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent blur-sm" />

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-violet/20 border border-violet/40 text-violet-soft">
                  Resurrecting
                </span>
                <span className="text-xs font-mono text-muted">Worker / Queue</span>
              </div>
              <h3 className="font-mono text-2xl font-bold text-text mt-2">email-worker</h3>
            </div>

            {/* Score Ring / Pill */}
            <div className="flex flex-col items-end">
              <span className="font-mono text-3xl font-extrabold text-acid">92</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted">Score / 100</span>
            </div>
          </div>

          <p className="text-xs text-muted/90 font-sans leading-relaxed">
            Lightweight transactional email background queue with retries and dead-letter handling. Stalled on provider webhooks.
          </p>

          {/* Completion Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted">Completion Level</span>
              <span className="text-text font-bold">84%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden border border-border">
              <div className="h-full bg-gradient-to-r from-violet to-acid w-[84%]" />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {['TypeScript', 'BullMQ', 'Redis', 'Postmark'].map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-2 border border-border text-muted">
                {tag}
              </span>
            ))}
          </div>

          {/* Epitaph Quote */}
          <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border/80 text-xs italic font-serif text-text/80">
            &ldquo;Ready for 72-hour Phoenix Protocol sprint. 4 harvestable components ready.&rdquo;
          </div>
        </div>
      </section>

      {/* Decorative Fence-Line Divider */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-900/40 to-transparent border-t border-dashed border-violet-950/60" />
      </div>

      {/* SECTION E: Compact Row of 4 Feature Teasers (No functional UI) */}
      <section className="px-4 sm:px-8 py-24 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-violet-soft">
            The Crypt Toolset
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text mt-2">
            Dedicated Workspaces
          </h2>
          <p className="text-sm text-muted mt-3 font-sans">
            Every feature lives on its own dedicated route inside your local dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Teaser 1: Vault */}
          <div
            onClick={() => navigate('/vault')}
            className="cursor-pointer p-6 rounded-t-2xl rounded-b-md bg-surface border border-border hover:border-acid/60 hover:bg-surface-2 transition-all group flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-acid mb-4 group-hover:scale-105 transition-transform">
                <Layers size={18} />
              </div>
              <h3 className="font-mono text-base font-bold text-text group-hover:text-acid transition-colors">
                Necropolis Vault
              </h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Catalog and filter your stalled codebases with tombstone cards, completion meters, and status tags.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-acid pt-3 border-t border-border">
              <span>Enter Vault</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Teaser 2: Autopsy */}
          <div
            onClick={() => navigate('/autopsy')}
            className="cursor-pointer p-6 rounded-t-2xl rounded-b-md bg-surface border border-border hover:border-violet-soft/60 hover:bg-surface-2 transition-all group flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-violet-soft mb-4 group-hover:scale-105 transition-transform">
                <Activity size={18} />
              </div>
              <h3 className="font-mono text-base font-bold text-text group-hover:text-violet-soft transition-colors">
                The Autopsy Suite
              </h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Run rule-based heuristic diagnoses to compute the 0–100 Resurrection Score and reveal failure modes.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-violet-soft pt-3 border-t border-border">
              <span>View Diagnostics</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Teaser 3: Engine */}
          <div
            onClick={() => navigate('/engine')}
            className="cursor-pointer p-6 rounded-t-2xl rounded-b-md bg-surface border border-border hover:border-amber/60 hover:bg-surface-2 transition-all group flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-amber mb-4 group-hover:scale-105 transition-transform">
                <Flame size={18} />
              </div>
              <h3 className="font-mono text-base font-bold text-text group-hover:text-amber transition-colors">
                Resurrection Engine
              </h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Execute a 72-hour Phoenix sprint, formulate a structured pivot, or commit to a peaceful archive.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-amber pt-3 border-t border-border">
              <span>Launch Engine</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Teaser 4: Salvage Market */}
          <div
            onClick={() => navigate('/market')}
            className="cursor-pointer p-6 rounded-t-2xl rounded-b-md bg-surface border border-border hover:border-emerald-400/60 hover:bg-surface-2 transition-all group flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <Wrench size={18} />
              </div>
              <h3 className="font-mono text-base font-bold text-text group-hover:text-emerald-400 transition-colors">
                Salvage Market
              </h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                A private local library of extracted auth middlewares, SQL schemas, and UI blocks ready to copy.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-emerald-400 pt-3 border-t border-border">
              <span>Browse Parts</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Fence-Line Divider */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-900/40 to-transparent border-t border-dashed border-violet-950/60" />
      </div>

      {/* SECTION F: Closing Call to Action & Footer */}
      <section className="px-4 sm:px-8 pt-20 pb-16 max-w-4xl mx-auto text-center">
        <blockquote className="font-serif text-2xl sm:text-3xl text-text/80 mb-6 tracking-wide leading-relaxed">
          &ldquo;Here lies what we built in the dark of night. Not forgotten, merely waiting for the spark.&rdquo;
        </blockquote>

        <p className="text-xs font-mono text-muted mb-8">
          The Project Graveyard &bull; Private Client-Side Browser Storage &bull; Zero External Telemetry
        </p>

        <Button
          size="lg"
          onClick={() => navigate('/vault')}
          className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold px-7 py-6 rounded-xl shadow-[0_0_24px_rgba(182,255,60,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Open the Vault
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center text-xs font-mono text-muted/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Project Graveyard &bull; Team Code_Cartel PS05</span>
          <span>100% Local Heuristic Diagnostics &bull; No Hosted Cloud AI</span>
        </div>
      </footer>
    </div>
  );
};
