import { Project, SalvagedComponent, RoadmapEvent } from '@/types';
import { computeResurrectionScore } from './score';

export function generateProjectMarkdown(
  project: Project,
  components: SalvagedComponent[] = [],
  events: RoadmapEvent[] = []
): string {
  const autopsy = project.autopsy;
  const scoreData = autopsy
    ? computeResurrectionScore({
        completion: project.completion,
        willingness: autopsy.willingness,
        usefulComponents: autopsy.usefulComponents,
        hoursAvailable: autopsy.hoursAvailable,
        scopeClarity: autopsy.scopeClarity,
        blockerSeverity: autopsy.blockerSeverity,
      })
    : null;

  const lines: string[] = [];

  lines.push(`# ${project.name}`);
  lines.push(`> *${project.description}*`);
  lines.push('');
  lines.push(`- **Status:** \`${project.status.toUpperCase()}\``);
  lines.push(`- **Category:** ${project.category}`);
  lines.push(`- **Tech Stack:** ${project.stack.join(', ')}`);
  lines.push(`- **Completion:** ${project.completion}%`);
  lines.push(`- **Last Active:** ${new Date(project.lastActiveAt).toLocaleDateString()}`);
  lines.push(`- **Buried Date:** ${new Date(project.createdAt).toLocaleDateString()}`);
  lines.push('');

  // Resurrection Score
  if (scoreData) {
    lines.push('## Resurrection Score Analysis');
    lines.push(`**Score:** \`${scoreData.score}/100\` — **Band:** ${scoreData.bandLabel}`);
    lines.push(`*(Rule-based heuristic evaluated on ${scoreData.factorsAnsweredCount} of 6 factors)*`);
    lines.push('');
    lines.push('| Factor | Score Earned | Weight | Details |');
    lines.push('|---|---|---|---|');
    for (const factor of scoreData.breakdown) {
      if (factor.answered) {
        lines.push(
          `| ${factor.name} | ${factor.pointsEarned.toFixed(1)} pts | ${factor.weight} | ${factor.rawValue ?? ''} |`
        );
      }
    }
    lines.push('');
  }

  // Autopsy Post-Mortem
  if (autopsy) {
    lines.push('## Post-Mortem Autopsy');
    lines.push(`- **Stop Category:** \`${autopsy.stopCategory.toUpperCase()}\``);
    lines.push(`- **Willingness to Revive:** ${autopsy.willingness} / 5`);
    lines.push('');
    lines.push('### What Was Built');
    lines.push(autopsy.whatWasBuilt);
    lines.push('');
    lines.push('### What Broke');
    lines.push(autopsy.whatBroke);
    lines.push('');
    lines.push('### Why Development Stopped');
    lines.push(autopsy.whyStopped);
    lines.push('');
  }

  // Active Revival Plan
  if (project.plan) {
    lines.push('## Active Revival Plan');
    lines.push(`- **Selected Path:** \`${project.plan.path.toUpperCase()}\``);
    lines.push(`- **Initiated:** ${new Date(project.plan.chosenAt).toLocaleDateString()}`);
    if (project.plan.notes) {
      lines.push(`- **Notes:** ${project.plan.notes}`);
    }

    if (project.plan.path === 'phoenix' && project.plan.tasks) {
      lines.push('');
      lines.push('### 3-Day Phoenix Sprint Tasks');
      for (const t of project.plan.tasks) {
        lines.push(`- [${t.done ? 'x' : ' '}] ${t.text}`);
      }
    }

    if (project.plan.path === 'pivot') {
      lines.push('');
      lines.push(`### Pivot Direction`);
      lines.push(`> ${project.plan.pivotDirection}`);
      lines.push('');
      lines.push(`### Pivot Rationale`);
      lines.push(project.plan.pivotReason || '');
    }

    if (project.plan.path === 'archive' && project.plan.epitaph) {
      lines.push('');
      lines.push(`### Engraved Epitaph`);
      lines.push(`> "${project.plan.epitaph}"`);
    }
    lines.push('');
  }

  // Salvaged Reusable Components
  if (components.length > 0) {
    lines.push(`## Salvaged Components (${components.length})`);
    for (const comp of components) {
      lines.push(`### ${comp.name} [${comp.type}]`);
      lines.push(`*${comp.description}*`);
      lines.push(`- Tags: ${comp.tags.join(', ')}`);
      lines.push('');

      // Find max backtick run in content to guarantee safe outer fence
      const maxTicks = (comp.content.match(/`+/g) || []).reduce(
        (max, match) => Math.max(max, match.length),
        0
      );
      const fence = '`'.repeat(Math.max(3, maxTicks + 1));

      lines.push(fence);
      lines.push(comp.content);
      lines.push(fence);
      lines.push('');
    }
  }

  // Roadmap Log
  if (events.length > 0) {
    lines.push('## Lifecycle Roadmap Log');
    for (const event of events) {
      lines.push(`- **${new Date(event.at).toISOString().split('T')[0]}**: ${event.message}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('*Exported from The Project Graveyard. Local browser storage only.*');

  return lines.join('\n');
}

export function generateAllProjectsMarkdownSummary(
  projects: Project[],
  components: SalvagedComponent[] = []
): string {
  const lines: string[] = [];
  lines.push('# The Project Graveyard — Master Post-Mortem Digest');
  lines.push(`*Generated on ${new Date().toISOString().split('T')[0]} | Total Projects: ${projects.length} | Salvaged Components: ${components.length}*`);
  lines.push('');
  lines.push('## Necropolis Vault Overview');
  lines.push('| Project | Status | Category | Completion | Resurrection Score |');
  lines.push('|---|---|---|---|---|');

  for (const p of projects) {
    const score = p.autopsy?.score !== undefined ? `${p.autopsy.score}/100` : 'Not evaluated';
    lines.push(`| ${p.name} | \`${p.status.toUpperCase()}\` | ${p.category} | ${p.completion}% | ${score} |`);
  }
  lines.push('');

  lines.push('## Detailed Project Post-Mortems');
  for (const p of projects) {
    const projectComps = components.filter((c) => c.projectId === p.id);
    lines.push(generateProjectMarkdown(p, projectComps, []));
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadMarkdownFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.md') ? filename : `${filename}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older environments
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
