import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/StoreProvider';
import { Project, Status, Category, CATEGORIES } from '@/types';
import { TombstoneCard } from '@/components/project/TombstoneCard';
import { BuryProjectDialog } from '@/components/project/BuryProjectDialog';
import { filterProjects, AgeFilter, CompletionFilter, SortOption } from '@/lib/filters';
import {
  Search,
  X,
  Layers,
  Skull,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

export const VaultPage: React.FC = () => {
  const { state, dispatch } = useStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [selectedStacks, setSelectedStacks] = useState<string[]>([]);
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all');
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('updated_desc');
  const [pinnedFirst, setPinnedFirst] = useState(true);

  const [buryDialogOpen, setBuryDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // Extract all distinct tech stacks from projects
  const allDistinctStacks = useMemo(() => {
    const set = new Set<string>();
    state.projects.forEach((p) => p.stack.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [state.projects]);

  // Apply pure filter function
  const filteredProjects = useMemo(() => {
    return filterProjects(state.projects, {
      search,
      status: statusFilter,
      category: categoryFilter,
      stacks: selectedStacks,
      age: ageFilter,
      completion: completionFilter,
      sort: sortOption,
      pinnedFirst,
    });
  }, [
    state.projects,
    search,
    statusFilter,
    categoryFilter,
    selectedStacks,
    ageFilter,
    completionFilter,
    sortOption,
    pinnedFirst,
  ]);

  // Active filter count
  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    selectedStacks.length +
    (ageFilter !== 'all' ? 1 : 0) +
    (completionFilter !== 'all' ? 1 : 0);

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSelectedStacks([]);
    setAgeFilter('all');
    setCompletionFilter('all');
  };

  const toggleStack = (tag: string) => {
    if (selectedStacks.includes(tag)) {
      setSelectedStacks(selectedStacks.filter((t) => t !== tag));
    } else {
      setSelectedStacks([...selectedStacks, tag]);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingProject) {
      dispatch({ type: 'DELETE_PROJECT', payload: { id: deletingProject.id } });
      setDeletingProject(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="text-acid" size={24} />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text">
              Necropolis Vault
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted font-mono mt-1">
            Catalog of {state.projects.length} entombed codebases &bull; {filteredProjects.length} showing
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingProject(null);
            setBuryDialogOpen(true);
          }}
          className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold px-4 py-2"
        >
          <PlusCircle size={15} className="mr-1.5" />
          Bury a Project
        </Button>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="space-y-3 bg-surface p-4 rounded-xl border border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 text-muted" size={16} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, description, tech stack..."
              className="pl-9 bg-surface-2 border-border text-text font-mono text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-muted hover:text-text"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as Status | 'all')}
          >
            <SelectTrigger className="bg-surface-2 border-border text-text font-mono text-xs">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border text-text">
              <SelectItem value="all" className="font-mono text-xs">All Statuses</SelectItem>
              <SelectItem value="deceased" className="font-mono text-xs">Deceased</SelectItem>
              <SelectItem value="resurrecting" className="font-mono text-xs">Resurrecting</SelectItem>
              <SelectItem value="in_stasis" className="font-mono text-xs">In Stasis</SelectItem>
              <SelectItem value="salvaged" className="font-mono text-xs">Salvaged</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <Select
            value={sortOption}
            onValueChange={(val) => setSortOption(val as SortOption)}
          >
            <SelectTrigger className="bg-surface-2 border-border text-text font-mono text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border text-text">
              <SelectItem value="updated_desc" className="font-mono text-xs">Recently Updated</SelectItem>
              <SelectItem value="score_desc" className="font-mono text-xs">Highest Score</SelectItem>
              <SelectItem value="completion_desc" className="font-mono text-xs">Completion %</SelectItem>
              <SelectItem value="age_desc" className="font-mono text-xs">Oldest First</SelectItem>
              <SelectItem value="name_asc" className="font-mono text-xs">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Secondary Filter Row: Category, Age, Completion */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
          <span className="text-[10px] font-mono uppercase text-muted tracking-wider mr-1">
            Filters:
          </span>

          {/* Category Dropdown */}
          <Select
            value={categoryFilter}
            onValueChange={(val) => setCategoryFilter(val as Category | 'all')}
          >
            <SelectTrigger className="h-7 w-auto px-2.5 bg-surface-2 border-border text-muted text-[11px] font-mono">
              <SelectValue placeholder="Category: All" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border text-text">
              <SelectItem value="all" className="font-mono text-xs">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="font-mono text-xs">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Age Bracket */}
          <Select
            value={ageFilter}
            onValueChange={(val) => setAgeFilter(val as AgeFilter)}
          >
            <SelectTrigger className="h-7 w-auto px-2.5 bg-surface-2 border-border text-muted text-[11px] font-mono">
              <SelectValue placeholder="Age: All" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border text-text">
              <SelectItem value="all" className="font-mono text-xs">All Ages</SelectItem>
              <SelectItem value="<3mo" className="font-mono text-xs">&lt; 3 Months</SelectItem>
              <SelectItem value="3-6mo" className="font-mono text-xs">3–6 Months</SelectItem>
              <SelectItem value="6-12mo" className="font-mono text-xs">6–12 Months</SelectItem>
              <SelectItem value="12mo+" className="font-mono text-xs">1+ Years</SelectItem>
            </SelectContent>
          </Select>

          {/* Completion Bracket */}
          <Select
            value={completionFilter}
            onValueChange={(val) => setCompletionFilter(val as CompletionFilter)}
          >
            <SelectTrigger className="h-7 w-auto px-2.5 bg-surface-2 border-border text-muted text-[11px] font-mono">
              <SelectValue placeholder="Completion: All" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border text-text">
              <SelectItem value="all" className="font-mono text-xs">All Completion</SelectItem>
              <SelectItem value="0-25" className="font-mono text-xs">0% – 25%</SelectItem>
              <SelectItem value="26-50" className="font-mono text-xs">26% – 50%</SelectItem>
              <SelectItem value="51-75" className="font-mono text-xs">51% – 75%</SelectItem>
              <SelectItem value="76-100" className="font-mono text-xs">76% – 100%</SelectItem>
            </SelectContent>
          </Select>

          {/* Pinned toggle */}
          <button
            type="button"
            onClick={() => setPinnedFirst(!pinnedFirst)}
            className={`h-7 px-2.5 rounded text-[11px] font-mono border transition-colors ${
              pinnedFirst
                ? 'bg-violet/20 border-violet/40 text-violet-soft'
                : 'bg-surface-2 border-border text-muted hover:text-text'
            }`}
          >
            Haunted First {pinnedFirst ? '✓' : ''}
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="h-7 px-2 text-[11px] font-mono text-danger hover:underline flex items-center gap-1"
            >
              <X size={12} /> Clear ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Stack Tag Pills Filter */}
        {allDistinctStacks.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40">
            <span className="text-[10px] font-mono uppercase text-muted tracking-wider mr-1">
              Stack:
            </span>
            {allDistinctStacks.map((tag) => {
              const active = selectedStacks.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleStack(tag)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                    active
                      ? 'bg-acid/20 border-acid/60 text-acid'
                      : 'bg-surface-2 border-border text-muted hover:text-text'
                  }`}
                >
                  {tag} {active && '×'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tombstones Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <TombstoneCard
              key={project.id}
              project={project}
              onTogglePin={(id) => dispatch({ type: 'TOGGLE_PIN', payload: { id } })}
              onEdit={(p) => {
                setEditingProject(p);
                setBuryDialogOpen(true);
              }}
              onDelete={(p) => setDeletingProject(p)}
            />
          ))}
        </div>
      ) : (
        /* Empty States */
        <div className="p-12 text-center rounded-2xl bg-surface border border-dashed border-border flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center text-muted">
            <Skull size={24} />
          </div>
          {state.projects.length === 0 ? (
            <>
              <h3 className="font-mono text-base font-bold text-text">The Necropolis is Empty</h3>
              <p className="text-xs text-muted max-w-sm">
                No abandoned projects have been laid to rest yet. Bury your first stalled repository.
              </p>
              <Button
                onClick={() => setBuryDialogOpen(true)}
                className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold"
              >
                + Bury a Project
              </Button>
            </>
          ) : (
            <>
              <h3 className="font-mono text-base font-bold text-text">No Projects Match Filters</h3>
              <p className="text-xs text-muted max-w-sm">
                Try widening your search terms or clearing active filters.
              </p>
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="border-border text-text hover:bg-surface-2 font-mono text-xs"
              >
                Clear All Filters
              </Button>
            </>
          )}
        </div>
      )}

      {/* Bury / Edit Dialog */}
      <BuryProjectDialog
        open={buryDialogOpen}
        onOpenChange={(isOpen) => {
          setBuryDialogOpen(isOpen);
          if (!isOpen) setEditingProject(null);
        }}
        projectToEdit={editingProject}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingProject} onOpenChange={() => setDeletingProject(null)}>
        <DialogContent className="max-w-md bg-surface border-border text-text">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-lg text-danger">
              <AlertTriangle size={18} />
              Erase Project from Crypt?
            </DialogTitle>
            <DialogDescription className="text-muted text-xs font-mono">
              Are you sure you want to permanently erase{' '}
              <span className="text-text font-bold">{deletingProject?.name}</span>? All autopsy
              records and harvested components linked to it will be unlinked.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setDeletingProject(null)}
              className="border-border text-text font-mono text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-danger text-white hover:bg-danger/90 font-mono text-xs font-bold"
            >
              Permanently Erase
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
