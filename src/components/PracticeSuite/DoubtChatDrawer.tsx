import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, X, Sparkles, RefreshCw, MessageSquare } from 'lucide-react';
import { DoubtChatMessage } from '../../types';

interface DoubtChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuestionText?: string;
  topic?: string;
}

export const DoubtChatDrawer: React.FC<DoubtChatDrawerProps> = ({
  isOpen,
  onClose,
  currentQuestionText,
  topic,
}) => {
  const [messages, setMessages] = useState<DoubtChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: `Hello! I'm your dedicated AI Exam Preparation Tutor. Ask me any doubt about concepts, edge cases, distractor analysis, or optimal solutions.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMsg: DoubtChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/practice/ask-doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionContext: currentQuestionText || `Topic: ${topic}`,
          userQuery: userMsg.text,
          conversationHistory: messages.slice(-4),
        }),
      });
      const data = await res.json();
      const aiReply: DoubtChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Here is the conceptual breakdown for your query...',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to connect to AI study assistant at the moment. Please try again.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside aria-label="AI Study Assistant" className="fixed bottom-4 right-4 sm:right-8 z-40 w-96 max-w-[calc(100vw-2rem)] h-[540px] bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>AI Exam Study Assistant</span>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 rounded font-mono">LLM</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
              {topic ? `Topic: ${topic}` : 'Context-aware doubt solver'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/50">
        {currentQuestionText && (
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 mb-2">
            <div className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold mb-1">
              Active Question Context:
            </div>
            <p className="line-clamp-2 italic text-slate-400">"{currentQuestionText}"</p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-2 ${
              m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
              }`}
            >
              {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              <div
                className={`text-[9px] mt-1 font-mono ${
                  m.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                }`}
              >
                {m.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center space-x-2 text-xs text-indigo-300 bg-slate-900/80 p-2.5 rounded-xl w-fit border border-indigo-500/20">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>AI Tutor is analyzing your question...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a doubt about this question or concept..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
};
