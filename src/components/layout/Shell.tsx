import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '@/store/StoreProvider';
import { BuryProjectDialog } from '@/components/project/BuryProjectDialog';
import { OraclePanel } from '@/components/oracle/OraclePanel';
import {
  Skull,
  Layers,
  Wrench,
  Milestone,
  Sparkles,
  PlusCircle,
  Clock,
  RotateCcw,
  Download,
  Upload,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { exportGraveyardJson, importGraveyardJson } from '@/lib/storage';

export const Shell: React.FC = () => {
  const { state, dispatch } = useStore();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [buryDialogOpen, setBuryDialogOpen] = useState(false);
  const [oracleOpen, setOracleOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Live local clock updating each minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
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

  const handleExportBackup = () => {
    const jsonStr = exportGraveyardJson(state);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `graveyard-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = importGraveyardJson(event.target?.result as string);
            if (confirm('Importing this backup will overwrite existing graveyard records. Proceed?')) {
              dispatch({ type: 'IMPORT_DATA', payload: parsed });
              alert('Graveyard restored successfully.');
            }
          } catch {
            alert('Failed to parse backup JSON. Invalid format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleRestoreDemo = () => {
    if (confirm('Reset to initial sample records? Your custom projects will be preserved.')) {
      dispatch({ type: 'RESTORE_DEMO', payload: { resetAll: false } });
    }
  };

  const navItems = [
    { label: 'Necropolis Vault', path: '/vault', icon: Layers, badge: state.projects.length },
    { label: 'Salvage Market', path: '/salvage', icon: Wrench, badge: state.components.length },
    { label: 'Revival Roadmap', path: '/roadmap', icon: Milestone, badge: state.events.length },
  ];

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans selection:bg-acid selection:text-bg">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-acid focus:text-bg focus:font-mono focus:rounded"
      >
        Skip to main content
      </a>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-acid group-hover:border-acid/60 group-hover:shadow-[0_0_12px_rgba(182,255,60,0.3)] transition-all">
              <Skull size={18} />
            </div>
            <span className="font-mono text-sm sm:text-base font-bold tracking-tight text-text group-hover:text-acid transition-colors">
              the-project-graveyard
            </span>
          </NavLink>
        </div>

        {/* Live Clock & Actions */}
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
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`hidden md:flex flex-col justify-between border-r border-border bg-surface transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-60'
          }`}
        >
          <div className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-colors ${
                      isActive
                        ? 'bg-violet/20 text-text border border-violet/40 shadow-sm'
                        : 'text-muted hover:text-text hover:bg-surface-2'
                    }`
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="shrink-0 text-violet-soft" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-2 border border-border text-muted">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Sidebar Footer Controls */}
          <div className="p-3 border-t border-border space-y-1 text-muted text-[11px] font-mono">
            <button
              type="button"
              onClick={handleRestoreDemo}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-surface-2 hover:text-text text-left"
              title="Restore demo projects"
            >
              <RotateCcw size={14} className="shrink-0" />
              {!sidebarCollapsed && <span>Restore Demo</span>}
            </button>
            <button
              type="button"
              onClick={handleExportBackup}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-surface-2 hover:text-text text-left"
              title="Export all data (JSON)"
            >
              <Download size={14} className="shrink-0" />
              {!sidebarCollapsed && <span>Export JSON</span>}
            </button>
            <button
              type="button"
              onClick={handleImportBackup}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-surface-2 hover:text-text text-left"
              title="Import JSON backup"
            >
              <Upload size={14} className="shrink-0" />
              {!sidebarCollapsed && <span>Import Backup</span>}
            </button>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main id="main-content" className="flex-1 bg-grid-pattern relative min-h-[calc(100vh-60px)]">
          {/* Subtle violet ambient glow behind viewport */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet/5 blur-[120px] rounded-full" />
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col p-6">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <span className="font-mono text-sm font-bold text-text">Navigation</span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="font-mono text-sm text-muted"
            >
              Close [ESC]
            </button>
          </div>
          <div className="space-y-3 py-6">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border text-sm font-mono text-text"
              >
                <span>{item.label}</span>
                <span className="text-xs text-acid">{item.badge}</span>
              </NavLink>
            ))}
          </div>
          <div className="mt-auto space-y-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setBuryDialogOpen(true);
              }}
              className="w-full py-2.5 rounded-lg bg-acid text-bg font-mono text-xs font-bold"
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
