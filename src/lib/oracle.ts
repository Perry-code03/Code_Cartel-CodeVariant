import { AppData } from '@/types';
import { generatePhoenixSprintTasks } from './phoenix';

export interface OracleResponse {
  intent: string;
  answer: string;
  suggestedFollowUps?: string[];
  relatedProjectId?: string;
}

export function queryGraveyardOracle(query: string, data: AppData): OracleResponse {
  const q = query.trim().toLowerCase();
  const projects = data.projects;
  const components = data.components;

  // 1. Help intent
  if (q.includes('help') || q.includes('what can you do') || q === '?') {
    return {
      intent: 'help',
      answer: `I am the Graveyard Oracle, a rule-based deterministic diagnostic engine that queries your local graveyard records.

Here is what you can ask me:
• "Which project should I revive first?"
• "Give me a summary of my graveyard"
• "Why did legacy-auth (or any project) stall?"
• "What components can I salvage?"
• "Show me a 3-day revival plan for email-worker"
• "How is the Resurrection Score calculated?"
• "Compare legacy-auth and payment-core"`,
      suggestedFollowUps: [
        'Which project should I revive first?',
        'Give me a summary of my graveyard',
        'What components can I salvage?',
      ],
    };
  }

  // 2. Score calculation formula intent
  if (
    q.includes('how is the score calculated') ||
    q.includes('score formula') ||
    q.includes('score work') ||
    q.includes('heuristic')
  ) {
    return {
      intent: 'score_explanation',
      answer: `The Resurrection Score is a 100-point rule-based heuristic (not AI). It weights 6 post-mortem inputs:

1. Completion % (Weight: 20 pts) — more built means less work remaining.
2. Salvageable Components (Weight: 20 pts) — valuable code assets remaining (capped at 5).
3. Willingness to Continue (Weight: 15 pts) — your personal motivation rated 1 to 5.
4. Sprint Hours Available (Weight: 15 pts) — sprint capacity (capped at 24 hrs for 3 days).
5. Scope Clarity (Weight: 15 pts) — how focused the minimum viable boundary is.
6. Blocker Severity (Weight: 15 pts, inverse) — low blockers award high points.

Skipped optional factors are excluded so you are never penalized for skipping questions!`,
      suggestedFollowUps: ['Which project should I revive first?', 'Give me a summary of my graveyard'],
    };
  }

  // 3. Compare projects intent
  const compareMatch = q.match(/compare\s+([a-zA-Z0-9_-]+)\s+(?:and|with|to)\s+([a-zA-Z0-9_-]+)/);
  if (compareMatch) {
    const nameA = compareMatch[1];
    const nameB = compareMatch[2];
    const projA = projects.find((p) => p.name.toLowerCase().includes(nameA) || p.id.includes(nameA));
    const projB = projects.find((p) => p.name.toLowerCase().includes(nameB) || p.id.includes(nameB));

    if (projA && projB) {
      const scoreA = projA.autopsy?.score ?? 'Unscored';
      const scoreB = projB.autopsy?.score ?? 'Unscored';
      return {
        intent: 'compare_projects',
        answer: `Direct Post-Mortem Comparison:

• ${projA.name} (${projA.category}):
  - Status: ${projA.status.toUpperCase()}
  - Completion: ${projA.completion}%
  - Resurrection Score: ${scoreA}
  - Stop Reason: ${projA.autopsy?.stopCategory ?? 'Unknown'}
  - Stack: ${projA.stack.join(', ')}

• ${projB.name} (${projB.category}):
  - Status: ${projB.status.toUpperCase()}
  - Completion: ${projB.completion}%
  - Resurrection Score: ${scoreB}
  - Stop Reason: ${projB.autopsy?.stopCategory ?? 'Unknown'}
  - Stack: ${projB.stack.join(', ')}

${Number(scoreA) >= Number(scoreB) ? projA.name : projB.name} currently holds higher revival feasibility.`,
        suggestedFollowUps: [`Show me a 3-day plan for ${projA.name}`, `Show me a 3-day plan for ${projB.name}`],
      };
    }
  }

  // 4. Why did <project> stall / post-mortem
  const whyMatch = q.match(/(?:why did|what broke in|what happened to|status of|diagnose)\s+([a-zA-Z0-9_-]+)/);
  const targetProjName = whyMatch ? whyMatch[1] : null;
  const projectByExplicit = targetProjName
    ? projects.find((p) => p.name.toLowerCase().includes(targetProjName) || p.id.includes(targetProjName))
    : null;

  if (projectByExplicit && (q.includes('why') || q.includes('broke') || q.includes('stop') || q.includes('stall'))) {
    const autopsy = projectByExplicit.autopsy;
    if (!autopsy) {
      return {
        intent: 'project_autopsy',
        answer: `${projectByExplicit.name} is resting in the crypt, but no autopsy has been run yet. Perform an autopsy in the Necropolis Vault to analyze why it died.`,
        relatedProjectId: projectByExplicit.id,
      };
    }
    return {
      intent: 'project_autopsy',
      answer: `Post-Mortem for ${projectByExplicit.name}:

• Stop Category: ${autopsy.stopCategory.toUpperCase()}
• What Broke: ${autopsy.whatBroke}
• Why Work Halted: ${autopsy.whyStopped}
• Willingness Rating: ${autopsy.willingness} / 5
• Calculated Score: ${autopsy.score}/100`,
      relatedProjectId: projectByExplicit.id,
      suggestedFollowUps: [
        `Show me a 3-day plan for ${projectByExplicit.name}`,
        'Which project should I revive first?',
      ],
    };
  }

  // 5. 3-day plan for <project>
  if (q.includes('plan') || q.includes('sprint') || q.includes('phoenix')) {
    const matched = projects.find((p) => q.includes(p.name.toLowerCase()));
    if (matched) {
      const tasks = matched.plan?.tasks ?? generatePhoenixSprintTasks(matched);
      const taskList = tasks.map((t, i) => `${i + 1}. [${t.done ? 'DONE' : 'TODO'}] ${t.text}`).join('\n');
      return {
        intent: 'phoenix_plan',
        answer: `Proposed 3-Day Phoenix Sprint for ${matched.name}:

${taskList}

Execute this sprint to bring ${matched.name} from Dead to Live MVP in 72 hours.`,
        relatedProjectId: matched.id,
        suggestedFollowUps: [`Why did ${matched.name} stall?`, 'What components can I salvage?'],
      };
    }
  }

  // 6. Salvage components intent
  if (q.includes('salvage') || q.includes('component') || q.includes('parts') || q.includes('snippet')) {
    if (components.length === 0) {
      return {
        intent: 'salvage_list',
        answer: 'No reusable components have been harvested into the Salvage Market yet. Open any deceased project and harvest useful snippets or schemas.',
      };
    }
    const compSummary = components
      .slice(0, 5)
      .map((c) => `• [${c.type.toUpperCase()}] ${c.name} (from ${c.projectId.replace('seed-', '')})`)
      .join('\n');
    return {
      intent: 'salvage_list',
      answer: `You have ${components.length} components available in your local Salvage Market:

${compSummary}${components.length > 5 ? `\n...and ${components.length - 5} more.` : ''}

You can copy and reuse these snippets in your active production repos right now!`,
      suggestedFollowUps: ['Which project should I revive first?', 'Give me a summary of my graveyard'],
    };
  }

  // 7. Revive first intent (Highest score non-archived)
  if (
    q.includes('revive first') ||
    q.includes('which project') ||
    q.includes('what should i build') ||
    q.includes('highest score') ||
    q.includes('best candidate')
  ) {
    const candidates = projects.filter((p) => p.status !== 'in_stasis' && p.autopsy);
    if (candidates.length === 0) {
      return {
        intent: 'revive_first',
        answer: 'There are currently no active unscored or un-archived projects. Conduct an autopsy on your buried projects first.',
      };
    }

    const sorted = [...candidates].sort((a, b) => (b.autopsy?.score || 0) - (a.autopsy?.score || 0));
    const best = sorted[0];
    const score = best.autopsy?.score;

    return {
      intent: 'revive_first',
      answer: `The prime candidate for revival is **${best.name}** with a Resurrection Score of **${score}/100**.

Why ${best.name}:
• Completion is already at ${best.completion}%
• User willingness to continue is rated ${best.autopsy?.willingness}/5
• Stop cause was '${best.autopsy?.stopCategory}', which a focused 3-day sprint can overcome.

Recommendation: Trigger the Phoenix Protocol and execute the targeted 3-day MVP plan!`,
      relatedProjectId: best.id,
      suggestedFollowUps: [
        `Show me a 3-day plan for ${best.name}`,
        `Why did ${best.name} stall?`,
        'Give me a summary of my graveyard',
      ],
    };
  }

  // 8. Graveyard Summary
  if (q.includes('summary') || q.includes('overview') || q.includes('stats') || q.includes('graveyard')) {
    const total = projects.length;
    const deceased = projects.filter((p) => p.status === 'deceased').length;
    const resurrecting = projects.filter((p) => p.status === 'resurrecting').length;
    const archived = projects.filter((p) => p.status === 'in_stasis').length;
    const salvaged = projects.filter((p) => p.status === 'salvaged').length;

    const scored = projects.filter((p) => p.autopsy);
    const avgScore =
      scored.length > 0
        ? Math.round(scored.reduce((sum, p) => sum + (p.autopsy?.score || 0), 0) / scored.length)
        : 0;

    return {
      intent: 'summary',
      answer: `Necropolis Crypt Audit:

• Total Projects: ${total}
• Deceased: ${deceased}
• Resurrecting: ${resurrecting}
• In Stasis (Archived): ${archived}
• Fully Salvaged: ${salvaged}
• Salvaged Components: ${components.length}
• Average Resurrection Score: ${avgScore}/100 (${scored.length} autopsied)

Your graveyard is well documented. Check the Necropolis Vault or activate the Phoenix Protocol on your top candidates.`,
      suggestedFollowUps: ['Which project should I revive first?', 'What components can I salvage?'],
    };
  }

  // Fallback
  return {
    intent: 'fallback',
    answer: `I could not find a deterministic match for "${query}".

Try asking:
• "Which project should I revive first?"
• "Give me a summary of my graveyard"
• "Why did email-worker stall?"
• "What components can I salvage?"
• "How is the Resurrection Score calculated?"`,
    suggestedFollowUps: ['Which project should I revive first?', 'Give me a summary of my graveyard'],
  };
}
