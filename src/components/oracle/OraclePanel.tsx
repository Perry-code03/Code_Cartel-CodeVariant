import React, { useState } from 'react';
import { useStore } from '@/store/StoreProvider';
import { queryGraveyardOracle, OracleResponse } from '@/lib/oracle';
import { MatrixLoader } from '@/components/motion/MatrixLoader';
import { ThinkingStates } from '@/components/motion/ThinkingStates';
import { StreamingText } from '@/components/motion/StreamingText';
import { Sparkles, Send, X, Bot, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OracleMessage {
  id: string;
  sender: 'user' | 'oracle';
  text: string;
  responseMeta?: OracleResponse;
}

interface OraclePanelProps {
  open: boolean;
  onClose: () => void;
}

export const OraclePanel: React.FC<OraclePanelProps> = ({ open, onClose }) => {
  const { state } = useStore();
  const [messages, setMessages] = useState<OracleMessage[]>([
    {
      id: 'welcome',
      sender: 'oracle',
      text: 'I am the Graveyard Oracle. Ask me anything about your buried projects, resuscitation likelihoods, or salvaged components.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  if (!open) return null;

  const handleSend = (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg: OracleMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Simulate short thinking delay (about 850 ms) to showcase thinking states & matrix loader
    setTimeout(() => {
      const oracleRes = queryGraveyardOracle(textToSend, state);
      const oracleMsg: OracleMessage = {
        id: `ora-${Date.now()}`,
        sender: 'oracle',
        text: oracleRes.answer,
        responseMeta: oracleRes,
      };
      setMessages((prev) => [...prev, oracleMsg]);
      setIsThinking(false);
    }, 850);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-surface/95 backdrop-blur-md border-l border-border shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet/20 border border-violet/40 text-violet-soft">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-text flex items-center gap-1.5">
              Graveyard Oracle
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-acid/10 border border-acid/30 text-acid">
                LOCAL
              </span>
            </h3>
            <p className="text-[10px] font-mono text-muted flex items-center gap-1 mt-0.5">
              <ShieldCheck size={11} className="text-acid" />
              Rule-based heuristic. No data leaves your machine.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2"
          aria-label="Close Oracle"
        >
          <X size={18} />
        </button>
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
                    className="text-[11px] font-mono px-2 py-1 rounded-md bg-surface border border-border text-muted hover:text-acid hover:border-acid/40 transition-colors text-left"
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
                className="text-left font-mono text-xs px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface border border-border text-text hover:border-violet/50 transition-colors"
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
            placeholder="Ask the Oracle (e.g. Which project to revive?)"
            className="bg-surface-2 border-border text-text font-mono text-xs"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs"
          >
            <Send size={14} />
          </Button>
        </form>
      </div>
    </div>
  );
};
