import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const questions = [
  {
    question: 'Where is my data stored?',
    answer: 'Projects, autopsies, scores, salvaged components, and roadmap events are saved in this browser’s local storage. They stay in this browser profile unless you choose GitHub import, opt in to AI suggestions, or export them.',
  },
  {
    question: 'Do I need an account or internet?',
    answer: 'There is no account. Your register and rule-based tools run in the browser after the app loads. GitHub import and opt-in AI suggestions need an internet connection.',
  },
  {
    question: 'What does the GitHub import do, and does it see private repos?',
    answer: 'When you choose Analyze, your public repository URL goes to this app’s /api/analyze-repo route. That route reads public GitHub repository details, languages, topics, selected root manifests, and a short README excerpt. Private repositories are not supported. If an AI provider is configured, repository details and the README excerpt may also go to that provider for suggestions; the raw manifests are used by the route to detect the stack.',
  },
  {
    question: 'What is sent when I use the AI suggestions, and can I turn it off?',
    answer: 'AI Autopsy is optional: when you choose Auto-Suggest with AI, project name, category, stack, description, and repository text are sent through this app’s /api/suggest-autopsy route to the configured AI provider. GitHub Analyze may also use a configured provider to suggest project fields. Oracle starts in local rule-based mode; if you switch on AI Advisor, your question and up to ten project summaries go through this app’s /api/oracle-chat route to the configured provider. AI results are labeled “Suggested by AI, please review.” Use manual entry and keep Oracle in local mode to avoid AI provider requests; local fallbacks remain available.',
  },
  {
    question: 'What is the Resurrection Score and how reliable is it?',
    answer: 'It is a rule-based heuristic calculated from your autopsy answers, including completion, reusable parts, willingness, available time, scope clarity, and blockers. It is a guide, not a prediction or a validated measure.',
  },
  {
    question: 'What do Phoenix, Pivot, Salvage and Archive mean?',
    answer: 'Phoenix starts a focused revival, Pivot keeps useful work while changing direction, Salvage saves reusable parts, and Archive closes the record and leaves it at rest.',
  },
  {
    question: 'Can I export or delete everything?',
    answer: 'You can download a JSON backup or Markdown project summary, delete individual projects and their linked parts, or remove salvaged components. There is no one-click clear-all control; restoring a valid JSON backup replaces the active register.',
  },
  {
    question: 'Is it only for code projects?',
    answer: 'No. You can enter a project manually; GitHub import is specifically for public code repositories.',
  },
  {
    question: 'Who built this?',
    answer: 'Code_Cartel built it for the PS 05 hackathon.',
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  return (
    <div className="landing-faq">
      {questions.map(({ question, answer }, index) => {
        const isOpen = openIndex === index;
        const panelId = `landing-faq-panel-${index}`;
        return (
          <section className="landing-faq-item" key={question}>
            <h3>
              <button
                type="button"
                className="landing-faq-trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setOpenIndex(isOpen ? null : index);
                  }
                }}
              >
                <span>{question}</span>
                <span className="landing-faq-indicator" aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </button>
            </h3>
            <motion.div
              id={panelId}
              className="landing-faq-panel"
              initial={false}
              animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.24, ease: 'easeInOut' }}
              aria-hidden={!isOpen}
            >
              <p>{answer}</p>
            </motion.div>
          </section>
        );
      })}
    </div>
  );
}
