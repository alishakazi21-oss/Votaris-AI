import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { ChatMessage } from '../../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ChatPanelProps {
  messages: ChatMessage[];
  suggestedQuestions?: string[];
  isLoading?: boolean;
  onSendMessage: (query: string) => void;
  className?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  suggestedQuestions = [],
  isLoading = false,
  onSendMessage,
  className,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className={twMerge('flex flex-col h-full rounded-xl border border-border bg-surface overflow-hidden', className)}>
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={clsx('flex gap-3 text-xs', isUser ? 'justify-end' : 'justify-start')}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={clsx(
                  'rounded-xl p-3.5 max-w-[85%] space-y-2 border shadow-sm leading-relaxed',
                  isUser
                    ? 'bg-elevated border-border text-primary'
                    : 'bg-base border-border/80 text-secondary'
                )}
              >
                <div className="prose prose-invert prose-xs text-primary max-w-none whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Inline Recommendation Card if provided */}
                {msg.recommendation && (
                  <div className="mt-2.5 p-3 rounded-lg border border-accent-amber/40 bg-accent-amber/5 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-accent-amber">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{msg.recommendation.title}</span>
                    </div>
                    <p className="text-[11px] text-secondary">{msg.recommendation.impact}</p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-accent-amber/20 text-accent-amber">
                        Recommendation (not executed)
                      </span>
                    </div>
                  </div>
                )}

                {/* Mini Chart Data */}
                {msg.miniChartData && (
                  <div className="mt-2 p-2 rounded bg-elevated/80 border border-border">
                    <div className="text-[10px] text-muted mb-1 font-mono uppercase">Predicted Energy Gap Horizon (MW)</div>
                    <div className="flex items-end gap-1.5 h-12 pt-2">
                      {msg.miniChartData.map((d, i) => {
                        const isDeficit = d.value < 0;
                        const height = Math.min(100, Math.max(15, Math.abs(d.value) * 2));
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className={clsx('w-full rounded-t-sm', isDeficit ? 'bg-accent-red/80' : 'bg-accent-green/80')}
                              style={{ height: `${height}%` }}
                            />
                            <span className="text-[9px] font-mono text-muted">{d.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-elevated border border-border flex items-center justify-center text-primary shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing State */}
        {isLoading && (
          <div className="flex gap-3 text-xs items-center text-muted">
            <div className="w-7 h-7 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 bg-base p-2.5 rounded-lg border border-border">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-cyan" />
              <span>Analyzing dispatch telemetry & weather models...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Chips */}
      {suggestedQuestions.length > 0 && (
        <div className="px-4 py-2 border-t border-border/50 bg-base/50 flex gap-2 overflow-x-auto">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSendMessage(q)}
              className="px-2.5 py-1 rounded-full border border-border bg-elevated hover:border-accent-cyan/50 text-[11px] text-secondary hover:text-primary whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <span>{q}</span>
              <ArrowRight className="w-3 h-3 text-muted" />
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-surface flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask AI Energy Assistant (e.g., 'What is causing the 19:00 peak deficit?')..."
          className="flex-1 bg-base border border-border rounded-lg px-3.5 py-2 text-xs text-primary focus:border-accent-cyan focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          aria-label="Send message"
          className="px-3.5 py-2 rounded-lg bg-accent-cyan hover:bg-cyan-400 text-base text-black font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
