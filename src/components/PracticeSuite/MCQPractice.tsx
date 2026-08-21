import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, MessageSquare, ArrowRight, RefreshCw, Sparkles, BookOpen } from 'lucide-react';
import { ExamQuestion } from '../../types';
import confetti from 'canvas-confetti';

interface MCQPracticeProps {
  questions: ExamQuestion[];
  onOpenDoubtChat: (questionContext: string) => void;
  onRegenerateMore: () => void;
  isLoading: boolean;
}

export const MCQPractice: React.FC<MCQPracticeProps> = ({
  questions,
  onOpenDoubtChat,
  onRegenerateMore,
  isLoading,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
        No questions generated yet. Choose a topic and click "Generate Practice Questions".
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const userChoice = selectedOptions[currentQ.id];
  const isAnswerRevealed = revealed[currentQ.id];
  const isCorrect = userChoice === currentQ.correct_answer;

  const handleOptionClick = (option: string) => {
    if (isAnswerRevealed) return;
    const updated = { ...selectedOptions, [currentQ.id]: option };
    setSelectedOptions(updated);
    setRevealed({ ...revealed, [currentQ.id]: true });

    if (option === currentQ.correct_answer) {
      setScore((s) => s + 1);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    }
  };

  return (
    <div className="space-y-4">
      {/* Question Counter & Score Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-white">
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-indigo-600/20 text-indigo-300 font-mono font-bold rounded-lg text-xs border border-indigo-500/30">
            Practice Q {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs text-slate-400">
            Topic: <strong className="text-slate-200">{currentQ.topic}</strong>
            {currentQ.subtopic ? ` / ${currentQ.subtopic}` : ''}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            Score: {score}/{Object.keys(revealed).length}
          </span>
          <button
            onClick={() => onOpenDoubtChat(currentQ.question)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask AI Tutor</span>
          </button>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white">
        <div className="text-base sm:text-lg font-medium text-slate-100 mb-6 leading-relaxed">
          {currentQ.question}
        </div>

        {/* 4 Options Grid */}
        <div className="space-y-3">
          {currentQ.options?.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = userChoice === option;
            const isCorrectOption = option === currentQ.correct_answer;

            let cardStyle = 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-300';
            if (isAnswerRevealed) {
              if (isCorrectOption) {
                cardStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-100 ring-1 ring-emerald-500/50';
              } else if (isSelected && !isCorrect) {
                cardStyle = 'bg-rose-950/80 border-rose-500 text-rose-100 ring-1 ring-rose-500/50';
              } else {
                cardStyle = 'bg-slate-950/30 border-slate-800/50 text-slate-500 opacity-60';
              }
            }

            return (
              <div
                key={idx}
                onClick={() => handleOptionClick(option)}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${cardStyle}`}
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                      isAnswerRevealed && isCorrectOption
                        ? 'bg-emerald-600 text-white'
                        : isAnswerRevealed && isSelected && !isCorrect
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {letter}
                  </div>
                  <span className="text-sm leading-relaxed">{option}</span>
                </div>

                {isAnswerRevealed && (
                  <div>
                    {isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detailed Distractor Explanation Breakdown */}
        {isAnswerRevealed && (
          <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Sparkles className="w-4 h-4" /> Explanation & Concept Breakdown
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                  isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {isCorrect ? 'Correct Answer' : 'Incorrect Choice'}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Next / Regenerate Controls */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold disabled:opacity-40 transition"
          >
            Previous
          </button>

          <div className="flex items-center space-x-3">
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onRegenerateMore}
                disabled={isLoading}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Generate More Questions</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
