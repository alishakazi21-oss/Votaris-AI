import React, { useState } from 'react';
import { apiClient } from '../../services/api/apiClient';
import { useUiStore } from '../../store/uiStore';
import { ChatMessage } from '../../types';
import { ChatPanel } from '../../components/ui/ChatPanel';
import { Card, CardHeader } from '../../components/ui/Card';
import { Bot, Sparkles, AlertCircle, Database, Shield } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'What is causing the predicted 19:00 evening peak deficit?',
  'What is the optimal battery dispatch window for maximum tariff arbitrage?',
  'How will the incoming afternoon cloud cover impact solar generation?',
  'Which EV charging stations should be throttled during peak hours?',
  'Explain the attention weights for tomorrow’s day-ahead solar forecast.',
  'What are the estimated savings if we shift 35% of EV charging to midday?',
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init',
    role: 'assistant',
    content:
      'Welcome to **Voltaris AI Dispatch Assistant**. I have live context over Pune Smart Grid Hub telemetry, day-ahead LSTM forecasting models, and current ToD tariff schedules.\n\nAsk me about upcoming energy gaps, optimal battery charge windows, or operational dispatch strategies.',
    timestamp: new Date().toISOString(),
  },
];

export const AiAssistantPage: React.FC = () => {
  const { selectedLocation, lastRefreshed } = useUiStore();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const reply = await apiClient.sendChatMessage(text);
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          'Error connecting to dispatch inference model. Operating in rule-based fallback mode.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">AI Energy Dispatch Assistant</h2>
          <p className="text-xs text-secondary mt-0.5">
            Context-aware LLM reasoning agent grounded in real-time grid telemetry and physical constraints.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 text-[11px] font-mono text-accent-cyan">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rule-Based / Local ML Mode Active</span>
          </span>
        </div>
      </div>

      {/* Main Chat Grid: 8 cols chat + 4 cols context inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Left: Chat Panel */}
        <div className="lg:col-span-8 h-full min-h-0">
          <ChatPanel
            messages={messages}
            suggestedQuestions={SUGGESTED_QUESTIONS}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            className="h-full"
          />
        </div>

        {/* Right: Live Context Inspector */}
        <div className="lg:col-span-4 space-y-4 overflow-y-auto">
          <Card>
            <CardHeader
              title="Active In-Context Telemetry"
              subtitle="Data grounding the AI assistant's responses"
            />
            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-base border border-border/80 space-y-1">
                <div className="flex items-center justify-between text-muted text-[11px]">
                  <span>Monitored Node:</span>
                  <span className="text-accent-cyan font-mono font-semibold">{selectedLocation.name}</span>
                </div>
                <div className="flex items-center justify-between text-muted text-[11px]">
                  <span>Installed Solar:</span>
                  <span className="text-primary font-mono">{selectedLocation.installedSolarMW} MW</span>
                </div>
                <div className="flex items-center justify-between text-muted text-[11px]">
                  <span>Installed Wind:</span>
                  <span className="text-primary font-mono">{selectedLocation.installedWindMW} MW</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-base border border-border/80 space-y-1">
                <div className="font-semibold text-primary flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-accent-green" />
                  <span>Grounding Vector Memory</span>
                </div>
                <p className="text-[11px] text-secondary leading-relaxed">
                  24h Attention-LSTM forecast embeddings, Maharashtra ToD tariff schedule, and 4 active stability advisories.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-accent-amber/10 border border-accent-amber/30 text-[11px] text-accent-amber space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Safety Guardrails Enforced</span>
                </div>
                <p>
                  Assistant outputs are strictly advisory. Actions require human operator verification before submission to SCADA.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
