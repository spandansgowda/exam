import React, { useState } from 'react';
import { BookOpen, Sparkles, Sliders, ShieldCheck, RefreshCw, MessageSquare, Layers } from 'lucide-react';
import { ExamQuestion } from '../../types';
import { MCQPractice } from './MCQPractice';
import { SubjectivePractice } from './SubjectivePractice';
import { DoubtChatDrawer } from './DoubtChatDrawer';

const PRESET_TOPICS = [
  { topic: 'Distributed Systems', subtopics: ['CAP Theorem', 'Consensus Protocols (Raft/Paxos)', 'Vector Clocks', 'Eventual Consistency'] },
  { topic: 'Computer Networks', subtopics: ['HTTP/3 & QUIC', 'TCP Flow Control', 'TLS 1.3 Handshake', 'BGP Routing'] },
  { topic: 'Database Internals', subtopics: ['B-Trees vs LSM Trees', 'ACID Transactions & MVCC', 'WAL Recovery', 'Query Optimization'] },
  { topic: 'Operating Systems', subtopics: ['Virtual Memory & Paging', 'Concurrency & Mutexes', 'Epoll & Event Loops', 'CPU Scheduling'] },
  { topic: 'Machine Learning', subtopics: ['FlashAttention & Transformers', 'Backpropagation Mechanics', 'Loss Functions & Regularization', 'Quantization (INT8/FP4)'] },
];

export const PracticeHub: React.FC = () => {
  const [mode, setMode] = useState<'mcq' | 'subjective'>('mcq');
  const [selectedTopic, setSelectedTopic] = useState('Distributed Systems');
  const [selectedSubtopic, setSelectedSubtopic] = useState('CAP Theorem');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Doubt Chat Assistant state
  const [isDoubtChatOpen, setIsDoubtChatOpen] = useState(false);
  const [activeDoubtContext, setActiveDoubtContext] = useState<string>('');

  const currentTopicData = PRESET_TOPICS.find((t) => t.topic === selectedTopic) || PRESET_TOPICS[0];

  const handleGenerateQuestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/practice/generate-mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          subtopic: selectedSubtopic,
          difficulty,
          count: questionCount,
          previousQuestions: questions.map((q) => q.question),
        }),
      });

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate practice questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDoubtChat = (questionText: string) => {
    setActiveDoubtContext(questionText);
    setIsDoubtChatOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> LLM-Powered Study Environment
            </span>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Isolated Practice (Zero Surveillance)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-2">
            Candidate Practice & Knowledge Hub
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
            Prepare for live proctored exams with high-rigor multiple choice questions, in-depth distractor explanations, subjective rubric grading, and real-time AI doubt resolution.
          </p>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-3 mt-6">
            <button
              onClick={() => setMode('mcq')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                mode === 'mcq'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Multiple-Choice Generator</span>
            </button>

            <button
              onClick={() => setMode('subjective')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                mode === 'subjective'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Subjective Answer AI Rubric Grading</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: MCQ Generator Config & View */}
      {mode === 'mcq' && (
        <div className="space-y-6">
          {/* Generator Controls Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Configure Question Generator</span>
              </h2>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Groq Llama 3.3 70B Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Topic */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Topic:</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => {
                    setSelectedTopic(e.target.value);
                    const t = PRESET_TOPICS.find((p) => p.topic === e.target.value);
                    if (t && t.subtopics.length > 0) setSelectedSubtopic(t.subtopics[0]);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {PRESET_TOPICS.map((p) => (
                    <option key={p.topic} value={p.topic}>
                      {p.topic}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtopic */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Subtopic / Focus Area:</label>
                <select
                  value={selectedSubtopic}
                  onChange={(e) => setSelectedSubtopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {currentTopicData.subtopics.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Difficulty Rigor:</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="easy">Easy (Recall & Fundamentals)</option>
                  <option value="medium">Medium (Application & Trade-offs)</option>
                  <option value="hard">Hard (Multi-Step & Edge Cases)</option>
                </select>
              </div>

              {/* Question Count & Generate Button */}
              <div className="flex items-end">
                <button
                  id="generate-practice-mcqs-btn"
                  onClick={handleGenerateQuestions}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition disabled:opacity-40"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Generating Questions...' : 'Generate Questions'}</span>
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Active Question Player */}
          {questions.length > 0 ? (
            <MCQPractice
              questions={questions}
              onOpenDoubtChat={handleOpenDoubtChat}
              onRegenerateMore={handleGenerateQuestions}
              isLoading={isLoading}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-indigo-400/60" />
              <div className="text-base font-bold text-slate-200">No Active Practice Session</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Generate Questions" above to produce original exam questions on {selectedTopic} ({selectedSubtopic}).
              </p>
              <button
                onClick={handleGenerateQuestions}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
              >
                Generate First Set (5 Questions)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Subjective Evaluator */}
      {mode === 'subjective' && (
        <SubjectivePractice onOpenDoubtChat={handleOpenDoubtChat} />
      )}

      {/* Contextual AI Doubt Solver Chat Assistant */}
      <DoubtChatDrawer
        isOpen={isDoubtChatOpen}
        onClose={() => setIsDoubtChatOpen(false)}
        currentQuestionText={activeDoubtContext}
        topic={selectedTopic}
      />
    </div>
  );
};
