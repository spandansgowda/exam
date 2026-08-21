import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, XCircle, CheckCircle2, Clock } from 'lucide-react';
import { ViolationEvent } from '../../types';

interface StrikeWarningModalProps {
  violation: ViolationEvent;
  strikeCount: number;
  maxStrikes: number;
  onAcknowledge: () => void;
  isTerminated?: boolean;
}

export const StrikeWarningModal: React.FC<StrikeWarningModalProps> = ({
  violation,
  strikeCount,
  maxStrikes,
  onAcknowledge,
  isTerminated = false,
}) => {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (isTerminated) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTerminated]);

  const isFinalWarning = strikeCount === maxStrikes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl border text-white transition-all ${
          isTerminated
            ? 'bg-rose-950/95 border-rose-600 ring-4 ring-rose-500/20'
            : isFinalWarning
            ? 'bg-amber-950/95 border-amber-500 ring-4 ring-amber-500/20'
            : 'bg-slate-900 border-rose-500/50'
        }`}
      >
        {/* Header Alert Icon */}
        <div className="flex items-center space-x-3 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isTerminated
                ? 'bg-rose-600 text-white animate-bounce'
                : isFinalWarning
                ? 'bg-amber-500 text-slate-950'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
          >
            {isTerminated ? <XCircle className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold tracking-tight">
                {isTerminated
                  ? 'Exam Terminated: Violation Limit Exceeded'
                  : `Warning ${strikeCount}/${maxStrikes}: Proctoring Violation Detected`}
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              {isTerminated
                ? 'Strike 4 reached. Your session has been auto-submitted and locked for HR review.'
                : isFinalWarning
                ? 'FINAL WARNING: The next violation will result in immediate auto-submission.'
                : `${maxStrikes - strikeCount} warning(s) remaining before automatic exam termination.`}
            </p>
          </div>
        </div>

        {/* Violation Details Card */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Violation Type:</span>
            <span className="font-semibold text-rose-400 uppercase tracking-wider">
              {violation.type.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Recorded Timestamp:</span>
            <span className="font-mono text-slate-200">
              {new Date(violation.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[11px] text-slate-400 mb-1">System Forensic Note:</div>
            <div className="text-xs font-mono text-slate-200 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
              {violation.details}
            </div>
          </div>
        </div>

        {/* Snapshot Evidence Preview if captured */}
        {violation.snapshotDataUrl && (
          <div className="mb-4">
            <div className="text-[11px] font-semibold text-slate-400 mb-1">Captured Audit Snapshot Frame:</div>
            <div className="h-32 rounded-lg overflow-hidden border border-slate-800 bg-black">
              <img
                src={violation.snapshotDataUrl}
                alt="Violation Snapshot"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          {!isTerminated ? (
            <>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Resuming exam in {countdown}s</span>
              </div>

              <button
                id="acknowledge-violation-btn"
                onClick={onAcknowledge}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Understand — Return to Exam</span>
              </button>
            </>
          ) : (
            <button
              id="exit-terminated-exam-btn"
              onClick={onAcknowledge}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition"
            >
              <span>View Terminated Incident Summary</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
