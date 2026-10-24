// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LandingFaq } from '../LandingFaq';

afterEach(cleanup);

describe('LandingFaq', () => {
  it('opens and closes a question with its button', () => {
    render(<LandingFaq />);
    const question = screen.getByRole('button', { name: /where is my data stored/i });
    const panel = document.getElementById(question.getAttribute('aria-controls')!);

    fireEvent.click(question);
    expect(question).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toHaveAttribute('aria-hidden', 'false');

    fireEvent.click(question);
    expect(question).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps only one answer open at a time', () => {
    render(<LandingFaq />);
    const first = screen.getByRole('button', { name: /where is my data stored/i });
    const second = screen.getByRole('button', { name: /do i need an account or internet/i });

    fireEvent.click(first);
    fireEvent.click(second);

    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'true');
  });

  it.each(['Enter', ' '])('supports %s keyboard activation', (key) => {
    render(<LandingFaq />);
    const question = screen.getByRole('button', { name: /where is my data stored/i });
    question.focus();
    expect(question).toHaveFocus();
    fireEvent.keyDown(question, { key });
    expect(question).toHaveAttribute('aria-expanded', 'true');
  });
});
