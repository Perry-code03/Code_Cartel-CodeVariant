// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BuryProjectDialog } from '../BuryProjectDialog';
import { StoreProvider } from '@/store/StoreProvider';
import { HashRouter } from 'react-router-dom';
import * as api from '@/lib/api';

describe('BuryProjectDialog - GitHub Import', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderDialog = (open = true) => {
    return render(
      <HashRouter>
        <StoreProvider>
          <BuryProjectDialog open={open} onOpenChange={() => {}} />
        </StoreProvider>
      </HashRouter>
    );
  };

  it('renders the Import from GitHub input and Analyze button', () => {
    renderDialog();
    expect(screen.getByPlaceholderText('https://github.com/owner/repo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument();
  });

  it('shows inline validation error if URL is empty or invalid', async () => {
    renderDialog();
    const analyzeBtn = screen.getByRole('button', { name: /analyze/i });
    fireEvent.click(analyzeBtn);

    expect(
      await screen.findByText('Please enter a public GitHub repository URL.')
    ).toBeInTheDocument();

    const input = screen.getByPlaceholderText('https://github.com/owner/repo');
    fireEvent.change(input, { target: { value: 'https://gitlab.com/owner/repo' } });
    fireEvent.click(analyzeBtn);

    expect(
      await screen.findByText(/Please enter a valid public GitHub repository URL/)
    ).toBeInTheDocument();
  });

  it('fetches repo analysis and renders suggestion card with apply button', async () => {
    vi.spyOn(api, 'analyzeRepo').mockResolvedValue({
      name: 'awesome-worker',
      description: 'An automated background processing engine.',
      stack: ['Python', 'Celery', 'Redis'],
      category: 'API / Backend',
      lastPushedAt: '2026-02-20T10:00:00.000Z',
      source: 'github+ai',
      repoUrl: 'https://github.com/owner/awesome-worker',
    });

    renderDialog();

    const input = screen.getByPlaceholderText('https://github.com/owner/repo');
    fireEvent.change(input, { target: { value: 'https://github.com/owner/awesome-worker' } });

    const analyzeBtn = screen.getByRole('button', { name: /analyze/i });
    fireEvent.click(analyzeBtn);

    // Verify honest label appears
    expect(
      await screen.findByText(/Suggested from GitHub data \+ xAI Grok/)
    ).toBeInTheDocument();

    // Verify privacy note appears
    expect(
      screen.getByText(/Only the public repo URL and metadata are sent/)
    ).toBeInTheDocument();

    // Verify fields in suggestion card
    expect(screen.getByText('awesome-worker')).toBeInTheDocument();
    expect(screen.getByText('An automated background processing engine.')).toBeInTheDocument();
    expect(screen.getByText('API / Backend')).toBeInTheDocument();

    // Click Apply Selected
    const applyBtn = screen.getByRole('button', { name: /apply selected/i });
    fireEvent.click(applyBtn);

    // Verify main form fields updated
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/project name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('awesome-worker');
      const descInput = screen.getByLabelText(/short description/i) as HTMLTextAreaElement;
      expect(descInput.value).toBe('An automated background processing engine.');
    });
  });

  it('dismisses suggestion card without modifying form when Dismiss clicked', async () => {
    vi.spyOn(api, 'analyzeRepo').mockResolvedValue({
      name: 'dismissed-repo',
      description: 'Will not apply',
      stack: ['Go'],
      category: 'CLI Tool',
      source: 'github-only',
      repoUrl: 'https://github.com/owner/dismissed-repo',
    });

    renderDialog();

    const input = screen.getByPlaceholderText('https://github.com/owner/repo');
    fireEvent.change(input, { target: { value: 'https://github.com/owner/dismissed-repo' } });

    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));

    const dismissBtn = await screen.findByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByText('dismissed-repo')).not.toBeInTheDocument();
      const nameInput = screen.getByLabelText(/project name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });
  });
});
