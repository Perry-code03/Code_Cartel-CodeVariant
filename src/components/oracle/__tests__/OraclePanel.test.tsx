// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { OraclePanel } from '../OraclePanel';
import { StoreProvider } from '@/store/StoreProvider';
import * as api from '@/lib/api';

vi.mock('@/lib/motion', () => ({
  useMotionSafe: () => ({ shouldReduceMotion: true }),
}));

describe('OraclePanel Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderPanel = (open = true) => {
    return render(
      <StoreProvider>
        <OraclePanel open={open} onClose={() => {}} />
      </StoreProvider>
    );
  };

  it('renders with Local Rule-Based mode active by default', () => {
    renderPanel();
    expect(screen.getByText('Graveyard Oracle')).toBeInTheDocument();
    expect(screen.getByText('LOCAL')).toBeInTheDocument();
    expect(
      screen.getByText(/Rule-based heuristic. Queries run 100% locally on your machine./i)
    ).toBeInTheDocument();
  });

  it('toggles between Local Rule-Based and AI Advisor modes', () => {
    renderPanel();

    const aiButton = screen.getByRole('button', { name: /AI Advisor/i });
    fireEvent.click(aiButton);

    expect(screen.getByText('AI (BETA)')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Opt-in AI: Queries and project summaries are sent to our serverless route and forwarded to your configured AI provider. No data is stored./i
      )
    ).toBeInTheDocument();

    const ruleButton = screen.getByRole('button', { name: /Rule-Based/i });
    fireEvent.click(ruleButton);

    expect(screen.getByText('LOCAL')).toBeInTheDocument();
  });

  it('sends question via chatWithOracle when in AI mode and displays AI label', async () => {
    vi.spyOn(api, 'chatWithOracle').mockResolvedValue({
      answer: 'Start with email-worker since it is 80% complete.',
      suggestedFollowUps: ['How to test it?'],
      source: 'ai',
      aiProviderName: 'Groq',
    });

    renderPanel();

    // Switch to AI Advisor mode
    const aiButton = screen.getByRole('button', { name: /AI Advisor/i });
    fireEvent.click(aiButton);

    const input = screen.getByPlaceholderText(/Ask the AI Oracle/i);
    fireEvent.change(input, { target: { value: 'What should I do first?' } });

    const submitBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.chatWithOracle).toHaveBeenCalledWith(
        'What should I do first?',
        expect.any(Array)
      );
    });

    expect(
      await screen.findByText('Suggested by AI (Groq), please review')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(document.body.textContent).toContain(
        'Start with email-worker since it is 80% complete.'
      );
    });
  });

  it('gracefully falls back to local heuristic and displays notice banner if AI fails', async () => {
    vi.spyOn(api, 'chatWithOracle').mockResolvedValue({
      fallback: true,
      notice: 'AI Oracle key not configured. Using local heuristic engine.',
      source: 'local',
    });

    renderPanel();

    // Switch to AI mode
    const aiButton = screen.getByRole('button', { name: /AI Advisor/i });
    fireEvent.click(aiButton);

    const input = screen.getByPlaceholderText(/Ask the AI Oracle/i);
    fireEvent.change(input, { target: { value: 'help' } });

    const submitBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('AI Oracle key not configured. Using local heuristic engine.')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(document.body.textContent).toContain(
        'I am the Graveyard Oracle, a rule-based deterministic diagnostic engine'
      );
    });
  });
});
