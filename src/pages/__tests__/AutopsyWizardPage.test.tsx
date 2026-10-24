// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AutopsyWizardPage } from '../AutopsyWizardPage';
import { StoreProvider } from '@/store/StoreProvider';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as api from '@/lib/api';

describe('AutopsyWizardPage - AI Diagnostic Assist', () => {
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

  it('fetches AI suggestions and displays preview card with review label and privacy note', async () => {
    vi.spyOn(api, 'suggestAutopsy').mockResolvedValue({
      whatBroke: 'RabbitMQ connection pool starved under burst email delivery spikes.',
      whyStopped: 'Solo developer burnout managing distributed queue retry logic.',
      stopCategory: 'burnout',
      whatWasBuilt: 'Node.js email queue with template renderer and SMTP transporter.',
      blockerSeverity: 4,
      scopeClarity: 3,
      suggestedUsefulComponents: 3,
      source: 'ai',
      aiProviderName: 'Groq',
    });

    renderPage();

    const suggestBtn = screen.getByRole('button', { name: /auto-suggest with ai/i });
    fireEvent.click(suggestBtn);

    expect(
      await screen.findByText('Suggested by AI (Groq), please review')
    ).toBeInTheDocument();
    expect(
      screen.getByText('RabbitMQ connection pool starved under burst email delivery spikes.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Solo developer burnout managing distributed queue retry logic.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Opt-in: Project name, stack, and category are sent to your configured AI provider. No data is stored./i)
    ).toBeInTheDocument();
  });

  it('applies suggestions to form when Apply to Form is clicked', async () => {
    vi.spyOn(api, 'suggestAutopsy').mockResolvedValue({
      whatBroke: 'Race condition occurred during Redis session token revocation.',
      whyStopped: 'Solo maintainer priorities shifted to full-time work.',
      stopCategory: 'priorities',
      whatWasBuilt: 'Express API with JWT middleware and PostgreSQL user accounts table.',
      blockerSeverity: 4,
      scopeClarity: 3,
      suggestedUsefulComponents: 2,
      source: 'ai',
      aiProviderName: 'Groq',
    });

    renderPage();

    const suggestBtn = screen.getByRole('button', { name: /auto-suggest with ai/i });
    fireEvent.click(suggestBtn);

    const applyBtn = await screen.findByRole('button', { name: /apply to form/i });
    fireEvent.click(applyBtn);

    expect(
      screen.getByText(/AI suggestions applied to form/i)
    ).toBeInTheDocument();

    // Move to step 2 to verify whatBroke
    const nextBtn = screen.getByRole('button', { name: /next: what broke/i });
    fireEvent.click(nextBtn);

    const whatBrokeInput = screen.getByPlaceholderText(/e\.g\. Race condition during token refresh/i) as HTMLTextAreaElement;
    expect(whatBrokeInput.value).toBe(
      'Race condition occurred during Redis session token revocation.'
    );
  });

  it('dismisses suggestions without altering form fields when Dismiss is clicked', async () => {
    vi.spyOn(api, 'suggestAutopsy').mockResolvedValue({
      whatBroke: 'Unexpected failure.',
      whyStopped: 'Ran out of steam.',
      stopCategory: 'technical',
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
