import { describe, it, expect } from 'vitest';
import { generateProjectMarkdown } from '../markdown';
import { getInitialSeedData } from '@/data/seed';

describe('Markdown Dossier Generator', () => {
  const seedData = getInitialSeedData();
  const emailWorker = seedData.projects.find((p) => p.id === 'seed-email-worker')!;
  const emailComponents = seedData.components.filter((c) => c.projectId === emailWorker.id);
  const emailEvents = seedData.events.filter((e) => e.projectId === emailWorker.id);

  it('generates a complete valid markdown export for email-worker', () => {
    const md = generateProjectMarkdown(emailWorker, emailComponents, emailEvents);

    expect(md).toContain('# email-worker');
    expect(md).toContain('`RESURRECTING`');
    expect(md).toContain('Resurrection Score Analysis');
    expect(md).toContain('Post-Mortem Autopsy');
    expect(md).toContain('Active Revival Plan');
    expect(md).toContain('3-Day Phoenix Sprint Tasks');
    expect(md).toContain('Salvaged Components');
    expect(md).toContain('queue-retry-worker');
    expect(md).toContain('email-template-grid');
    expect(md).toContain('Lifecycle Roadmap Log');
    expect(md).toContain('Exported from The Project Graveyard');
  });

  it('safely fences code blocks even when content contains backticks', () => {
    const customProject = {
      ...emailWorker,
      name: 'backtick-test',
    };
    const customComp = {
      id: 'comp-ticks',
      projectId: customProject.id,
      name: 'nested-ticks-snippet',
      type: 'snippet' as const,
      description: 'Contains triple backticks in content',
      stack: ['Markdown'],
      content: 'Here is some code ```js\nconst a = 1;\n``` inside',
      tags: ['test'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const md = generateProjectMarkdown(customProject, [customComp], []);
    // Outer fence must have at least 4 backticks
    expect(md).toContain('````');
    expect(md).toContain('const a = 1;');
  });
});
