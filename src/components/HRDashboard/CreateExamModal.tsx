import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, Sliders, ShieldCheck } from 'lucide-react';
import { Exam, ExamQuestion } from '../../types';

interface CreateExamModalProps {
  onClose: () => void;
  onExamCreated: (newExam: Exam) => void;
}

export const CreateExamModal: React.FC<CreateExamModalProps> = ({ onClose, onExamCreated }) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState(`HR-${Math.floor(1000 + Math.random() * 9000)}`);
  const [category, setCategory] = useState('Software Engineering');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [maxAllowedStrikes, setMaxAllowedStrikes] = useState(3);
  const [passingScorePercent, setPassingScorePercent] = useState(70);
  const [enableDualCamera, setEnableDualCamera] = useState(true);
  
  const [questions, setQuestions] = useState<ExamQuestion[]>([
    {
      id: `q-${Date.now()}-1`,
      type: 'mcq',
      question: 'What is the primary trade-off between Optimistic Concurrency Control (OCC) and Pessimistic Locking?',
      options: [
        'OCC minimizes locking overhead for high-read low-contention workloads.',
        'Pessimistic locking guarantees zero rollback at commit time under any contention.',
        'OCC cannot be used with ACID compliant relational databases.',
        'Pessimistic locking uses software transactional memory instead of disk locks.',
      ],
      correct_answer: 'OCC minimizes locking overhead for high-read low-contention workloads.',
      explanation: 'OCC avoids locking records upfront and checks for conflicts at commit time, which excels under low write contention.',
      difficulty: 'medium',
      topic: 'Database Engineering',
      maxPoints: 5,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}-${questions.length + 1}`,
        type: 'mcq',
        question: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        difficulty: 'medium',
        topic: category,
        maxPoints: 5,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          title: title.trim(),
          category,
          durationMinutes,
          maxAllowedStrikes,
          passingScorePercent,
          enableDualCamera,
          questions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onExamCreated(data.exam);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create exam:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Schedule & Configure New Proctored Exam</h2>
              <p className="text-xs text-slate-400">Set duration, 3-strike violation policies, and customized question bank.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Exam Title:</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Architecture Assessment"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">HR Exam Access / Invite Code:</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. HR-2026 or ENG-2026"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-blue-400 font-mono font-bold uppercase focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Category / Domain:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Software Engineering">Software Engineering</option>
                <option value="Artificial Intelligence">Artificial Intelligence & ML</option>
                <option value="Cloud Architecture">Cloud Architecture & DevOps</option>
                <option value="Data Engineering">Data Engineering</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Duration (Minutes):</label>
              <input
                type="number"
                min={5}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Max Allowed Strikes (4th Auto-Terminates):
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={maxAllowedStrikes}
                onChange={(e) => setMaxAllowedStrikes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Dual Camera Toggle */}
          <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              id="dual-cam-check"
              checked={enableDualCamera}
              onChange={(e) => setEnableDualCamera(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
            />
            <label htmlFor="dual-cam-check" className="text-xs text-slate-300 font-semibold cursor-pointer">
              Require Secondary Phone Camera Pairing (Dual-Angle Workspace Monitoring)
            </label>
          </div>

          {/* Question Set Manager */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Exam Questions ({questions.length})
              </h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 text-xs font-semibold hover:bg-blue-600/30 transition border border-blue-500/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            {questions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 font-mono">Question #{idx + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={q.question}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[idx].question = e.target.value;
                      setQuestions(updated);
                    }}
                    placeholder="Enter question statement..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-400">Answer Options & Correct Key:</div>
                  {q.options?.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={q.correct_answer === opt && opt !== ''}
                        onChange={() => {
                          const updated = [...questions];
                          updated[idx].correct_answer = opt;
                          setQuestions(updated);
                        }}
                      />
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const updated = [...questions];
                          if (updated[idx].options) {
                            updated[idx].options![oIdx] = e.target.value;
                            if (q.correct_answer === opt) {
                              updated[idx].correct_answer = e.target.value;
                            }
                          }
                          setQuestions(updated);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)} text...`}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              id="submit-create-exam-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Exam...' : 'Publish & Generate Invite'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
