import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, CATEGORIES, Category } from '@/types';
import { validateProject } from '@/lib/validation';
import { useStore } from '@/store/StoreProvider';
import { useShake } from '@/components/motion/useShake';
import { SuccessCheck } from '@/components/motion/SuccessCheck';
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
import { X, Plus, Skull } from 'lucide-react';

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

  const { shakeClass, triggerShake } = useShake();

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
      <DialogContent className="max-w-xl bg-surface border-border text-text">
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
                className="border-border text-text hover:bg-surface-2 font-mono text-xs"
                onClick={() => onOpenChange(false)}
              >
                Back to Vault
              </Button>
              <Button
                type="button"
                className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold"
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
                  className={`bg-surface-2 border-border text-text font-mono text-sm ${
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
                  className={`bg-surface-2 border-border text-text text-sm ${
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
                    <SelectTrigger className="bg-surface-2 border-border text-text font-mono text-xs">
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
                    className={`bg-surface-2 border-border text-text font-mono text-xs ${
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
                    className="bg-surface-2 border-border text-text font-mono text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                    className="border-border text-muted hover:text-text font-mono text-xs"
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
                        className="text-muted hover:text-danger"
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
                  className="text-muted hover:text-text font-mono text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold"
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
