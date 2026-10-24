// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AutopsyWizardPage } from '../AutopsyWizardPage';
import { StoreProvider } from '@/store/StoreProvider';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as api from '@/lib/api';

describe('AutopsyWizardPage - Evidence-based AI Diagnostic Assist', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderPage = (projectId = 'seed-email-worker') => {
    return render(
      <MemoryRouter initialEntries={[`/autopsy/${projectId}`]}>
        <StoreProvider>
          <Routes>
            <Route path="/autopsy/:id" element={<AutopsyWizardPage />} />
          </Routes>
        </StoreProvider>
      </MemoryRouter>
    );
  };

  it('renders the opt-in AI Post-Mortem Diagnostic Assist banner', () => {
    renderPage();
    expect(screen.getByText('AI Post-Mortem Diagnostic Assist')).toBeInTheDocument();
    expect(screen.getByText('OPT-IN')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /auto-suggest with ai/i })
    ).toBeInTheDocument();
  });

  it('fetches evidence-based suggestions and displays activity facts box with data label', async () => {
    vi.spyOn(api, 'suggestAutopsy').mockResolvedValue({
      whatWasBuilt: 'Node.js email queue with template renderer and SMTP transporter.',
      whatBroke: 'RabbitMQ connection pool starved under burst email delivery spikes.',
      activityFacts: [
        'Last commit: 14 months ago',
        'Repository created: March 2024',
        'README mentions TODO markers',
      ],
      source: 'ai',
      aiProviderName: 'Groq',
    });

    renderPage();

    const suggestBtn = screen.getByRole('button', { name: /auto-suggest with ai/i });
    fireEvent.click(suggestBtn);

    expect(
      await screen.findByText('Suggested by AI (Groq), please review')
    ).toBeInTheDocument();

    // Verify activity facts box
    expect(screen.getByText(/Activity facts \(from repository data\):/i)).toBeInTheDocument();
    expect(screen.getByText('Last commit: 14 months ago')).toBeInTheDocument();
    expect(screen.getByText('Repository created: March 2024')).toBeInTheDocument();
    expect(screen.getByText('README mentions TODO markers')).toBeInTheDocument();

    // Verify evidence content
    expect(
      screen.getByText('RabbitMQ connection pool starved under burst email delivery spikes.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Node.js email queue with template renderer and SMTP transporter.')
    ).toBeInTheDocument();

    // Verify transparency note explaining what was sent
    expect(
      screen.getByText(/Data sent to AI: project name, stack, category, and description\/README excerpt/i)
    ).toBeInTheDocument();

    // Verify NO personal reasons or score pre-filling in suggestion card
    expect(screen.queryByText(/Suggested Why Momentum Died/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Stop Category:/i)).not.toBeInTheDocument();
  });

  it('applies only whatWasBuilt and whatBroke to form, never score-altering fields', async () => {
    vi.spyOn(api, 'suggestAutopsy').mockResolvedValue({
      whatWasBuilt: 'Express API with JWT middleware and PostgreSQL user accounts table.',
      whatBroke: 'Race condition occurred during Redis session token revocation.',
      activityFacts: ['Last commit: 6 months ago'],
      source: 'ai',
      aiProviderName: 'Groq',
    });

    renderPage();

    const suggestBtn = screen.getByRole('button', { name: /auto-suggest with ai/i });
    fireEvent.click(suggestBtn);

    const applyBtn = await screen.findByRole('button', { name: /apply to form/i });
    fireEvent.click(applyBtn);

    expect(
      screen.getByText(/Evidence-based suggestions applied to form/i)
    ).toBeInTheDocument();

    // Verify whatWasBuilt on Step 1
    const builtInput = screen.getByPlaceholderText(/e\.g\. Express server with JWT/i) as HTMLTextAreaElement;
    expect(builtInput.value).toBe(
      'Express API with JWT middleware and PostgreSQL user accounts table.'
    );

    // Move to step 2 to verify whatBroke
    const nextBtn = screen.getByRole('button', { name: /next: what broke/i });
    fireEvent.click(nextBtn);

    const whatBrokeInput = screen.getByPlaceholderText(/e\.g\. Race condition during token refresh/i) as HTMLTextAreaElement;
    expect(whatBrokeInput.value).toBe(
      'Race condition occurred during Redis session token revocation.'
    );

    // Move to step 3 (Why stopped) - verify whyStopped was NOT overwritten by AI
    const nextStep3Btn = screen.getByRole('button', { name: /next: why it stopped/i });
    fireEvent.click(nextStep3Btn);

    const whyStoppedInput = screen.getByPlaceholderText(/e\.g\. Got overwhelmed debugging Redis/i) as HTMLTextAreaElement;
    expect(whyStoppedInput.value).not.toBe('Personal burnout');
    expect(whyStoppedInput.value).toBe(
      'Wanted to add a visual WYSIWYG editor and analytics dashboard before shipping the barebones CLI worker.'
    );

    // Verify Step 3 has personal reflection badge and is user-written only
    expect(screen.getByText('Personal reflection (user-written)')).toBeInTheDocument();
  });

  it('displays not enough information note when whatBroke is missing', async () => {
    vi.spyOn(api, 'suggestAutopsy').mockResolvedValue({
      whatWasBuilt: 'CLI parser.',
      whatBroke: null,
      activityFacts: ['Last commit: 3 months ago'],
      source: 'ai',
      aiProviderName: 'Groq',
    });

    renderPage();

    const suggestBtn = screen.getByRole('button', { name: /auto-suggest with ai/i });
    fireEvent.click(suggestBtn);

    expect(
      await screen.findByText(/Not enough information in the repo \(left empty for you to fill\)/i)
    ).toBeInTheDocument();
  });

  it('dismisses suggestions without altering form fields when Dismiss is clicked', async () => {
    vi.spyOn(api, 'suggestAutopsy').mockResolvedValue({
      whatWasBuilt: 'Temporary prototype.',
      whatBroke: 'Unknown error.',
      activityFacts: [],
      source: 'ai',
      aiProviderName: 'Groq',
    });

    renderPage();

    const suggestBtn = screen.getByRole('button', { name: /auto-suggest with ai/i });
    fireEvent.click(suggestBtn);

    const dismissBtn = await screen.findByRole('button', { name: 'Dismiss' });
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByText('Suggested by AI (Groq), please review')).not.toBeInTheDocument();
    });
  });
});
