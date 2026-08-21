import React from 'react';
import { CheckCircle2, XCircle, ShieldAlert, Award, ArrowRight, BookOpen, Download } from 'lucide-react';
import { ExamSession } from '../../types';
import { printCandidateReport } from '../../utils/exportUtils';

interface ExamCompletedViewProps {
  session: ExamSession;
  onGoToPractice: () => void;
  onRetakeOrReset: () => void;
}

export const ExamCompletedView: React.FC<ExamCompletedViewProps> = ({
  session,
  onGoToPractice,
  onRetakeOrReset,
}) => {
  const isTerminated = session.status === 'terminated_strikes';

  return (
    <div className="max-w-2xl mx-auto my-10 p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-white text-center">
      {/* Icon */}
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-xl">
        {isTerminated ? (
          <div className="w-full h-full rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
            <XCircle className="w-9 h-9" />
          </div>
        ) : (
          <div className="w-full h-full rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>
        )}
      </div>

      <h2 className="text-2xl font-extrabold tracking-tight mb-2">
        {isTerminated ? 'Examination Terminated by Proctor System' : 'Examination Successfully Submitted'}
      </h2>
      <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
        {isTerminated
          ? '4 proctoring strikes were recorded during your session. Answers submitted up to termination have been archived for HR review.'
          : 'Your responses have been securely uploaded along with the dual-camera audit trail for recruiter evaluation.'}
      </p>

      {/* Metrics Card */}
      <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-left">
        <div>
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Integrity Index</div>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              session.integrityScore > 75
                ? 'text-emerald-400'
                : session.integrityScore > 40
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {session.integrityScore}%
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Strikes</div>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              session.strikeCount === 0
                ? 'text-emerald-400'
                : session.strikeCount <= 2
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {session.strikeCount} of {session.maxStrikes}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Status</div>
          <div className="text-sm font-bold text-slate-200 uppercase mt-1">
            {session.status.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      {/* Violations Summary if any */}
      {session.violations.length > 0 && (
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 mb-6 text-left">
          <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Recorded Incidents Logged in HR Dossier:</span>
          </div>
          <div className="space-y-2">
            {session.violations.map((v) => (
              <div key={v.id} className="p-2 bg-slate-900 rounded-lg text-xs flex justify-between items-center border border-slate-800">
                <div className="space-y-0.5">
                  <span className="font-semibold text-rose-400 uppercase tracking-wider">{v.type.replace(/_/g, ' ')}</span>
                  <p className="text-[11px] text-slate-400 font-mono">{v.details}</p>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  Strike {v.strikeNumber}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => printCandidateReport(session)}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <Download className="w-4 h-4" />
          <span>Print / Export Audit Dossier</span>
        </button>

        <button
          onClick={onGoToPractice}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition"
        >
          <BookOpen className="w-4 h-4" />
          <span>Go to AI Practice Hub</span>
        </button>

        <button
          onClick={onRetakeOrReset}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold transition"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
};
