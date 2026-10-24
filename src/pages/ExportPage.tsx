import React, { useState } from 'react';
import { useStore } from '@/store/StoreProvider';
import { exportGraveyardJson, isValidAppData } from '@/lib/storage';
import { generateAllProjectsMarkdownSummary, downloadMarkdownFile, copyToClipboard } from '@/lib/markdown';
import { Button } from '@/components/ui/button';
import { Download, Upload, Copy, Check, FileText, Database, ShieldAlert, RefreshCw } from 'lucide-react';

export const ExportPage: React.FC = () => {
  const { state, dispatch } = useStore();
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importCandidate, setImportCandidate] = useState<any | null>(null);

  const handleDownloadJson = () => {
    const jsonStr = exportGraveyardJson(state);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-graveyard-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = async () => {
    const jsonStr = exportGraveyardJson(state);
    const ok = await copyToClipboard(jsonStr);
    if (ok) {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const handleDownloadAllMarkdown = () => {
    const md = generateAllProjectsMarkdownSummary(state.projects, state.components);
    downloadMarkdownFile(`project-graveyard-summary-${new Date().toISOString().slice(0, 10)}.md`, md);
  };

  const handleCopyAllMarkdown = async () => {
    const md = generateAllProjectsMarkdownSummary(state.projects, state.components);
    const ok = await copyToClipboard(md);
    if (ok) {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const raw = evt.target?.result as string;
        const parsed = JSON.parse(raw);
        if (!isValidAppData(parsed)) {
          setImportStatus('Error: Invalid Project Graveyard backup schema (must contain projects, components, and events arrays).');
          setImportCandidate(null);
          return;
        }
        setImportCandidate(parsed);
        setImportStatus(`Valid archive loaded: contains ${parsed.projects.length} projects, ${parsed.components.length} components, and ${parsed.events.length} events.`);
      } catch (err: any) {
        setImportStatus(`Parse error: ${err.message || 'Corrupt JSON file.'}`);
        setImportCandidate(null);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (!importCandidate) return;
    dispatch({ type: 'IMPORT_DATA', payload: importCandidate });
    setImportStatus('Backup restored successfully!');
    setImportCandidate(null);
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-10">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-violet-soft">
          <Database size={14} />
          <span>Local Vault Portability &bull; Tools</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-text mt-2">
          Data Export & Archive Recovery
        </h1>
        <p className="text-sm text-muted mt-2 max-w-2xl font-sans leading-relaxed">
          Project Graveyard operates strictly within your local browser storage. Back up your complete necropolis, export markdown post-mortems, or restore previous sessions with zero cloud telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Full JSON Backup */}
        <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-acid">
              <Database size={20} />
            </div>
            <h2 className="font-mono text-lg font-bold text-text">Full JSON Vault Backup</h2>
            <p className="text-xs text-muted leading-relaxed">
              Downloads your complete vault state: all {state.projects.length} projects, {state.components.length} salvaged snippets, and {state.events.length} roadmap audit events in machine-readable JSON format.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <Button
              onClick={handleDownloadJson}
              className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold px-4 py-2 rounded-xl"
            >
              <Download size={14} className="mr-2" />
              Download JSON
            </Button>
            <Button
              onClick={handleCopyJson}
              variant="outline"
              className="border-border text-text hover:bg-surface-2 font-mono text-xs"
            >
              {copiedJson ? <Check size={14} className="mr-2 text-acid" /> : <Copy size={14} className="mr-2" />}
              {copiedJson ? 'Copied JSON' : 'Copy JSON'}
            </Button>
          </div>
        </div>

        {/* Global Markdown Export */}
        <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-violet-soft">
              <FileText size={20} />
            </div>
            <h2 className="font-mono text-lg font-bold text-text">Necropolis Markdown Digest</h2>
            <p className="text-xs text-muted leading-relaxed">
              Generates a comprehensive Markdown summary of all projects, autopsy diagnoses, Resurrection Scores, and salvaged code ready for sharing or local documentation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <Button
              onClick={handleDownloadAllMarkdown}
              className="bg-violet text-text hover:bg-violet/90 font-mono text-xs font-bold px-4 py-2 rounded-xl"
            >
              <Download size={14} className="mr-2" />
              Download Markdown
            </Button>
            <Button
              onClick={handleCopyAllMarkdown}
              variant="outline"
              className="border-border text-text hover:bg-surface-2 font-mono text-xs"
            >
              {copiedMd ? <Check size={14} className="mr-2 text-acid" /> : <Copy size={14} className="mr-2" />}
              {copiedMd ? 'Copied Markdown' : 'Copy Digest'}
            </Button>
          </div>
        </div>
      </div>

      {/* Restore / Import Section */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-amber">
            <Upload size={20} />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-text">Restore Archive from File</h2>
            <p className="text-xs text-muted">
              Select a valid Project Graveyard JSON export to restore. This will safely overwrite the active local storage vault.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="cursor-pointer inline-flex items-center px-4 py-2 rounded-xl bg-surface-2 border border-border hover:bg-surface-3 text-xs font-mono font-medium text-text transition-colors">
            <Upload size={14} className="mr-2 text-muted" />
            <span>Select Backup File...</span>
            <input type="file" accept=".json,application/json" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>

        {importStatus && (
          <div className="p-4 rounded-xl bg-surface-2 border border-border text-xs font-mono space-y-3">
            <p className="text-text">{importStatus}</p>

            {importCandidate && (
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleApplyImport}
                  className="bg-amber text-bg hover:bg-amber/90 font-mono text-xs font-bold"
                >
                  <RefreshCw size={14} className="mr-2" />
                  Confirm and Replace Active Vault
                </Button>
                <Button
                  onClick={() => {
                    setImportCandidate(null);
                    setImportStatus(null);
                  }}
                  variant="ghost"
                  className="text-xs font-mono text-muted hover:text-text"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs font-mono text-muted/80">
          <ShieldAlert size={14} className="text-muted" />
          <span>Restoring an archive replaces active localStorage data. If you have unsaved progress, download a backup above first.</span>
        </div>
      </div>
    </div>
  );
};
