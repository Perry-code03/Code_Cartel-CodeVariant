import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, CATEGORIES, Category, RepoAnalysis } from '@/types';
import { validateProject } from '@/lib/validation';
import { parseGithubUrl } from '@/lib/github';
import { analyzeRepo } from '@/lib/api';
import { useStore } from '@/store/StoreProvider';
import { useShake } from '@/components/motion/useShake';
import { SuccessCheck } from '@/components/motion/SuccessCheck';
import { MatrixLoader } from '@/components/motion/MatrixLoader';
import { ThinkingStates } from '@/components/motion/ThinkingStates';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, Skull, Sparkles, AlertCircle, Check } from 'lucide-react';

const GithubIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 14,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

interface BuryProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectToEdit?: Project | null;
}

export const BuryProjectDialog: React.FC<BuryProjectDialogProps> = ({
  open,
  onOpenChange,
  projectToEdit,
}) => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Web App');
  const [stack, setStack] = useState<string[]>([]);
  const [stackInput, setStackInput] = useState('');
  const [completion, setCompletion] = useState<number>(30);
  const [lastActiveAt, setLastActiveAt] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successId, setSuccessId] = useState<string | null>(null);

  // GitHub Import state
  const [githubUrl, setGithubUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<RepoAnalysis | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState({
    name: true,
    description: true,
    category: true,
    stack: true,
    lastActiveAt: true,
  });

  const { shakeClass, triggerShake } = useShake();
  const { shakeClass: importShakeClass, triggerShake: triggerImportShake } = useShake();

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setDescription(projectToEdit.description);
      setCategory(projectToEdit.category);
      setStack(projectToEdit.stack);
      setCompletion(projectToEdit.completion);
      setLastActiveAt(projectToEdit.lastActiveAt.split('T')[0]);
    } else {
      setName('');
      setDescription('');
      setCategory('Web App');
      setStack([]);
      setCompletion(35);
      setLastActiveAt(new Date().toISOString().split('T')[0]);
    }
    setGithubUrl('');
    setSuggestion(null);
    setImportError(null);
    setIsAnalyzing(false);
    setErrors({});
    setSuccessId(null);
  }, [projectToEdit, open]);

  const handleAddTag = () => {
    const trimmed = stackInput.trim();
    if (!trimmed) return;
    if (stack.includes(trimmed)) return;
    if (stack.length >= 8) return;
    setStack([...stack, trimmed]);
    setStackInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setStack(stack.filter((t) => t !== tagToRemove));
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setImportError(null);

    const trimmedUrl = githubUrl.trim();
    if (!trimmedUrl) {
      setImportError('Please enter a public GitHub repository URL.');
      triggerImportShake();
      return;
    }

    if (!parseGithubUrl(trimmedUrl)) {
      setImportError(
        'Please enter a valid public GitHub repository URL (e.g. https://github.com/owner/repo).'
      );
      triggerImportShake();
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeRepo(trimmedUrl);
      setSuggestion(result);
      setSelectedSuggestions({
        name: true,
        description: true,
        category: true,
        stack: true,
        lastActiveAt: Boolean(result.lastPushedAt),
      });
      setImportError(null);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Failed to analyze repository.');
      triggerImportShake();
      const parsed = parseGithubUrl(trimmedUrl);
      if (parsed && !name.trim()) {
        setName(parsed.repo);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplySuggestions = () => {
    if (!suggestion) return;

    if (selectedSuggestions.name && suggestion.name) {
      setName(suggestion.name);
    }
    if (selectedSuggestions.description && suggestion.description) {
      setDescription(suggestion.description);
    }
    if (selectedSuggestions.category && suggestion.category) {
      setCategory(suggestion.category);
    }
    if (selectedSuggestions.stack && suggestion.stack.length > 0) {
      setStack(suggestion.stack);
    }
    if (selectedSuggestions.lastActiveAt && suggestion.lastPushedAt) {
      setLastActiveAt(suggestion.lastPushedAt.split('T')[0]);
    }

    // Dismiss suggestion panel and clean up any resolved validation errors
    setSuggestion(null);
    setErrors((prev) => {
      const updated = { ...prev };
      if (selectedSuggestions.name) delete updated.name;
      if (selectedSuggestions.description) delete updated.description;
      if (selectedSuggestions.category) delete updated.category;
      if (selectedSuggestions.stack) delete updated.stack;
      if (selectedSuggestions.lastActiveAt) delete updated.lastActiveAt;
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const otherProjectNames = state.projects
      .filter((p) => p.id !== projectToEdit?.id)
      .map((p) => p.name);

    const validationErrors = validateProject(
      {
        name,
        description,
        stack,
        category,
        completion,
        lastActiveAt,
      },
      otherProjectNames
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      triggerShake();
      return;
    }

    if (projectToEdit) {
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: {
          id: projectToEdit.id,
          name: name.trim(),
          description: description.trim(),
          category,
          stack,
          completion,
          lastActiveAt: new Date(lastActiveAt).toISOString(),
        },
      });
      onOpenChange(false);
    } else {
      const generatedId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `proj-${Date.now()}`;

      dispatch({
        type: 'ADD_PROJECT',
        payload: {
          name: name.trim(),
          description: description.trim(),
          category,
          stack,
          completion,
          lastActiveAt: new Date(lastActiveAt).toISOString(),
        },
      });

      setSuccessId(generatedId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-surface border-border text-text">
        {successId ? (
          <div className="py-8 text-center flex flex-col items-center justify-center space-y-4">
            <SuccessCheck size={64} />
            <h3 className="font-mono text-xl font-bold text-text">
              Project Buried in the Necropolis
            </h3>
            <p className="text-sm text-muted max-w-sm">
              <span className="text-acid font-mono font-medium">{name}</span> has been entombed.
              Would you like to conduct the autopsy now to calculate its Resurrection Score?
            </p>
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="border-border text-text hover:bg-surface-2 font-mono text-xs focus-visible:ring-2 focus-visible:ring-violet"
                onClick={() => onOpenChange(false)}
              >
                Back to Vault
              </Button>
              <Button
                type="button"
                className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold focus-visible:ring-2 focus-visible:ring-violet"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/projects/${state.projects[0]?.id || successId}/autopsy`);
                }}
              >
                Conduct Autopsy Now
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-mono text-xl text-text">
                <Skull size={20} className="text-violet-soft" />
                {projectToEdit ? 'Edit Entombed Project' : 'Bury an Abandoned Project'}
              </DialogTitle>
              <DialogDescription className="text-muted text-xs font-mono">
                Catalog your abandoned side project, hackathon prototype, or stalled repo.
              </DialogDescription>
            </DialogHeader>

            {/* Optional GitHub Import Section */}
            <div className="mt-2 p-3 rounded-lg bg-surface-2/70 border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GithubIcon size={16} className="text-muted" />
                  <span className="font-mono text-xs font-semibold text-text">
                    Import from GitHub (Optional)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted">Public repos only</span>
              </div>

              <div className="flex gap-2">
                <Input
                  id="github-import-url"
                  value={githubUrl}
                  onChange={(e) => {
                    setGithubUrl(e.target.value);
                    if (importError) setImportError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAnalyze();
                    }
                  }}
                  placeholder="https://github.com/owner/repo"
                  disabled={isAnalyzing}
                  className="bg-surface border-border text-text font-mono text-xs focus-visible:ring-2 focus-visible:ring-violet"
                />
                <Button
                  type="button"
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing}
                  variant="outline"
                  className="border-border text-text hover:bg-surface font-mono text-xs shrink-0 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-violet"
                >
                  <Sparkles size={13} className="text-violet-soft" />
                  <span>Analyze</span>
                </Button>
              </div>

              {/* Inline Loading State */}
              {isAnalyzing && (
                <div className="flex items-center gap-3 p-2.5 rounded bg-surface border border-border">
                  <MatrixLoader />
                  <ThinkingStates
                    states={[
                      'Querying public GitHub repository...',
                      'Inspecting dependency manifests & README...',
                      'Synthesizing project stack & category...',
                      'Validating suggested fields...',
                    ]}
                  />
                </div>
              )}

              {/* Inline Error State */}
              {importError && (
                <div
                  className={`flex items-start gap-2 p-2 rounded bg-danger/10 border border-danger/30 text-danger text-xs font-mono ${importShakeClass}`}
                  role="alert"
                >
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span className="flex-1">{importError}</span>
                  <button
                    type="button"
                    onClick={() => setImportError(null)}
                    className="text-danger hover:opacity-80 p-0.5"
                    aria-label="Dismiss error"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Suggestions Review Card */}
              {suggestion && (
                <div className="p-3 rounded-lg bg-surface border border-violet/40 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    {suggestion.source === 'github+ai' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-violet/20 border border-violet/40 text-violet-soft">
                        <Sparkles size={12} />
                        Suggested from GitHub data + AI ({suggestion.aiProviderName || 'AI'}), please review
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-surface-2 border border-border text-text">
                        <GithubIcon size={12} />
                        Suggested from GitHub data
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-muted">
                      Review & choose fields
                    </span>
                  </div>

                  {suggestion.notice && (
                    <div className="flex items-center gap-2 p-2 rounded bg-amber/10 border border-amber/30 text-amber text-xs font-mono">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{suggestion.notice}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-muted font-mono leading-relaxed">
                    Only the public repo URL and metadata/README excerpts are sent to the AI provider. Nothing is stored on our server.
                  </p>

                  <div className="space-y-2 pt-1 border-t border-border/60 text-xs font-mono">
                    {/* Suggestion: Name */}
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.name}
                        onChange={(e) =>
                          setSelectedSuggestions((prev) => ({
                            ...prev,
                            name: e.target.checked,
                          }))
                        }
                        className="mt-0.5 h-3.5 w-3.5 rounded border-border bg-surface-2 text-acid focus:ring-2 focus:ring-violet focus:outline-none"
                      />
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-1">
                          <span className="text-muted">Name:</span>
                          <span className="text-text font-bold">{suggestion.name}</span>
                          {name.trim() && name.trim() !== suggestion.name && (
                            <span className="text-[11px] text-amber font-normal">
                              (will replace "{name}")
                            </span>
                          )}
                        </div>
                      </div>
                    </label>

                    {/* Suggestion: Description */}
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.description}
                        onChange={(e) =>
                          setSelectedSuggestions((prev) => ({
                            ...prev,
                            description: e.target.checked,
                          }))
                        }
                        className="mt-0.5 h-3.5 w-3.5 rounded border-border bg-surface-2 text-acid focus:ring-2 focus:ring-violet focus:outline-none"
                      />
                      <div className="flex-1">
                        <span className="text-muted">Description: </span>
                        <span className="text-text">{suggestion.description}</span>
                        {description.trim() &&
                          description.trim() !== suggestion.description && (
                            <span className="block text-[11px] text-amber font-normal pt-0.5">
                              (will replace current description)
                            </span>
                          )}
                      </div>
                    </label>

                    {/* Suggestion: Category */}
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.category}
                        onChange={(e) =>
                          setSelectedSuggestions((prev) => ({
                            ...prev,
                            category: e.target.checked,
                          }))
                        }
                        className="mt-0.5 h-3.5 w-3.5 rounded border-border bg-surface-2 text-acid focus:ring-2 focus:ring-violet focus:outline-none"
                      />
                      <div className="flex-1">
                        <span className="text-muted">Category: </span>
                        <span className="text-acid">{suggestion.category}</span>
                        {category !== suggestion.category && (
                          <span className="text-[11px] text-amber font-normal ml-1">
                            (will replace "{category}")
                          </span>
                        )}
                      </div>
                    </label>

                    {/* Suggestion: Stack */}
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.stack}
                        onChange={(e) =>
                          setSelectedSuggestions((prev) => ({
                            ...prev,
                            stack: e.target.checked,
                          }))
                        }
                        className="mt-0.5 h-3.5 w-3.5 rounded border-border bg-surface-2 text-acid focus:ring-2 focus:ring-violet focus:outline-none"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-muted">Stack:</span>
                          {suggestion.stack.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded bg-surface-2 border border-border text-[11px] text-text"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        {stack.length > 0 && (
                          <span className="block text-[11px] text-amber font-normal">
                            (will replace current {stack.length} tag
                            {stack.length > 1 ? 's' : ''})
                          </span>
                        )}
                      </div>
                    </label>

                    {/* Suggestion: Last Active Date */}
                    {suggestion.lastPushedAt && (
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.lastActiveAt}
                          onChange={(e) =>
                            setSelectedSuggestions((prev) => ({
                              ...prev,
                              lastActiveAt: e.target.checked,
                            }))
                          }
                          className="mt-0.5 h-3.5 w-3.5 rounded border-border bg-surface-2 text-acid focus:ring-2 focus:ring-violet focus:outline-none"
                        />
                        <div className="flex-1">
                          <span className="text-muted">Last Active: </span>
                          <span className="text-text">
                            {suggestion.lastPushedAt.split('T')[0]}
                          </span>
                          {lastActiveAt !== suggestion.lastPushedAt.split('T')[0] && (
                            <span className="text-[11px] text-amber font-normal ml-1">
                              (will replace "{lastActiveAt}")
                            </span>
                          )}
                        </div>
                      </label>
                    )}
                  </div>

                  <p className="text-[10px] font-mono text-muted italic">
                    Completion % is not estimated—fill it out based on your evaluation below.
                  </p>

                  <div className="flex justify-end items-center gap-2 pt-2 border-t border-border/60">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSuggestion(null)}
                      className="text-muted hover:text-text font-mono text-xs focus-visible:ring-2 focus-visible:ring-violet"
                    >
                      Dismiss
                    </Button>
                    <Button
                      type="button"
                      onClick={handleApplySuggestions}
                      className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-violet"
                    >
                      <Check size={13} />
                      Apply Selected
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Project Name */}
              <div className="space-y-1.5">
                <Label htmlFor="proj-name" className="text-xs font-mono text-text">
                  Project Name <span className="text-acid">*</span>
                </Label>
                <Input
                  id="proj-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. email-worker, crypto-dashboard"
                  className={`bg-surface-2 border-border text-text font-mono text-sm focus-visible:ring-2 focus-visible:ring-violet ${
                    errors.name ? shakeClass : ''
                  }`}
                />
                {errors.name && (
                  <p className="text-[11px] font-mono text-danger">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="proj-desc" className="text-xs font-mono text-text">
                  Short Description <span className="text-acid">*</span>
                </Label>
                <Textarea
                  id="proj-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What was this project supposed to do? What was the original ambition?"
                  rows={2}
                  className={`bg-surface-2 border-border text-text text-sm focus-visible:ring-2 focus-visible:ring-violet ${
                    errors.description ? shakeClass : ''
                  }`}
                />
                {errors.description && (
                  <p className="text-[11px] font-mono text-danger">{errors.description}</p>
                )}
              </div>

              {/* Category and Last Active Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-mono text-text">Category</Label>
                  <Select
                    value={category}
                    onValueChange={(val) => setCategory(val as Category)}
                  >
                    <SelectTrigger className="bg-surface-2 border-border text-text font-mono text-xs focus-visible:ring-2 focus-visible:ring-violet">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-border text-text">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="font-mono text-xs">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="proj-date" className="text-xs font-mono text-text">
                    Last Worked On <span className="text-acid">*</span>
                  </Label>
                  <Input
                    id="proj-date"
                    type="date"
                    value={lastActiveAt}
                    onChange={(e) => setLastActiveAt(e.target.value)}
                    className={`bg-surface-2 border-border text-text font-mono text-xs focus-visible:ring-2 focus-visible:ring-violet ${
                      errors.lastActiveAt ? shakeClass : ''
                    }`}
                  />
                  {errors.lastActiveAt && (
                    <p className="text-[11px] font-mono text-danger">{errors.lastActiveAt}</p>
                  )}
                </div>
              </div>

              {/* Tech Stack Pills Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-text">
                  Tech Stack Tags (1–8 tags)
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={stackInput}
                    onChange={(e) => setStackInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type tech tag and press Enter (e.g. React, Redis)"
                    className="bg-surface-2 border-border text-text font-mono text-xs focus-visible:ring-2 focus-visible:ring-violet"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                    className="border-border text-muted hover:text-text font-mono text-xs focus-visible:ring-2 focus-visible:ring-violet"
                  >
                    <Plus size={14} />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {stack.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-surface-2 border border-border text-text"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-muted hover:text-danger focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet rounded"
                        aria-label={`Remove ${t} tag`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                {errors.stack && (
                  <p className="text-[11px] font-mono text-danger">{errors.stack}</p>
                )}
              </div>

              {/* Completion Slider */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex justify-between items-center text-xs font-mono text-muted">
                  <span>Estimated Completion Percentage</span>
                  <span className="font-bold text-text text-sm">{completion}%</span>
                </div>
                <Slider
                  value={[completion]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(val: any) => {
                    const num = Array.isArray(val) ? val[0] : Number(val);
                    setCompletion(num);
                  }}
                  className="py-1"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-muted hover:text-text font-mono text-xs focus-visible:ring-2 focus-visible:ring-violet"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold focus-visible:ring-2 focus-visible:ring-violet"
                >
                  {projectToEdit ? 'Save Changes' : 'Entomb Project'}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
