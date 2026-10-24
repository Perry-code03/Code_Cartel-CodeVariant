import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, useProject } from '@/store/StoreProvider';
import { StopCategory, Rating, AutopsySuggestion } from '@/types';
import { computeResurrectionScore, ScoreResult } from '@/lib/score';
import { recommendRevivalPath, suggestStopCategory } from '@/lib/recommend';
import { validateAutopsy } from '@/lib/validation';
import { suggestAutopsy } from '@/lib/api';
import { useShake } from '@/components/motion/useShake';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Flame,
  Wrench,
  Archive,
  Compass,
  AlertCircle,
  Sparkles,
  X,
  Check,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const AutopsyWizardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const { project } = useProject(id);

  // Stepper state: 1, 2, 3, 4, 5 (review), 6 (result)
  const [step, setStep] = useState(1);
  const [isComputing, setIsComputing] = useState(false);

  // Form Fields
  const [whatWasBuilt, setWhatWasBuilt] = useState('');
  const [whatBroke, setWhatBroke] = useState('');
  const [whyStopped, setWhyStopped] = useState('');
  const [stopCategory, setStopCategory] = useState<StopCategory>('burnout');
  const [willingness, setWillingness] = useState<Rating>(3);
  const [usefulComponents, setUsefulComponents] = useState<string>('3');
  const [hoursAvailable, setHoursAvailable] = useState<string>('12');
  const [scopeClarity, setScopeClarity] = useState<string>('3');
  const [blockerSeverity, setBlockerSeverity] = useState<string>('3');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [computedResult, setComputedResult] = useState<ScoreResult | null>(null);
  const { shakeClass, triggerShake } = useShake();

  // AI Diagnostic Suggestions
  const [suggestion, setSuggestion] = useState<AutopsySuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const handleFetchAiSuggestions = async () => {
    if (!project || isAnalyzing) return;
    setIsAnalyzing(true);
    setAppliedNotice(null);
    try {
      const res = await suggestAutopsy({
        name: project.name,
        description: project.description,
        stack: project.stack,
        category: project.category,
        completion: project.completion,
        lastActiveAt: project.lastActiveAt,
        createdAt: project.createdAt,
        repoUrl: (project as { repoUrl?: string }).repoUrl,
        whatWasBuilt: whatWasBuilt.trim() || undefined,
      });
      setSuggestion(res);
    } catch {
      // Handled in api.ts
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplySuggestions = () => {
    if (!suggestion) return;
    if (suggestion.whatWasBuilt && suggestion.whatWasBuilt.trim()) {
      setWhatWasBuilt(suggestion.whatWasBuilt);
    }
    if (
      suggestion.whatBroke &&
      suggestion.whatBroke.trim() &&
      !suggestion.whatBroke.toLowerCase().includes('not enough information')
    ) {
      setWhatBroke(suggestion.whatBroke);
    }
    // Scoring fields and personal reasons are NEVER pre-filled by AI
    setSuggestion(null);
    setAppliedNotice(
      'Evidence-based suggestions applied to form. Scoring and personal reflection fields remain for your direct input.'
    );
  };

  // Load existing autopsy if present
  useEffect(() => {
    if (project?.autopsy) {
      setWhatWasBuilt(project.autopsy.whatWasBuilt);
      setWhatBroke(project.autopsy.whatBroke);
      setWhyStopped(project.autopsy.whyStopped);
      setStopCategory(project.autopsy.stopCategory);
      setWillingness(project.autopsy.willingness);
      setUsefulComponents(
        project.autopsy.usefulComponents !== undefined
          ? String(project.autopsy.usefulComponents)
          : ''
      );
      setHoursAvailable(
        project.autopsy.hoursAvailable !== undefined
          ? String(project.autopsy.hoursAvailable)
          : ''
      );
      setScopeClarity(
        project.autopsy.scopeClarity !== undefined
          ? String(project.autopsy.scopeClarity)
          : ''
      );
      setBlockerSeverity(
        project.autopsy.blockerSeverity !== undefined
          ? String(project.autopsy.blockerSeverity)
          : ''
      );
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

  // Suggest stop category keyword suggestion
  const keywordSuggestion = suggestStopCategory(whyStopped);

  const handleNextStep = () => {
    setErrors({});
    if (step === 1) {
      if (whatWasBuilt.trim().length < 10) {
        setErrors({ whatWasBuilt: 'Please describe what was built (minimum 10 characters).' });
        triggerShake();
        return;
      }
    }
    if (step === 2) {
      if (whatBroke.trim().length < 10) {
        setErrors({ whatBroke: 'Please describe what broke (minimum 10 characters).' });
        triggerShake();
        return;
      }
    }
    if (step === 3) {
      if (whyStopped.trim().length < 10) {
        setErrors({ whyStopped: 'Please describe why momentum died (minimum 10 characters).' });
        triggerShake();
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleExecuteAutopsy = () => {
    const autopsyErrors = validateAutopsy({
      whatWasBuilt,
      whatBroke,
      whyStopped,
      stopCategory,
      willingness,
      usefulComponents: usefulComponents ? Number(usefulComponents) : null,
      hoursAvailable: hoursAvailable ? Number(hoursAvailable) : null,
      scopeClarity: scopeClarity ? Number(scopeClarity) : null,
      blockerSeverity: blockerSeverity ? Number(blockerSeverity) : null,
    });

    if (Object.keys(autopsyErrors).length > 0) {
      setErrors(autopsyErrors);
      triggerShake();
      return;
    }

    setIsComputing(true);

    setTimeout(() => {
      const result = computeResurrectionScore({
        completion: project.completion,
        willingness,
        usefulComponents: usefulComponents ? Number(usefulComponents) : null,
        hoursAvailable: hoursAvailable ? Number(hoursAvailable) : null,
        scopeClarity: scopeClarity ? (Number(scopeClarity) as Rating) : null,
        blockerSeverity: blockerSeverity ? (Number(blockerSeverity) as Rating) : null,
      });

      setComputedResult(result);

      // Save autopsy to state store
      dispatch({
        type: 'SAVE_AUTOPSY',
        payload: {
          projectId: project.id,
          autopsyData: {
            whatWasBuilt: whatWasBuilt.trim(),
            whatBroke: whatBroke.trim(),
            whyStopped: whyStopped.trim(),
            stopCategory,
            willingness,
            usefulComponents: usefulComponents ? Number(usefulComponents) : undefined,
            hoursAvailable: hoursAvailable ? Number(hoursAvailable) : undefined,
            scopeClarity: scopeClarity ? (Number(scopeClarity) as Rating) : undefined,
            blockerSeverity: blockerSeverity ? (Number(blockerSeverity) as Rating) : undefined,
          },
        },
      });

      setIsComputing(false);
      setStep(6);
    }, 750);
  };

  const recommendation = computedResult
    ? recommendRevivalPath({
        score: computedResult.score,
        willingness,
        stopCategory,
        usefulComponents: usefulComponents ? Number(usefulComponents) : 0,
        hoursAvailable: hoursAvailable ? Number(hoursAvailable) : undefined,
        scopeClarity: scopeClarity ? (Number(scopeClarity) as Rating) : undefined,
        blockerSeverity: blockerSeverity ? (Number(blockerSeverity) as Rating) : undefined,
      })
    : null;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <button
          type="button"
          onClick={() => navigate(`/project/${project.id}`)}
          className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-text"
        >
          <ArrowLeft size={14} /> Back to {project.name}
        </button>

        <span className="font-mono text-xs text-acid bg-acid/10 px-2 py-0.5 rounded border border-acid/30">
          Autopsy Wizard: Stage {step} of 5
        </span>
      </div>

      {/* Wizard Progress Rail */}
      {step < 6 && (
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-acid shadow-[0_0_8px_rgba(182,255,60,0.4)]' : 'bg-surface-2 border border-border'
              }`}
            />
          ))}
        </div>
      )}

      {/* AI Diagnostic Assist Card / Active Suggestion */}
      {step < 5 && (
        <div className="space-y-3">
          {appliedNotice && (
            <div className="p-3 rounded-xl bg-acid/10 border border-acid/30 text-acid text-xs font-mono flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check size={14} className="shrink-0" />
                <span>{appliedNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setAppliedNotice(null)}
                className="text-muted hover:text-text p-1"
                aria-label="Dismiss notice"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {suggestion ? (
            <div className="p-5 rounded-2xl bg-surface border border-violet/40 shadow-lg space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                <div className="flex items-center gap-1.5 text-violet-soft">
                  <Sparkles size={15} />
                  <span className="font-bold">
                    {suggestion.source === 'ai'
                      ? `Suggested by AI (${suggestion.aiProviderName || 'AI'}), please review`
                      : 'Repository Activity Facts'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuggestion(null)}
                  className="text-muted hover:text-text p-1 rounded hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet"
                  aria-label="Dismiss suggestion"
                >
                  <X size={15} />
                </button>
              </div>

              {suggestion.notice && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  {suggestion.notice}
                </div>
              )}

              {/* Activity facts box: Built by plain code (no AI) from real repository dates and markers */}
              {suggestion.activityFacts && suggestion.activityFacts.length > 0 && (
                <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-1.5">
                  <div className="flex items-center gap-1.5 text-muted font-bold">
                    <Clock size={13} className="text-acid" />
                    <span>Activity facts (from repository data):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-text pl-1 text-[11px]">
                    {suggestion.activityFacts.map((fact, idx) => (
                      <li key={idx}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Evidence-based Suggestions */}
              <div className="space-y-2.5 text-xs leading-relaxed">
                {suggestion.whatWasBuilt && (
                  <div className="p-2.5 rounded-lg bg-surface-2/60 border border-border">
                    <span className="text-muted font-bold block mb-0.5">Built Scope (from description / README):</span>
                    <span className="text-text">{suggestion.whatWasBuilt}</span>
                  </div>
                )}

                {suggestion.whatBroke ? (
                  <div className="p-2.5 rounded-lg bg-surface-2/60 border border-border">
                    <span className="text-muted font-bold block mb-0.5">What Broke (cited in repository text):</span>
                    <span className="text-text">{suggestion.whatBroke}</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-surface-2/40 border border-border/60 text-muted">
                    <span className="font-bold block mb-0.5">What Broke:</span>
                    <span className="italic">Not enough information in the repo (left empty for you to fill).</span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-muted pt-1 border-t border-border/50">
                Data sent to AI: project name, stack, category, and description/README excerpt. Personal reasons, motivations, and scoring metrics are never guessed by AI.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSuggestion(null)}
                  className="font-mono text-xs border-border text-muted hover:text-text"
                >
                  Dismiss
                </Button>
                <Button
                  type="button"
                  onClick={handleApplySuggestions}
                  className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold"
                >
                  Apply to Form
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-violet/10 border border-violet/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-violet/20 border border-violet/40 text-violet-soft shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-mono text-xs font-bold text-text flex items-center gap-1.5">
                    AI Post-Mortem Diagnostic Assist
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet/20 border border-violet/40 text-violet-soft">
                      OPT-IN
                    </span>
                  </h3>
                  <p className="text-[11px] font-mono text-muted mt-0.5">
                    Stuck diagnosing? Let AI inspect {project.name}&apos;s description and repository text for evidence-based findings.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleFetchAiSuggestions}
                disabled={isAnalyzing}
                className="bg-violet hover:bg-violet/90 text-white font-mono text-xs shrink-0 self-start sm:self-auto"
              >
                {isAnalyzing ? (
                  <>Inspecting Repository...</>
                ) : (
                  <>
                    <Sparkles size={13} className="mr-1.5" />
                    Auto-Suggest with AI
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 1: What Was Built */}
      {step === 1 && (
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="text-acid" size={20} />
            <h2 className="font-mono text-lg font-bold text-text">01. What Was Built?</h2>
          </div>
          <p className="text-xs text-muted font-sans">
            Inventory the features, database models, background queues, or frontend blocks that were actually completed before work paused.
          </p>

          <Textarea
            value={whatWasBuilt}
            onChange={(e) => setWhatWasBuilt(e.target.value)}
            rows={5}
            placeholder="e.g. Express server with JWT session verification, PostgreSQL schema for users, and basic sign-in form..."
            className={`bg-surface-2 border-border text-text font-mono text-xs ${
              errors.whatWasBuilt ? shakeClass : ''
            }`}
          />
          {errors.whatWasBuilt && (
            <p className="text-xs font-mono text-danger">{errors.whatWasBuilt}</p>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              onClick={handleNextStep}
              className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold"
            >
              Next: What Broke <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: What Broke */}
      {step === 2 && (
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-amber" size={20} />
              <h2 className="font-mono text-lg font-bold text-text">02. What Broke?</h2>
            </div>
            <button
              type="button"
              onClick={handleFetchAiSuggestions}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-violet/15 hover:bg-violet/25 text-violet-soft border border-violet/30 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet"
            >
              <Sparkles size={12} />
              {isAnalyzing ? 'Diagnosing...' : 'Suggest with AI'}
            </button>
          </div>
          <p className="text-xs text-muted font-sans">
            What was the point of friction? Was it a race condition, dependency deprecation, API schema mismatch, or performance bottleneck?
          </p>

          <Textarea
            value={whatBroke}
            onChange={(e) => setWhatBroke(e.target.value)}
            rows={5}
            placeholder="e.g. Race condition during token refresh requests caused intermittent 401s in clustered deployments..."
            className={`bg-surface-2 border-border text-text font-mono text-xs ${
              errors.whatBroke ? shakeClass : ''
            }`}
          />
          {errors.whatBroke && (
            <p className="text-xs font-mono text-danger">{errors.whatBroke}</p>
          )}

          <div className="flex justify-between pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="border-border text-text font-mono text-xs"
            >
              Back
            </Button>
            <Button
              onClick={handleNextStep}
              className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold"
            >
              Next: Why It Stopped <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Why Momentum Died */}
      {step === 3 && (
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="text-violet-soft" size={20} />
              <h2 className="font-mono text-lg font-bold text-text">03. Why Development Stopped</h2>
            </div>
            <span className="text-[11px] font-mono text-muted bg-surface-2 px-2 py-0.5 rounded border border-border">
              Personal reflection (user-written)
            </span>
          </div>
          <p className="text-xs text-muted font-sans">
            Be brutally honest. Was it personal burnout, shifting day-job priorities, scope creep, or lost enthusiasm? (This is your personal insight—never guessed by AI).
          </p>

          <Textarea
            value={whyStopped}
            onChange={(e) => setWhyStopped(e.target.value)}
            rows={4}
            placeholder="e.g. Got overwhelmed debugging Redis lock synchronization alone while handling full-time job deadlines..."
            className={`bg-surface-2 border-border text-text font-mono text-xs ${
              errors.whyStopped ? shakeClass : ''
            }`}
          />
          {errors.whyStopped && (
            <p className="text-xs font-mono text-danger">{errors.whyStopped}</p>
          )}

          {/* Stop Category Selection & Keyword Suggestion */}
          <div className="pt-2">
            <Label className="text-xs font-mono text-text">Primary Stop Category</Label>

            {keywordSuggestion.matchedKeyword && (
              <div className="my-2 p-2 rounded-lg bg-surface-2 border border-violet/30 flex items-center justify-between text-xs font-mono">
                <span className="text-muted">
                  Keyword detected: <span className="text-acid">&ldquo;{keywordSuggestion.matchedKeyword}&rdquo;</span> &rarr; suggested:{' '}
                  <span className="text-text font-bold uppercase">{keywordSuggestion.category}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setStopCategory(keywordSuggestion.category)}
                  className="px-2 py-0.5 rounded bg-violet/20 hover:bg-violet/30 text-violet-soft border border-violet/40"
                >
                  Accept Hint
                </button>
              </div>
            )}

            <Select
              value={stopCategory}
              onValueChange={(val) => setStopCategory(val as StopCategory)}
            >
              <SelectTrigger className="mt-1 bg-surface-2 border-border text-text font-mono text-xs">
                <SelectValue placeholder="Select stop category" />
              </SelectTrigger>
              <SelectContent className="bg-surface border-border text-text">
                <SelectItem value="burnout" className="font-mono text-xs">Burnout (Energy & Time Exhausted)</SelectItem>
                <SelectItem value="scope" className="font-mono text-xs">Scope Creep (Project Grew Out of Bounds)</SelectItem>
                <SelectItem value="priorities" className="font-mono text-xs">Shifting Priorities (New Ideas / Work Took Over)</SelectItem>
                <SelectItem value="technical" className="font-mono text-xs">Technical Blocker (Architecture Impasse)</SelectItem>
                <SelectItem value="other" className="font-mono text-xs">Other Cause</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="border-border text-text font-mono text-xs"
            >
              Back
            </Button>
            <Button
              onClick={handleNextStep}
              className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold"
            >
              Next: Revival Inputs <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Revival Heuristic Factors */}
      {step === 4 && (
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
          <div>
            <h2 className="font-mono text-lg font-bold text-text">04. Resuscitation Heuristic Inputs</h2>
            <p className="text-xs text-muted font-sans mt-1">
              Provide metrics to calculate your Resurrection Score (0–100). Completion and willingness are mandatory; other inputs are optional and rescaled without penalty if skipped.
            </p>
          </div>

          {/* Willingness Rating 1-5 (Required) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-surface-2/60 border border-border">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-text font-bold">
                1. Willingness to Continue (1–5) <span className="text-acid">*</span>
              </span>
              <span className="text-acid font-bold">{willingness} / 5</span>
            </div>
            <p className="text-[11px] text-muted font-sans">
              How excited and committed are you personally to see this project alive and shipped?
            </p>
            <div className="grid grid-cols-5 gap-2 pt-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setWillingness(rating as Rating)}
                  className={`py-2 rounded-lg font-mono text-xs border transition-colors ${
                    willingness === rating
                      ? 'bg-acid text-bg font-bold border-acid shadow-[0_0_8px_rgba(182,255,60,0.3)]'
                      : 'bg-surface border-border text-muted hover:text-text'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Factor: Useful Components Remaining (0-50) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-surface-2/60 border border-border">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-text">2. Salvageable Components Remaining (Optional)</span>
              {usefulComponents ? (
                <button
                  type="button"
                  onClick={() => setUsefulComponents('')}
                  className="text-xs text-danger hover:underline"
                >
                  Skip
                </button>
              ) : (
                <span className="text-muted text-[10px]">SKIPPED</span>
              )}
            </div>
            <Input
              type="number"
              min={0}
              max={50}
              value={usefulComponents}
              onChange={(e) => setUsefulComponents(e.target.value)}
              placeholder="e.g. 4 (Leave blank to skip)"
              className="bg-surface border-border text-text font-mono text-xs"
            />
          </div>

          {/* Optional Factor: Hours Available for Sprint (0-200) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-surface-2/60 border border-border">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-text">3. Available Sprint Hours (Optional, capped at 24h)</span>
              {hoursAvailable ? (
                <button
                  type="button"
                  onClick={() => setHoursAvailable('')}
                  className="text-xs text-danger hover:underline"
                >
                  Skip
                </button>
              ) : (
                <span className="text-muted text-[10px]">SKIPPED</span>
              )}
            </div>
            <Input
              type="number"
              min={0}
              max={200}
              value={hoursAvailable}
              onChange={(e) => setHoursAvailable(e.target.value)}
              placeholder="e.g. 20 (Leave blank to skip)"
              className="bg-surface border-border text-text font-mono text-xs"
            />
          </div>

          {/* Optional Factor: Scope Clarity (1-5) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-surface-2/60 border border-border">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-text">4. Scope Clarity (1–5, Optional)</span>
              {scopeClarity ? (
                <button
                  type="button"
                  onClick={() => setScopeClarity('')}
                  className="text-xs text-danger hover:underline"
                >
                  Skip
                </button>
              ) : (
                <span className="text-muted text-[10px]">SKIPPED</span>
              )}
            </div>
            <Input
              type="number"
              min={1}
              max={5}
              value={scopeClarity}
              onChange={(e) => setScopeClarity(e.target.value)}
              placeholder="1 to 5 (Leave blank to skip)"
              className="bg-surface border-border text-text font-mono text-xs"
            />
          </div>

          {/* Optional Factor: Blocker Severity (1-5, Inverse) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-surface-2/60 border border-border">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-text">5. Technical Blocker Severity (1 = none, 5 = severe)</span>
              {blockerSeverity ? (
                <button
                  type="button"
                  onClick={() => setBlockerSeverity('')}
                  className="text-xs text-danger hover:underline"
                >
                  Skip
                </button>
              ) : (
                <span className="text-muted text-[10px]">SKIPPED</span>
              )}
            </div>
            <Input
              type="number"
              min={1}
              max={5}
              value={blockerSeverity}
              onChange={(e) => setBlockerSeverity(e.target.value)}
              placeholder="1 to 5 (Leave blank to skip)"
              className="bg-surface border-border text-text font-mono text-xs"
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep(3)}
              className="border-border text-text font-mono text-xs"
            >
              Back
            </Button>
            <Button
              onClick={handleNextStep}
              className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold"
            >
              Review Autopsy <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Review Before Execution */}
      {step === 5 && (
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-lg font-bold text-text">05. Review Post-Mortem Answers</h2>
            <span className="text-xs font-mono text-acid bg-acid/10 px-2 py-0.5 rounded border border-acid/30">
              Ready to Compute
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-surface-2 border border-border flex justify-between items-start">
              <div>
                <span className="text-muted block text-[10px] uppercase">What Was Built</span>
                <p className="text-text mt-1 font-sans">{whatWasBuilt}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-violet-soft underline ml-4">
                Edit
              </button>
            </div>

            <div className="p-3 rounded-lg bg-surface-2 border border-border flex justify-between items-start">
              <div>
                <span className="text-muted block text-[10px] uppercase">What Broke</span>
                <p className="text-text mt-1 font-sans">{whatBroke}</p>
              </div>
              <button onClick={() => setStep(2)} className="text-violet-soft underline ml-4">
                Edit
              </button>
            </div>

            <div className="p-3 rounded-lg bg-surface-2 border border-border flex justify-between items-start">
              <div>
                <span className="text-muted block text-[10px] uppercase">
                  Why Work Stopped ({stopCategory.toUpperCase()})
                </span>
                <p className="text-text mt-1 font-sans">{whyStopped}</p>
              </div>
              <button onClick={() => setStep(3)} className="text-violet-soft underline ml-4">
                Edit
              </button>
            </div>

            <div className="p-3 rounded-lg bg-surface-2 border border-border flex justify-between items-start">
              <div>
                <span className="text-muted block text-[10px] uppercase">Revival Metrics</span>
                <p className="text-text mt-1">
                  Willingness: {willingness}/5 &bull; Components: {usefulComponents || 'Skipped'} &bull; Hours: {hoursAvailable || 'Skipped'} &bull; Scope: {scopeClarity || 'Skipped'} &bull; Blockers: {blockerSeverity || 'Skipped'}
                </p>
              </div>
              <button onClick={() => setStep(4)} className="text-violet-soft underline ml-4">
                Edit
              </button>
            </div>
          </div>

          {isComputing ? (
            <div className="py-6 text-center space-y-2">
              <span className="t-shimmer-text font-mono text-sm block">
                Performing autopsy and computing resurrection heuristic...
              </span>
              <p className="text-[10px] font-mono text-muted">
                Applying weighted normalization over answered factors
              </p>
            </div>
          ) : (
            <div className="flex justify-between pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setStep(4)}
                className="border-border text-text font-mono text-xs"
              >
                Back
              </Button>
              <Button
                onClick={handleExecuteAutopsy}
                className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold px-6 py-2 shadow-[0_0_16px_rgba(182,255,60,0.3)]"
              >
                Calculate Resurrection Score &rarr;
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 6: Autopsy Results and Score Reveal */}
      {step === 6 && computedResult && (
        <div className="space-y-6">
          {/* Main Score Banner */}
          <div className="p-8 rounded-2xl bg-surface border border-border text-center space-y-4 shadow-xl relative overflow-hidden">
            <span className="text-xs font-mono uppercase tracking-widest text-muted">
              Diagnostic Complete &bull; Rule-Based Heuristic (Not AI)
            </span>

            <div className="flex flex-col items-center justify-center">
              <div className="relative w-36 h-36 rounded-full border-4 border-border flex flex-col items-center justify-center bg-surface-2 shadow-inner">
                <span
                  className={`text-5xl font-mono font-black ${
                    computedResult.score >= 70
                      ? 'text-acid'
                      : computedResult.score >= 40
                      ? 'text-violet-soft'
                      : 'text-amber'
                  }`}
                >
                  {computedResult.score}
                </span>
                <span className="text-xs font-mono text-muted">/ 100</span>
              </div>

              <h2 className="text-2xl font-mono font-bold text-text mt-4">
                {computedResult.bandLabel}
              </h2>
              <p className="text-xs font-mono text-muted mt-1">
                Score evaluated based on {computedResult.factorsAnsweredCount} of 6 factors (
                {computedResult.pointsEarned.toFixed(1)} / {computedResult.pointsPossible} possible points)
              </p>
            </div>
          </div>

          {/* Factor Breakdown Bars */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
            <h3 className="font-mono text-sm font-bold text-text">Factor-by-Factor Breakdown</h3>
            <div className="space-y-3">
              {computedResult.breakdown.map((f) => (
                <div key={f.id} className="p-3 rounded-lg bg-surface-2 border border-border">
                  <div className="flex justify-between items-center text-xs font-mono mb-1">
                    <span className="text-text font-bold">{f.name}</span>
                    <span className={f.answered ? 'text-acid' : 'text-muted'}>
                      {f.answered
                        ? `${f.pointsEarned.toFixed(1)} / ${f.pointsPossible} pts`
                        : 'Skipped (Excluded)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted font-sans mb-2">{f.description}</p>
                  {f.answered && (
                    <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-acid rounded-full"
                        style={{
                          width: `${(f.pointsEarned / f.pointsPossible) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Path Card */}
          {recommendation && (
            <div className="p-6 rounded-2xl bg-surface border border-acid/50 space-y-4 shadow-[0_0_20px_rgba(182,255,60,0.1)]">
              <div className="flex items-center gap-2">
                <Sparkles className="text-acid" size={20} />
                <h3 className="font-mono text-base font-bold text-text">
                  Engine Recommendation: {recommendation.primary.toUpperCase()}
                </h3>
              </div>
              <p className="text-xs text-muted font-sans leading-relaxed">
                {recommendation.reason}
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-muted">
                <span>Available alternatives:</span>
                {recommendation.alternatives.map((alt) => (
                  <span
                    key={alt}
                    className="px-2 py-0.5 rounded bg-surface-2 border border-border text-text uppercase"
                  >
                    {alt}
                  </span>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap gap-3 border-t border-border">
                <Button
                  onClick={() => navigate(`/project/${project.id}?tab=engine`)}
                  className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold"
                >
                  Proceed to Resurrection Engine &rarr;
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-border text-text font-mono text-xs"
                >
                  Edit Answers
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
