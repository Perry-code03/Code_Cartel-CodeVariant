import { Project, PlanTask } from '@/types';

export function generatePhoenixSprintTasks(project: Project): PlanTask[] {
  const brokeSnippet = project.autopsy?.whatBroke
    ? project.autopsy.whatBroke.slice(0, 45).trim()
    : 'core blocker';

  const defaultTasks: PlanTask[] = [
    {
      id: `task-d1-1`,
      text: `Strip secondary features and scope down to the bare single-purpose MVP`,
      done: false,
    },
    {
      id: `task-d1-2`,
      text: `Audit and patch blocker: "${brokeSnippet}..."`,
      done: false,
    },
    {
      id: `task-d2-1`,
      text: `Isolate and test primary user journey from login/start to completion`,
      done: false,
    },
    {
      id: `task-d2-2`,
      text: `Connect and verify active integrations and environment secrets`,
      done: false,
    },
    {
      id: `task-d3-1`,
      text: `Containerize or configure production hosting environment`,
      done: false,
    },
    {
      id: `task-d3-2`,
      text: `Deploy to public URL and announce revival to community`,
      done: false,
    },
  ];

  return defaultTasks;
}
