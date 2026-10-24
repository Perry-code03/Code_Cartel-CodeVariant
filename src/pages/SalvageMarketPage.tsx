import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/StoreProvider';
import { SalvagedComponent, ComponentType } from '@/types';
import { filterComponents } from '@/lib/componentFilters';
import { validateComponent } from '@/lib/validation';
import { copyToClipboard } from '@/lib/markdown';
import { SuccessCheck } from '@/components/motion/SuccessCheck';
import { useShake } from '@/components/motion/useShake';
import {
  Wrench,
  Search,
  FileCode,
  Database,
  Layout,
  Copy,
  PlusCircle,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export const SalvageMarketPage: React.FC = () => {
  const { state, dispatch } = useStore();
  const [searchParams] = useSearchParams();

  const initialProjectFilter = searchParams.get('project') || 'all';
  const newForProject = searchParams.get('newFor');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ComponentType | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>(initialProjectFilter);

  // Modals
  const [inspectComponent, setInspectComponent] = useState<SalvagedComponent | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(!!newForProject);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add Component Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<ComponentType>('snippet');
  const [formDesc, setFormDesc] = useState('');
  const [formProjectId, setFormProjectId] = useState<string>(
    newForProject || state.projects[0]?.id || ''
  );
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { shakeClass, triggerShake } = useShake();

  const filtered = useMemo(() => {
    return filterComponents(state.components, {
      search,
      type: typeFilter,
      projectId: projectFilter,
    });
  }, [state.components, search, typeFilter, projectFilter]);

  const handleCopyCode = async (comp: SalvagedComponent) => {
    const ok = await copyToClipboard(comp.content);
    if (ok) {
      setCopiedId(comp.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleAddComponentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const validationErrors = validateComponent({
      name: formName,
      description: formDesc,
      content: formContent,
      type: formType,
      projectId: formProjectId,
      tags: tagArray,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      triggerShake();
      return;
    }

    const sourceProj = state.projects.find((p) => p.id === formProjectId);

    dispatch({
      type: 'ADD_COMPONENT',
      payload: {
        name: formName.trim(),
        type: formType,
        description: formDesc.trim(),
        projectId: formProjectId,
        content: formContent.trim(),
        tags: tagArray,
        stack: sourceProj ? sourceProj.stack : [],
      },
    });

    setAddModalOpen(false);
    setFormName('');
    setFormDesc('');
    setFormContent('');
    setFormTags('');
    setErrors({});
  };

  const handleDeleteComponent = (id: string) => {
    if (confirm('Permanently remove this component from the Salvage Market?')) {
      dispatch({ type: 'DELETE_COMPONENT', payload: { id } });
      setInspectComponent(null);
    }
  };

  const getTypeIcon = (type: ComponentType) => {
    switch (type) {
      case 'snippet':
        return <FileCode size={16} className="text-acid" />;
      case 'schema':
        return <Database size={16} className="text-violet-soft" />;
      case 'ui_block':
        return <Layout size={16} className="text-amber" />;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="text-violet-soft" size={24} />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text">
              Component Salvage Market
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted font-mono mt-1">
            {state.components.length} reusable code assets harvested from abandoned repositories
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold"
        >
          <PlusCircle size={15} className="mr-1.5" />
          Harvest Component
        </Button>
      </div>

      {/* License & Reuse Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border flex items-start gap-3 text-xs font-mono text-muted">
        <ShieldAlert size={16} className="text-amber shrink-0 mt-0.5" />
        <p>
          <strong className="text-text">Local Catalog Only:</strong> Code assets harvested here reside in your browser localStorage. Ensure third-party licenses are respected before integrating components into new production repositories.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 rounded-xl border border-border space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-muted" size={16} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components by name, tag, code..."
              className="pl-9 bg-surface-2 border-border text-text font-mono text-xs"
            />
          </div>

          {/* Type Filter */}
          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter(val as ComponentType | 'all')}
          >
            <SelectTrigger className="bg-surface-2 border-border text-text font-mono text-xs">
              <SelectValue placeholder="Type: All" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border text-text">
              <SelectItem value="all" className="font-mono text-xs">All Types</SelectItem>
              <SelectItem value="snippet" className="font-mono text-xs">Code Snippets</SelectItem>
              <SelectItem value="schema" className="font-mono text-xs">Database Schemas</SelectItem>
              <SelectItem value="ui_block" className="font-mono text-xs">UI Blocks</SelectItem>
            </SelectContent>
          </Select>

          {/* Project Source Filter */}
          <Select
            value={projectFilter}
            onValueChange={(val) => setProjectFilter(val || 'all')}
          >
            <SelectTrigger className="bg-surface-2 border-border text-text font-mono text-xs">
              <SelectValue placeholder="Source Project: All" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border text-text">
              <SelectItem value="all" className="font-mono text-xs">All Projects</SelectItem>
              {state.projects.map((p) => (
                <SelectItem key={p.id} value={p.id} className="font-mono text-xs">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Components Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((comp) => {
            const source = state.projects.find((p) => p.id === comp.projectId);
            const isCopied = copiedId === comp.id;

            return (
              <div
                key={comp.id}
                onClick={() => setInspectComponent(comp)}
                className="group cursor-pointer p-5 rounded-2xl bg-surface border border-border hover:border-violet/60 hover:bg-surface-2 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(comp.type)}
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                        {comp.type}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCode(comp);
                      }}
                      className="text-xs font-mono text-muted hover:text-acid flex items-center gap-1"
                      title="Copy code"
                    >
                      {isCopied ? <SuccessCheck size={14} /> : <Copy size={14} />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <h3 className="font-mono text-base font-bold text-text mt-3 group-hover:text-acid transition-colors">
                    {comp.name}
                  </h3>

                  <p className="text-xs text-muted font-sans mt-1 line-clamp-2 leading-relaxed">
                    {comp.description}
                  </p>

                  {/* Monospace Code Preview (first 5 lines) */}
                  <pre className="mt-3 p-3 rounded-lg bg-surface-2 text-[11px] font-mono text-muted/90 overflow-hidden max-h-24 border border-border/60">
                    {comp.content.split('\n').slice(0, 5).join('\n')}
                  </pre>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted">
                  <span className="truncate">From: {source?.name || comp.projectId}</span>
                  <div className="flex gap-1">
                    {comp.tags.slice(0, 2).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-surface-2 text-[10px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-surface border border-dashed border-border font-mono text-xs text-muted">
          No components match your search criteria.
        </div>
      )}

      {/* Component Detail Inspect Dialog */}
      <Dialog
        open={!!inspectComponent}
        onOpenChange={() => setInspectComponent(null)}
      >
        <DialogContent className="max-w-3xl bg-surface border-border text-text">
          {inspectComponent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 pb-1">
                  {getTypeIcon(inspectComponent.type)}
                  <span className="font-mono text-xs text-muted uppercase">
                    {inspectComponent.type}
                  </span>
                </div>
                <DialogTitle className="font-mono text-xl text-text">
                  {inspectComponent.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted font-sans">
                  {inspectComponent.description}
                </DialogDescription>
              </DialogHeader>

              {/* Code viewer with line numbers */}
              <div className="relative mt-2 rounded-xl bg-bg border border-border p-4 max-h-[400px] overflow-auto font-mono text-xs text-text leading-relaxed">
                <div className="flex">
                  <div className="select-none text-muted/40 pr-4 text-right">
                    {inspectComponent.content.split('\n').map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  <pre className="overflow-x-auto whitespace-pre">
                    {inspectComponent.content}
                  </pre>
                </div>
              </div>

              {/* Tags & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                  {inspectComponent.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-surface-2 text-muted">
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteComponent(inspectComponent.id)}
                    className="border-danger/40 text-danger hover:bg-danger/10 font-mono text-xs"
                  >
                    <Trash2 size={13} className="mr-1" /> Delete
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleCopyCode(inspectComponent)}
                    className="bg-acid text-bg font-mono text-xs font-bold"
                  >
                    {copiedId === inspectComponent.id ? (
                      <SuccessCheck size={14} className="mr-1" />
                    ) : (
                      <Copy size={14} className="mr-1" />
                    )}
                    {copiedId === inspectComponent.id ? 'Copied' : 'Copy Code'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Harvest Component Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl bg-surface border-border text-text">
          <DialogHeader>
            <DialogTitle className="font-mono text-xl text-text">
              Harvest Reusable Component
            </DialogTitle>
            <DialogDescription className="text-xs text-muted font-mono">
              Save useful code blocks, schemas, or hooks to your local market
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddComponentSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-text">Component Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. redis-rate-limiter"
                  className={`bg-surface-2 border-border text-text font-mono text-xs ${
                    errors.name ? shakeClass : ''
                  }`}
                />
                {errors.name && <p className="text-[11px] font-mono text-danger">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-mono text-text">Component Type</Label>
                <Select
                  value={formType}
                  onValueChange={(val) => setFormType(val as ComponentType)}
                >
                  <SelectTrigger className="bg-surface-2 border-border text-text font-mono text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border-border text-text">
                    <SelectItem value="snippet" className="font-mono text-xs">Snippet (Code/Hook)</SelectItem>
                    <SelectItem value="schema" className="font-mono text-xs">Database Schema (SQL/Prisma)</SelectItem>
                    <SelectItem value="ui_block" className="font-mono text-xs">UI Block (React/CSS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-text">Source Project *</Label>
                <Select
                  value={formProjectId}
                  onValueChange={(val) => setFormProjectId(val || '')}
                >
                  <SelectTrigger className="bg-surface-2 border-border text-text font-mono text-xs">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border-border text-text">
                    {state.projects.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="font-mono text-xs">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-mono text-text">Tags (Comma-separated)</Label>
                <Input
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="auth, security, middleware"
                  className="bg-surface-2 border-border text-text font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-mono text-text">Description *</Label>
              <Input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="What does this component do?"
                className={`bg-surface-2 border-border text-text text-xs ${
                  errors.description ? shakeClass : ''
                }`}
              />
              {errors.description && (
                <p className="text-[11px] font-mono text-danger">{errors.description}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <Label className="text-text">Code Content *</Label>
                <span className="text-muted">{formContent.length} / 20,000</span>
              </div>
              <Textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={8}
                placeholder="// Paste code, SQL schema, or component..."
                className={`bg-surface-2 border-border text-text font-mono text-xs ${
                  errors.content ? shakeClass : ''
                }`}
              />
              {errors.content && (
                <p className="text-[11px] font-mono text-danger">{errors.content}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                className="border-border text-text font-mono text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-acid text-bg font-mono text-xs font-bold"
              >
                Save Component
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
