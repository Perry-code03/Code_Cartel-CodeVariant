import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const questions = [
  {
    question: 'Where is my data stored?',
    answer: 'Projects, autopsies, scores, salvaged components, and roadmap events are saved in this browser’s local storage. They stay in this browser profile unless you choose an online feature or export them.',
  },
  {
    question: 'Do I need an account or internet?',
    answer: 'There is no account. After the app loads, your register and rule-based tools run in the browser; GitHub import and provider-backed features need an internet connection.',
  },
  {
    question: 'What does the GitHub import do, and does it see private repos?',
    answer: 'When you choose import, the app’s route reads public repository details, language data, root manifests, and a short README excerpt to prepare a project record. Private repositories are not supported.',
  },
  {
    question: 'What is sent when I use the AI suggestions, and can I turn it off?',
    answer: 'AI autopsy sends project details to the app route; a configured provider receives the name, category, stack, description, and any supplied excerpt. GitHub import may send the repository name, description, topics, languages, detected stack, and README excerpt (not raw manifests); AI Oracle sends your question and up to ten project summaries. Skip AI autopsy, use manual entry, and keep Oracle in local mode to avoid provider requests; output is labeled “suggested, please review,” and local fallbacks remain available.',
  },
  {
    question: 'What is the Resurrection Score and how reliable is it?',
    answer: 'It is a rule-based heuristic from your completion, reusable parts, willingness, available time, scope clarity, and blockers. It is a guide, not a prediction or a validated measure.',
  },
  {
    question: 'What do Phoenix, Pivot, Salvage and Archive mean?',
    answer: 'Phoenix starts a focused revival, Pivot keeps useful work while changing direction, Salvage saves reusable parts, and Archive closes the record and leaves it at rest.',
  },
  {
    question: 'Can I export or delete everything?',
    answer: 'You can export the register as JSON or Markdown, delete projects and their linked parts, or remove salvaged components. There is no one-click clear-all control; restoring a valid JSON backup replaces the active register.',
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
