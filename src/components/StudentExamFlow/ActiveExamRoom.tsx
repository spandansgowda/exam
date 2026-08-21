import React, { useState, useEffect, useRef } from 'react';
import { Clock, ShieldAlert, CheckCircle2, ChevronLeft, ChevronRight, Send, AlertTriangle, Flag, Info, HelpCircle } from 'lucide-react';
import { Exam, ExamSession, ViolationEvent, ViolationType } from '../../types';
import { ProctorCameraFeeds } from './ProctorCameraFeeds';
import { StrikeWarningModal } from './StrikeWarningModal';
import { initAudioMonitoring, AudioDetectorHandle } from '../../utils/audioDetector';

interface ActiveExamRoomProps {
  exam: Exam;
  session: ExamSession;
  onSessionUpdated: (updatedSession: ExamSession) => void;
  onExamFinished: (finalSession: ExamSession) => void;
  candidatePhotoUrl?: string;
  pairingCode?: string;
}

export const ActiveExamRoom: React.FC<ActiveExamRoomProps> = ({
  exam,
  session,
  onSessionUpdated,
  onExamFinished,
  candidatePhotoUrl,
  pairingCode,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(session.answers || {});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(session.remainingTimeSeconds || exam.durationMinutes * 60);
  
  // Real-time feeds state
  const [primaryStream, setPrimaryStream] = useState<MediaStream | null>(null);
  const [secondaryFrame, setSecondaryFrame] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  
  // Warning modal & strikes
  const [activeWarning, setActiveWarning] = useState<ViolationEvent | null>(null);
  const [isTerminated, setIsTerminated] = useState(session.status === 'terminated_strikes');
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);

  // Audio detector ref
  const audioHandleRef = useRef<AudioDetectorHandle | null>(null);

  // 1. Initialize Webcam & Mic for Active Exam Room
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initFeeds() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });
        setPrimaryStream(stream);
      } catch (err) {
        console.warn('Webcam stream not accessible:', err);
      }

      audioHandleRef.current = await initAudioMonitoring((db) => {
        // Trigger voice anomaly strike on sustained audio
        handleViolationTrigger(
          'audio_anomaly',
          `Elevated acoustic anomaly detected in environment (${db} dB). Speaking or background assistance prohibited.`
        );
      }, 72);
    }

    initFeeds();

    // Poll secondary phone frame if pairing code exists
    const phonePoll = setInterval(async () => {
      if (!pairingCode) return;
      try {
        const res = await fetch(`/api/pair/${pairingCode}/frame`);
        const data = await res.json();
        if (data.success && data.latestFrame) {
          setSecondaryFrame(data.latestFrame);
        }
      } catch (e) {}
    }, 2000);

    // Audio level meter interval
    const audioPoll = setInterval(() => {
      if (audioHandleRef.current) {
        setAudioLevel(audioHandleRef.current.getAudioLevel());
      }
    }, 250);

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (audioHandleRef.current) audioHandleRef.current.stop();
      clearInterval(phonePoll);
      clearInterval(audioPoll);
    };
  }, [pairingCode]);

  // 2. Tab-Switch & Focus-Loss Event Listeners
  useEffect(() => {
    if (isTerminated) return;

    let tabSwitchTimer: any = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab switch occurred
        handleViolationTrigger(
          'tab_switch',
          'Page Visibility lost: candidate switched to another browser tab or minimized window.'
        );
      }
    };

    const handleWindowBlur = () => {
      // Small debounce to avoid instant blur false triggers
      tabSwitchTimer = setTimeout(() => {
        if (!document.hasFocus()) {
          handleViolationTrigger(
            'tab_switch',
            'Browser Window focus lost: candidate interacted with external software or secondary monitor.'
          );
        }
      }, 600);
    };

    const handleWindowFocus = () => {
      if (tabSwitchTimer) clearTimeout(tabSwitchTimer);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      if (tabSwitchTimer) clearTimeout(tabSwitchTimer);
    };
  }, [session.id, isTerminated]);

  // 3. Countdown Timer
  useEffect(() => {
    if (isTerminated) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTerminated]);

  // Violation Handler
  const handleViolationTrigger = async (type: ViolationType, details: string) => {
    if (isTerminated) return;

    try {
      const res = await fetch(`/api/sessions/${session.id}/violation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          details,
          snapshotDataUrl: candidatePhotoUrl || primaryStream ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' : '',
          secondaryCameraSnapshot: secondaryFrame || '',
          severity: type === 'multiple_faces' || type === 'prohibited_object' ? 'high' : 'medium',
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSessionUpdated(data.session);
        setActiveWarning(data.violation);

        if (data.isTerminated) {
          setIsTerminated(true);
        }
      }
    } catch (err) {
      console.error('Failed to log violation:', err);
    }
  };

  // Answer selection / typing
  const handleSelectOption = (questionId: string, option: string) => {
    const updated = { ...answers, [questionId]: option };
    setAnswers(updated);
    // Periodically sync answers with server
    fetch(`/api/sessions/${session.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: updated, remainingTimeSeconds: timeLeftSeconds }),
    });
  };

  const handleTextAnswerChange = (questionId: string, text: string) => {
    const updated = { ...answers, [questionId]: text };
    setAnswers(updated);
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // Submit Exam
  const handleSubmitExam = async () => {
    try {
      const res = await fetch(`/api/sessions/${session.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          status: 'submitted',
          remainingTimeSeconds: timeLeftSeconds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onExamFinished(data.session);
      }
    } catch (err) {
      console.error('Failed to submit exam:', err);
    }
  };

  const currentQ = exam.questions[currentQuestionIndex];
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Proctored Exam Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-sm sticky top-16 z-20">
        <div>
          <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>{exam.title}</span>
            <span className="text-[11px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-normal">
              {exam.category}
            </span>
          </h1>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            Candidate: <strong className="text-slate-200">{session.candidateName}</strong> ({session.candidateId})
          </div>
        </div>

        {/* Center Countdown Timer */}
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl border font-mono font-bold text-sm ${
              timeLeftSeconds < 300
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                : 'bg-slate-950 text-slate-200 border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Time Left: {formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            id="finish-exam-btn"
            onClick={() => setShowSubmitConfirmation(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish & Submit</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Left 3 Columns: Active Question Card */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
            {/* Question Top Meta */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg text-xs font-bold font-mono border border-blue-500/30">
                  Question {currentQuestionIndex + 1} of {exam.questions.length}
                </span>
                <span className="text-xs text-slate-400">
                  Topic: <strong className="text-slate-200">{currentQ.topic}</strong>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleFlag(currentQ.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition border ${
                    flaggedQuestions[currentQ.id]
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flaggedQuestions[currentQ.id] ? 'Flagged for Review' : 'Mark Review'}</span>
                </button>
                <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  {currentQ.maxPoints} pts
                </span>
              </div>
            </div>

            {/* Question Prompt */}
            <div className="text-base sm:text-lg font-medium text-slate-100 mb-6 leading-relaxed">
              {currentQ.question}
            </div>

            {/* MCQ Options */}
            {currentQ.type === 'mcq' && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = answers[currentQ.id] === option;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectOption(currentQ.id, option)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center space-x-3.5 ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500/50 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono transition ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {letter}
                      </div>
                      <span className="text-sm leading-relaxed">{option}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Subjective Text Area */}
            {currentQ.type === 'subjective' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Write Your Comprehensive Technical Response:
                </label>
                <textarea
                  rows={8}
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleTextAnswerChange(currentQ.id, e.target.value)}
                  placeholder="Explain your approach, architecture decisions, trade-offs, and failure recovery protocols..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed resize-y font-mono"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Formatting: plain text / pseudo-code</span>
                  <span>{(answers[currentQ.id] || '').trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>
            )}

            {/* Bottom Nav Buttons */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-800">
              <button
                id="prev-question-btn"
                onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Question</span>
              </button>

              <button
                id="next-question-btn"
                onClick={() => setCurrentQuestionIndex((i) => Math.min(exam.questions.length - 1, i + 1))}
                disabled={currentQuestionIndex === exam.questions.length - 1}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition disabled:opacity-40"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Question Navigation Palette */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Question Navigator
            </h3>

            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentQuestionIndex;
                const isFlagged = flaggedQuestions[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-10 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center relative border ${
                      isCurrent
                        ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/50 shadow-md'
                        : isAnswered
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Palette Legend */}
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-600"></span>
                <span>Current Question</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-500/40"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800"></span>
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Marked for Review</span>
              </div>
            </div>
          </div>

          {/* Quick Exam Rules Reminder Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <span>Proctoring Security Rules:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
              <li>Max Allowed Strikes: <strong>{exam.maxAllowedStrikes}</strong></li>
              <li>4th Strike: Instant Exam Auto-Submission</li>
              <li>Keep dual camera angles clear and unobstructed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Floating Live Proctoring Feeds Widget */}
      <ProctorCameraFeeds
        primaryStream={primaryStream}
        secondaryFrame={secondaryFrame}
        audioLevel={audioLevel}
        strikeCount={session.strikeCount}
        maxStrikes={session.maxStrikes}
        integrityScore={session.integrityScore}
        onManualTriggerViolation={handleViolationTrigger}
      />

      {/* 3-Strike Warning Modal Popup */}
      {activeWarning && (
        <StrikeWarningModal
          violation={activeWarning}
          strikeCount={session.strikeCount}
          maxStrikes={session.maxStrikes}
          onAcknowledge={() => {
            if (isTerminated) {
              handleSubmitExam();
            } else {
              setActiveWarning(null);
            }
          }}
          isTerminated={isTerminated}
        />
      )}

      {/* Submit Confirmation Dialog */}
      {showSubmitConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-white">
            <h3 className="text-lg font-bold mb-2">Submit Examination?</h3>
            <p className="text-xs text-slate-400 mb-4">
              You have answered {Object.keys(answers).length} of {exam.questions.length} questions.
              Once submitted, your responses and proctoring audit log will be submitted for recruiter review.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSubmitConfirmation(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Continue Exam
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirmation(false);
                  handleSubmitExam();
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20"
              >
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
