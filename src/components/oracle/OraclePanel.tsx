import React, { useState } from 'react';
import { useStore } from '@/store/StoreProvider';
import { queryGraveyardOracle, buildGraveyardContext, OracleResponse } from '@/lib/oracle';
import { chatWithOracle } from '@/lib/api';
import { MatrixLoader } from '@/components/motion/MatrixLoader';
import { ThinkingStates } from '@/components/motion/ThinkingStates';
import { StreamingText } from '@/components/motion/StreamingText';
import { Sparkles, Send, X, Bot, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OracleMessage {
  id: string;
  sender: 'user' | 'oracle';
  text: string;
  responseMeta?: OracleResponse;
  source?: 'ai' | 'local';
  aiProviderName?: string;
  notice?: string;
}

interface OraclePanelProps {
  open: boolean;
  onClose: () => void;
}

export const OraclePanel: React.FC<OraclePanelProps> = ({ open, onClose }) => {
  const { state } = useStore();
  const [aiMode, setAiMode] = useState<boolean>(false);
  const [messages, setMessages] = useState<OracleMessage[]>([
    {
      id: 'welcome',
      sender: 'oracle',
      text: 'I am the Graveyard Oracle. Ask me anything about your buried projects, resuscitation likelihoods, or salvaged components.',
      source: 'local',
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  if (!open) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isThinking) return;

    const userMsg: OracleMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    if (aiMode) {
      try {
        const graveyardContext = buildGraveyardContext(state);
        const res = await chatWithOracle(textToSend.trim(), graveyardContext);

        if (res.fallback || !res.answer) {
          // Fall back gracefully to the deterministic rule-based oracle
          const localRes = queryGraveyardOracle(textToSend, state);
          const oracleMsg: OracleMessage = {
            id: `ora-${Date.now()}`,
            sender: 'oracle',
            text: localRes.answer,
            responseMeta: localRes,
            source: 'local',
            notice: res.notice || 'AI Oracle unavailable. Displaying local rule-based heuristic.',
          };
          setMessages((prev) => [...prev, oracleMsg]);
        } else {
          const oracleMsg: OracleMessage = {
            id: `ora-${Date.now()}`,
            sender: 'oracle',
            text: res.answer,
            source: 'ai',
            aiProviderName: res.aiProviderName || 'Groq',
            responseMeta: {
              intent: 'ai_response',
              answer: res.answer,
              suggestedFollowUps: res.suggestedFollowUps,
            },
          };
          setMessages((prev) => [...prev, oracleMsg]);
        }
      } catch {
        const localRes = queryGraveyardOracle(textToSend, state);
        const oracleMsg: OracleMessage = {
          id: `ora-${Date.now()}`,
          sender: 'oracle',
          text: localRes.answer,
          responseMeta: localRes,
          source: 'local',
          notice: 'Connection failed. Displaying local rule-based heuristic.',
        };
        setMessages((prev) => [...prev, oracleMsg]);
      } finally {
        setIsThinking(false);
      }
    } else {
      // Simulate short thinking delay (about 400 ms) for local heuristic
      setTimeout(() => {
        const oracleRes = queryGraveyardOracle(textToSend, state);
        const oracleMsg: OracleMessage = {
          id: `ora-${Date.now()}`,
          sender: 'oracle',
          text: oracleRes.answer,
          responseMeta: oracleRes,
          source: 'local',
        };
        setMessages((prev) => [...prev, oracleMsg]);
        setIsThinking(false);
      }, 400);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-surface/95 backdrop-blur-md border-l border-border shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="p-4 border-b border-border bg-surface flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet/20 border border-violet/40 text-violet-soft">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-text flex items-center gap-1.5">
                Graveyard Oracle
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                    aiMode
                      ? 'bg-violet/15 border-violet/40 text-violet-soft'
                      : 'bg-acid/10 border-acid/30 text-acid'
                  }`}
                >
                  {aiMode ? 'AI (BETA)' : 'LOCAL'}
                </span>
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
            aria-label="Close Oracle"
          >
            <X size={18} />
          </button>
        </div>

        {/* Engine mode switcher */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
          <span className="text-[11px] font-mono text-muted">Advisor Mode:</span>
          <div className="inline-flex rounded-lg bg-surface-2 p-0.5 border border-border">
            <button
              type="button"
              onClick={() => setAiMode(false)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid ${
                !aiMode
                  ? 'bg-surface text-acid font-medium shadow-sm'
                  : 'text-muted hover:text-text'
              }`}
              aria-pressed={!aiMode}
            >
              Rule-Based
            </button>
            <button
              type="button"
              onClick={() => setAiMode(true)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet ${
                aiMode
                  ? 'bg-violet/25 text-violet-soft border border-violet/40 font-medium shadow-sm'
                  : 'text-muted hover:text-text'
              }`}
              aria-pressed={aiMode}
            >
              <Sparkles size={12} />
              AI Advisor
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Engine info banner */}
      <div className="px-4 py-2 border-b border-border/50 text-[10px] font-mono leading-relaxed bg-surface-2/40">
        {!aiMode ? (
          <p className="text-muted flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-acid shrink-0" />
            <span>Rule-based heuristic. Queries run 100% locally on your machine.</span>
          </p>
        ) : (
          <p className="text-muted flex items-start gap-1.5">
            <Sparkles size={12} className="text-violet-soft shrink-0 mt-0.5" />
            <span>
              Opt-in AI: Queries and project summaries are sent to our serverless route and forwarded to your configured AI provider. No data is stored.
            </span>
          </p>
        )}
      </div>

      {/* Message History */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs"
        aria-live="polite"
      >
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-1 text-[10px] text-muted mb-1">
              {msg.sender === 'oracle' && <Bot size={12} className="text-violet-soft" />}
              <span>{msg.sender === 'oracle' ? 'ORACLE' : 'YOU'}</span>
            </div>

            <div
              className={`p-3 rounded-xl max-w-[90%] whitespace-pre-wrap leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-violet text-white font-sans text-xs'
                  : 'bg-surface-2 border border-border text-text'
              }`}
            >
              {msg.notice && (
                <div className="mb-2 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1.5 font-mono">
                  <AlertTriangle size={12} className="shrink-0" />
                  <span>{msg.notice}</span>
                </div>
              )}

              {msg.source === 'ai' && (
                <div className="mb-1.5 text-[10px] font-mono text-violet-soft flex items-center gap-1">
                  <Sparkles size={11} />
                  Suggested by AI ({msg.aiProviderName || 'AI'}), please review
                </div>
              )}

              {msg.source === 'local' && msg.sender === 'oracle' && (
                <div className="mb-1 text-[10px] font-mono text-muted">
                  Rule-based heuristic
                </div>
              )}

              {msg.sender === 'oracle' && idx === messages.length - 1 ? (
                <StreamingText text={msg.text} speedMs={20} />
              ) : (
                msg.text
              )}
            </div>

            {/* Follow-up Chips */}
            {msg.responseMeta?.suggestedFollowUps && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {msg.responseMeta.suggestedFollowUps.map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(chip)}
                    className="text-[11px] font-mono px-2 py-1 rounded-md bg-surface border border-border text-muted hover:text-acid hover:border-acid/40 transition-colors text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-acid"
                  >
                    ↳ {chip}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Thinking / Matrix Indicator */}
        {isThinking && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border">
            <MatrixLoader />
            <ThinkingStates />
          </div>
        )}
      </div>

      {/* Suggested Quick Starters (if only welcome message) */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-2">
            Suggested Queries:
          </p>
          <div className="flex flex-col gap-1.5">
            {[
              'Which project should I revive first?',
              'Give me a summary of my graveyard',
              'What components can I salvage?',
              'How is the Resurrection Score calculated?',
            ].map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(prompt)}
                className="text-left font-mono text-xs px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface border border-border text-text hover:border-violet/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet"
              >
                &gt; {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 border-t border-border bg-surface">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              aiMode
                ? 'Ask the AI Oracle (e.g. Can I salvage anything from my old bots?)'
                : 'Ask the Oracle (e.g. Which project to revive?)'
            }
            className="bg-surface-2 border-border text-text font-mono text-xs focus-visible:ring-violet"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isThinking}
            className={`${
              aiMode
                ? 'bg-violet text-white hover:bg-violet/90'
                : 'bg-acid text-bg hover:bg-acid/90'
            } font-mono text-xs transition-colors`}
          >
            <Send size={14} />
          </Button>
        </form>
      </div>
    </div>
  );
};
