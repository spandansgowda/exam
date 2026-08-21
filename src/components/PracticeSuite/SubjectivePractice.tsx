import React, { useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, AlertCircle, Award, MessageSquare, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { PracticeEvaluationResult } from '../../types';

interface SubjectivePracticeProps {
  onOpenDoubtChat: (questionContext: string) => void;
}

const SAMPLE_SUBJECTIVE_QUESTIONS = [
  {
    id: 'subj-1',
    topic: 'System Design & Scalability',
    question: 'Explain how you would design an idempotency key mechanism for distributed payment processing to guarantee exactly-once execution semantics.',
    rubric: 'Must explain: unique client key, Redis/database atomic check, transactional state transition (pending -> completed), idempotency cache TTL, concurrent duplicate lock handling, and returning cached HTTP response.',
  },
  {
    id: 'subj-2',
    topic: 'Database Engineering',
    question: 'Compare Write-Ahead Logging (WAL) in PostgreSQL vs Log-Structured Merge (LSM) Trees in Cassandra. How does each balance read latency vs write throughput?',
    rubric: 'Candidate must detail in-place B-tree updates + sequential WAL writes vs append-only MemTable/SSTable flushes and background compaction trade-offs.',
  },
  {
    id: 'subj-3',
    topic: 'Computer Networks & Security',
    question: 'Explain how TLS 1.3 handshakes minimize round-trip times (0-RTT resumption) compared to TLS 1.2, and discuss the replay attack security implications of 0-RTT.',
    rubric: 'Must mention key exchange in first flight (Diffie-Hellman + pre-shared key), removal of static RSA, anti-replay mechanisms like single-use tickets or client timestamps.',
  },
];

export const SubjectivePractice: React.FC<SubjectivePracticeProps> = ({ onOpenDoubtChat }) => {
  const [selectedQIndex, setSelectedQIndex] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<PracticeEvaluationResult | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  const activeQuestion = SAMPLE_SUBJECTIVE_QUESTIONS[selectedQIndex];

  const handleEvaluate = async () => {
    if (!studentAnswer.trim() || isEvaluating) return;

    setIsEvaluating(true);
    setResult(null);

    try {
      const res = await fetch('/api/practice/evaluate-subjective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeQuestion.question,
          studentAnswer: studentAnswer.trim(),
          rubricGuidelines: activeQuestion.rubric,
          topic: activeQuestion.topic,
          maxScore: 10,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Question Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
          {SAMPLE_SUBJECTIVE_QUESTIONS.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => {
                setSelectedQIndex(idx);
                setStudentAnswer('');
                setResult(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                idx === selectedQIndex
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Question #{idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => onOpenDoubtChat(activeQuestion.question)}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Discuss with AI Tutor</span>
        </button>
      </div>

      {/* Main Question & Editor Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            {activeQuestion.topic}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-2 leading-relaxed">
            {activeQuestion.question}
          </h3>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Your Technical Response:
          </label>
          <textarea
            rows={7}
            value={studentAnswer}
            onChange={(e) => setStudentAnswer(e.target.value)}
            placeholder="Structure your answer with theoretical concepts, architectural components, flow sequence, and edge-case error handling..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y font-mono"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>Minimum 50 words recommended for deep rubric evaluation</span>
            <span>{studentAnswer.trim().split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => {
              setStudentAnswer(
                `To implement idempotency in distributed payment systems:
1. Client generates a unique UUID (Idempotency-Key) and attaches it in HTTP header.
2. API Gateway/Service checks Redis cache atomically via SET key value NX EX 120 (distributed lock).
3. If key exists in 'PENDING' state, reject concurrent duplicate with 409 Conflict.
4. If key exists with 'COMPLETED' state, return cached response payload directly.
5. If new request, lock is acquired, payment executes against Payment Processor (Stripe), results stored in database with transaction commit, and final response cached in Redis before unlocking.`
              );
            }}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Insert Sample Answer Template
          </button>

          <button
            onClick={handleEvaluate}
            disabled={!studentAnswer.trim() || isEvaluating}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition disabled:opacity-40"
          >
            {isEvaluating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Grading in Progress...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Evaluate with Gemini AI Rubric</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Evaluation Report Result */}
      {result && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in duration-300">
          {/* Header Score */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <h4 className="text-lg font-bold text-slate-100">LLM Rubric Evaluation Report</h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{result.overallFeedback}</p>
            </div>

            <div className="flex items-center space-x-2 bg-indigo-500/20 px-4 py-2 rounded-xl border border-indigo-500/30">
              <span className="text-xs text-indigo-300 font-semibold">Total Score:</span>
              <span className="text-xl font-bold font-mono text-indigo-200">
                {result.score} / {result.maxScore}
              </span>
            </div>
          </div>

          {/* Criteria Breakdown Grid */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Criteria Breakdown:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {result.criteriaBreakdown?.map((c, i) => (
                <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{c.criterion}</span>
                    <span className="font-mono text-indigo-400 font-bold">{c.score}/{c.max}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{c.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Demonstrated Strengths</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-xs text-emerald-200">
                {result.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>Areas for Improvement & Missing Points</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-xs text-amber-200">
                {result.areasForImprovement.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
                {result.keyMissingPoints.map((m, i) => (
                  <li key={`m-${i}`} className="font-medium text-amber-300">Missing: {m}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Model Answer Toggle */}
          <div className="border-t border-slate-800 pt-4">
            <button
              onClick={() => setShowModelAnswer(!showModelAnswer)}
              className="flex items-center justify-between w-full p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>View Benchmark Model Answer</span>
              </span>
              {showModelAnswer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showModelAnswer && (
              <div className="mt-2 p-4 bg-slate-950/90 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                {result.modelAnswer}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
