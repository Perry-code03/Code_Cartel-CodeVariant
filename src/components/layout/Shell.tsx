import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store/StoreProvider';
import { BuryProjectDialog } from '@/components/project/BuryProjectDialog';
import { OraclePanel } from '@/components/oracle/OraclePanel';
import {
  Layers,
  Activity,
  Flame,
  Wrench,
  Milestone,
  Download,
  Sparkles,
  PlusCircle,
  Clock,
  RotateCcw,
  Menu,
  ChevronLeft,
  ChevronRight,
  HardDrive,
} from 'lucide-react';

const SIDEBAR_STORAGE_KEY = 'graveyard:sidebar-collapsed';

export const Shell: React.FC = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsible state persisted in localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [buryDialogOpen, setBuryDialogOpen] = useState(false);
  const [oracleOpen, setOracleOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [focusedNavIndex, setFocusedNavIndex] = useState<number>(-1);
  const navContainerRef = useRef<HTMLDivElement>(null);

  // Toggle and save collapsed state
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // storage disabled
      }
      return next;
    });
  }, []);

  // Live UTC clock updating each minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Compute live project status mini-counts from store
  const deceasedCount = state.projects.filter((p) => p.status === 'deceased').length;
  const inStasisCount = state.projects.filter((p) => p.status === 'in_stasis').length;
  const resurrectingCount = state.projects.filter((p) => p.status === 'resurrecting').length;
  const salvagedProjectCount = state.projects.filter((p) => p.status === 'salvaged').length;

  const handleRestoreDemo = () => {
    if (window.confirm('Reset sample records to initial state? Your custom projects will be preserved.')) {
      dispatch({ type: 'RESTORE_DEMO', payload: { resetAll: false } });
    }
  };

  interface NavItem {
    index: string;
    label: string;
    path?: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: number;
    isAction?: boolean;
    onAction?: () => void;
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  // Structured Navigation Groups
  const navigationGroups: NavGroup[] = [
    {
      title: 'Workspace',
      items: [
        { index: '01', label: 'Vault', path: '/vault', icon: Layers, badge: state.projects.length },
        { index: '02', label: 'Autopsy', path: '/autopsy', icon: Activity },
        { index: '03', label: 'Engine', path: '/engine', icon: Flame },
      ],
    },
    {
      title: 'Library',
      items: [
        { index: '04', label: 'Salvage Market', path: '/market', icon: Wrench, badge: state.components.length },
        { index: '05', label: 'Roadmap', path: '/roadmap', icon: Milestone, badge: state.events.length },
      ],
    },
    {
      title: 'Tools',
      items: [
        { index: '06', label: 'Export', path: '/export', icon: Download },
        { index: '07', label: 'Oracle', isAction: true, onAction: () => setOracleOpen(true), icon: Sparkles },
      ],
    },
  ];

  // Flattened items for keyboard navigation
  const flatNavItems: NavItem[] = navigationGroups.flatMap((g) => g.items);

  // Keyboard shortcut '[' toggles sidebar, Arrow keys navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === '[') {
        e.preventDefault();
        toggleSidebar();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedNavIndex((prev) => {
          const next = (prev + 1) % flatNavItems.length;
          const target = flatNavItems[next];
          if (target.path) navigate(target.path);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedNavIndex((prev) => {
          const next = (prev - 1 + flatNavItems.length) % flatNavItems.length;
          const target = flatNavItems[next];
          if (target.path) navigate(target.path);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, flatNavItems, navigate]);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans selection:bg-violet-900/40">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-acid focus:text-bg focus:font-mono focus:rounded"
      >
        Skip to main content
      </a>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors border border-transparent hover:border-border"
            title="Toggle sidebar ([)"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          {/* Wordmark with Arched Tombstone SVG Mark (No Emoji) */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-t-xl rounded-b-sm bg-surface-2 border border-border flex items-center justify-center text-acid group-hover:border-acid/60 group-hover:shadow-[0_0_12px_rgba(182,255,60,0.3)] transition-all">
              <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-acid">
                <path d="M2 19V8C2 4.13401 5.13401 1 9 1C12.866 1 16 4.13401 16 8V19H2Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 5.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M6 7.5H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-mono text-sm sm:text-base font-bold tracking-tight text-text group-hover:text-acid transition-colors">
              the-project-graveyard
            </span>
          </NavLink>
        </div>

        {/* Live Clock & Global Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted px-2.5 py-1 rounded-md bg-surface-2/60 border border-border">
            <Clock size={13} className="text-violet-soft" />
            <span>UTC {currentTime || '--:--'}</span>
          </div>

          <button
            type="button"
            onClick={() => setOracleOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs text-violet-soft bg-violet/15 hover:bg-violet/25 border border-violet/30 transition-all hover:shadow-[0_0_10px_rgba(139,92,246,0.2)]"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">Graveyard</span> Oracle
          </button>

          <button
            type="button"
            onClick={() => setBuryDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs font-bold text-bg bg-acid hover:bg-acid/90 transition-all shadow-[0_0_12px_rgba(182,255,60,0.25)]"
          >
            <PlusCircle size={14} />
            <span>Bury a Project</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Redesigned Sidebar */}
        <aside
          ref={navContainerRef}
          className={`hidden md:flex flex-col justify-between border-r border-border bg-surface transition-all duration-200 select-none ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className="py-4 space-y-6">
            {navigationGroups.map((group) => (
              <div key={group.title} className="px-3">
                {!sidebarCollapsed && (
                  <div className="px-2 mb-2 flex items-center justify-between text-[10px] font-mono font-bold tracking-widest text-muted/60 uppercase">
                    <span>{group.title}</span>
                  </div>
                )}

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.path ? location.pathname === item.path : false;

                    if (item.isAction) {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={item.onAction}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-r-lg text-xs font-mono text-muted hover:text-text hover:bg-surface-2 hover:border-border/80 transition-all duration-150 group border-l-2 border-transparent text-left"
                          title={sidebarCollapsed ? `${item.index} ${item.label}` : undefined}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon size={16} className="shrink-0 text-violet-soft group-hover:text-text transition-colors" />
                            {!sidebarCollapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </div>
                          {!sidebarCollapsed && (
                            <span className="text-[10px] font-mono text-zinc-600">
                              {item.index}
                            </span>
                          )}
                        </button>
                      );
                    }

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path!}
                        className={({ isActive: linkActive }) =>
                          `group flex items-center justify-between px-2.5 py-2 rounded-r-lg text-xs font-mono transition-all duration-150 border-l-2 ${
                            linkActive
                              ? 'border-violet-500 bg-violet/15 text-text shadow-[inset_0_1px_0_0_rgba(168,85,247,0.15)] font-semibold'
                              : 'border-transparent text-muted hover:text-text hover:bg-surface-2'
                          }`
                        }
                        title={sidebarCollapsed ? `${item.index} ${item.label}` : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            size={16}
                            className={`shrink-0 transition-colors ${
                              isActive ? 'text-violet-400' : 'text-violet-soft/80 group-hover:text-text'
                            }`}
                          />
                          {!sidebarCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </div>

                        {!sidebarCollapsed && (
                          <div className="flex items-center gap-2 shrink-0">
                            {item.badge !== undefined && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-2 border border-border text-muted">
                                {item.badge}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors">
                              {item.index}
                            </span>
                          </div>
                        )}
                      </NavLink>
                    );
                  })}
                </div>

                {/* Status Mini-Counts under Workspace Group */}
                {group.title === 'Workspace' && !sidebarCollapsed && (
                  <div className="mt-3 mx-2 p-2.5 rounded-xl bg-surface-2/60 border border-border/80 space-y-1.5">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-muted/80">Vault Status</div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 text-muted hover:text-text">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                        <span>Dead: <strong className="text-text">{deceasedCount}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted hover:text-text">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                        <span>Stasis: <strong className="text-text">{inStasisCount}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted hover:text-text">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                        <span>Revive: <strong className="text-text">{resurrectingCount}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted hover:text-text">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Parts: <strong className="text-text">{salvagedProjectCount}</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-border space-y-2 text-muted text-[11px] font-mono">
            {/* Local Data Storage Indicator */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-surface-2/40 border border-border/60 text-muted">
              <HardDrive size={13} className="shrink-0 text-emerald-400" />
              {!sidebarCollapsed && (
                <div className="truncate text-[10px]">
                  <span>Local data (browser)</span>
                </div>
              )}
            </div>

            {/* Reset Demo Data Action */}
            <button
              type="button"
              onClick={handleRestoreDemo}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-2 hover:text-text text-left transition-colors"
              title="Reset demo data"
            >
              <RotateCcw size={13} className="shrink-0 text-amber" />
              {!sidebarCollapsed && <span>Reset Demo Data</span>}
            </button>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main id="main-content" className="flex-1 bg-grid-pattern relative min-h-[calc(100vh-60px)] overflow-x-hidden">
          {/* Subtle violet ambient glow behind viewport */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet/5 blur-[120px] rounded-full" />
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col p-6 overflow-y-auto">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <span className="font-mono text-sm font-bold text-text">Navigation</span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="font-mono text-xs text-muted hover:text-text p-1"
            >
              Close [ESC]
            </button>
          </div>

          <div className="space-y-6 py-6">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <div className="text-[10px] font-mono font-bold tracking-widest text-muted uppercase">
                  {group.title}
                </div>
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    if (item.isAction) {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            item.onAction?.();
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-lg bg-surface border border-border text-sm font-mono text-text"
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={16} className="text-violet-soft" />
                            <span>{item.label}</span>
                          </div>
                          <span className="text-xs font-mono text-zinc-500">{item.index}</span>
                        </button>
                      );
                    }

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path!}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border text-sm font-mono text-text hover:border-violet-soft/60"
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={16} className="text-violet-soft" />
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge !== undefined && (
                            <span className="text-xs text-acid font-bold">{item.badge}</span>
                          )}
                          <span className="text-xs font-mono text-zinc-500">{item.index}</span>
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto space-y-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setBuryDialogOpen(true);
              }}
              className="w-full py-3 rounded-lg bg-acid text-bg font-mono text-xs font-bold"
            >
              + Bury a Project
            </button>
          </div>
        </div>
      )}

      {/* Modals & Floating Drawers */}
      <BuryProjectDialog open={buryDialogOpen} onOpenChange={setBuryDialogOpen} />
      <OraclePanel open={oracleOpen} onClose={() => setOracleOpen(false)} />
    </div>
  );
};
