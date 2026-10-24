import React, { useState } from 'react';
import { TextSwap } from '@/components/motion/TextSwap';
import { SuccessCheck } from '@/components/motion/SuccessCheck';
import { useShake } from '@/components/motion/useShake';
import { HauntButton } from '@/components/motion/HauntButton';
import { MatrixLoader } from '@/components/motion/MatrixLoader';
import { ThinkingStates } from '@/components/motion/ThinkingStates';
import { StreamingText } from '@/components/motion/StreamingText';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skull, Flame, Wrench, PauseCircle } from 'lucide-react';

export const StyleguidePage: React.FC = () => {
  const [swapWord, setSwapWord] = useState('DECEASED');
  const [isHaunted, setIsHaunted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [streamingKey, setStreamingKey] = useState(0);

  const { shakeClass, triggerShake } = useShake();

  const colors = [
    { name: '--bg', hex: '#0A0D12', desc: 'Main dark slate background' },
    { name: '--surface', hex: '#11161D', desc: 'Cards, crypt containers' },
    { name: '--surface-2', hex: '#171E27', desc: 'Raised panels, hovers' },
    { name: '--border', hex: '#232C38', desc: 'Hairlines, separators' },
    { name: '--text', hex: '#E6EAF0', desc: 'High-contrast text' },
    { name: '--muted', hex: '#8A96A7', desc: 'Secondary metadata' },
    { name: '--violet', hex: '#8B5CF6', desc: 'Primary accent glow' },
    { name: '--violet-soft', hex: '#A78BFA', desc: 'Soft purple highlight' },
    { name: '--acid', hex: '#B6FF3C', desc: 'Active/Resurrecting green' },
    { name: '--amber', hex: '#FFB224', desc: 'Warning/Stasis amber' },
    { name: '--danger', hex: '#FF5C7A', desc: 'Error/Delete red' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div>
        <h1 className="font-display text-3xl font-bold text-text">
          Cyberpunk Crypt Design System &amp; Motion Map
        </h1>
        <p className="font-mono text-xs text-muted mt-1">
          Verification page for design brief tokens, font pairing, and transitions.dev effects.
        </p>
      </div>

      {/* 1. Color Palette Tokens */}
      <section className="space-y-4">
        <h2 className="font-mono text-xl font-bold text-text">01. Color Palette Tokens</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {colors.map((c) => (
            <div key={c.name} className="p-4 rounded-xl border border-border bg-surface">
              <div
                className="w-full h-12 rounded-lg border border-border mb-3"
                style={{ backgroundColor: c.hex }}
              />
              <span className="font-mono text-xs font-bold text-text block">{c.name}</span>
              <span className="font-mono text-[11px] text-muted">{c.hex}</span>
              <p className="text-[11px] text-muted/80 mt-1">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Typography Scale */}
      <section className="space-y-4">
        <h2 className="font-mono text-xl font-bold text-text">02. Typography &amp; Font Pairing</h2>
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
          <div>
            <span className="font-mono text-xs text-muted uppercase block">
              Headings: JetBrains Mono Variable
            </span>
            <h1 className="font-display text-4xl font-extrabold text-text mt-1">
              Display Title: The Project Graveyard
            </h1>
            <h2 className="font-display text-2xl font-bold text-text mt-2">
              Section Header: Resurrection Engine
            </h2>
          </div>

          <div>
            <span className="font-mono text-xs text-muted uppercase block">
              Body &amp; UI: Inter Variable
            </span>
            <p className="font-sans text-sm text-text/90 max-w-2xl mt-1 leading-relaxed">
              Every project buried in the catacombs receives an autopsy. Our heuristic calculates whether revival is practical within a 72-hour Phoenix sprint, or if useful components should be salvaged into your local market.
            </p>
          </div>

          <div>
            <span className="font-mono text-xs text-muted uppercase block">
              Accent / Epitaphs: Instrument Serif Italic
            </span>
            <blockquote className="font-epitaph text-2xl text-text/80 mt-1">
              &ldquo;Here lies our weekend hackathon repo. A valiant attempt at greatness.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* 3. Status Badges */}
      <section className="space-y-4">
        <h2 className="font-mono text-xl font-bold text-text">03. Project Status Chips</h2>
        <div className="flex flex-wrap gap-4 p-6 rounded-2xl bg-surface border border-border">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1 rounded-full border border-violet/40 text-violet-soft bg-violet/10">
            <Skull size={14} /> Deceased
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1 rounded-full border border-amber/40 text-amber bg-amber/10">
            <PauseCircle size={14} /> In Stasis
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1 rounded-full border border-acid/40 text-acid bg-acid/10 shadow-[0_0_10px_rgba(182,255,60,0.25)]">
            <Flame size={14} /> Resurrecting
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1 rounded-full border border-violet/40 text-violet bg-violet/10">
            <Wrench size={14} /> Salvaged
          </span>
        </div>
      </section>

      {/* 4. Motion & Transitions Showcase */}
      <section className="space-y-4">
        <h2 className="font-mono text-xl font-bold text-text">04. Motion Transitions Verification</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Text States Swap */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-sm font-bold text-text">Text States Swap</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setSwapWord((w) =>
                    w === 'DECEASED' ? 'AUTOPSIED' : w === 'AUTOPSIED' ? 'RESURRECTING' : 'DECEASED'
                  )
                }
                className="font-mono text-xs"
              >
                Swap Text
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-surface-2 text-center">
              <span className="font-mono text-lg font-bold text-acid">
                <TextSwap text={swapWord} />
              </span>
            </div>
          </div>

          {/* Success Checkmark Pop */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-sm font-bold text-text">Success Check Drawing</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowSuccess(false);
                  setTimeout(() => setShowSuccess(true), 100);
                }}
                className="font-mono text-xs"
              >
                Replay Animation
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-surface-2 flex items-center justify-center min-h-[60px]">
              {showSuccess ? <SuccessCheck size={48} /> : <span className="font-mono text-xs text-muted">Click Replay</span>}
            </div>
          </div>

          {/* Error State Shake */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-sm font-bold text-text">Error State Shake</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={triggerShake}
                className="font-mono text-xs text-danger"
              >
                Trigger Shake
              </Button>
            </div>
            <Input
              readOnly
              value="Invalid format detected"
              className={`bg-surface-2 border-border text-text font-mono text-xs ${shakeClass}`}
            />
          </div>

          {/* Haunt Button with Particles */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-sm font-bold text-text">Haunt Toggle (Like Button Variant)</h3>
              <span className="font-mono text-xs text-muted">Click the ghost button:</span>
            </div>
            <div className="p-4 rounded-lg bg-surface-2 flex items-center justify-center">
              <HauntButton
                isHaunted={isHaunted}
                onToggle={() => setIsHaunted(!isHaunted)}
                count={isHaunted ? 42 : 41}
              />
            </div>
          </div>

          {/* Matrix Dot Loader */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
            <h3 className="font-mono text-sm font-bold text-text">Matrix Dot Loader (Original Effect)</h3>
            <p className="text-xs text-muted font-mono">4x4 matrix pulsing in rhythmic cybernetic waves</p>
            <div className="p-4 rounded-lg bg-surface-2 flex items-center justify-center">
              <MatrixLoader />
            </div>
          </div>

          {/* Thinking States */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
            <h3 className="font-mono text-sm font-bold text-text">Thinking States Shimmer</h3>
            <p className="text-xs text-muted font-mono">Status line shimmers and cycles during long computations</p>
            <div className="p-4 rounded-lg bg-surface-2 flex items-center justify-center">
              <ThinkingStates intervalMs={2000} />
            </div>
          </div>

          {/* Streaming Text */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-3 md:col-span-2">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-sm font-bold text-text">Streaming Text Blur-Crossfade</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStreamingKey((k) => k + 1)}
                className="font-mono text-xs"
              >
                Replay Stream
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-surface-2 font-mono text-xs text-text min-h-[60px]">
              <StreamingText
                key={streamingKey}
                text="The Oracle inspects the tombstones, compiles the post-mortem telemetry, and generates a deterministic revival prognosis."
                speedMs={35}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
