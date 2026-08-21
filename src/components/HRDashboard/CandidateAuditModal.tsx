import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Download, Printer, UserCheck, ShieldAlert, Award } from 'lucide-react';
import { ExamSession } from '../../types';
import { exportCandidateReportCSV, printCandidateReport } from '../../utils/exportUtils';

interface CandidateAuditModalProps {
  session: ExamSession;
  onClose: () => void;
  onDecisionUpdated: (updatedSession: ExamSession) => void;
}

export const CandidateAuditModal: React.FC<CandidateAuditModalProps> = ({
  session,
  onClose,
  onDecisionUpdated,
}) => {
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'flagged'>(session.hrDecision || 'flagged');
  const [notes, setNotes] = useState(session.hrNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(
    session.violations[0]?.snapshotDataUrl || session.candidatePhotoUrl || null
  );

  const handleSaveDecision = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/hr-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          notes,
          reviewedBy: 'HR Lead Examiner',
        }),
      });
      const data = await res.json();
      if (data.success) {
        onDecisionUpdated(data.session);
        onClose();
      }
    } catch (err) {
      console.error('Failed to save HR decision:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Forensic Proctoring Audit Dossier</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {session.id}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Exam: <strong>{session.examTitle}</strong> | Candidate: <strong>{session.candidateName}</strong> ({session.candidateEmail})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportCandidateReportCSV(session)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Download CSV Audit"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => printCandidateReport(session)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Print Dossier"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Integrity Index</div>
              <div
                className={`text-2xl font-bold font-mono mt-1 ${
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

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Recorded Strikes</div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                {session.strikeCount} / {session.maxStrikes}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Technical Score</div>
              <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                {session.score || 0} / {session.totalPoints || 0} ({session.percentageScore || 0}%)
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Current Decision</div>
              <div className="text-xs font-bold uppercase mt-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    session.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : session.status === 'rejected' || session.status === 'terminated_strikes'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {session.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Biometric Face Matching Comparison */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>Biometric Identity Verification vs Flagged Event Frame</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Registered Photo */}
              <div className="space-y-1.5">
                <div className="text-[11px] text-slate-400 font-semibold flex justify-between">
                  <span>Registered Pre-Exam Photo</span>
                  <span className="text-emerald-400 font-mono">ArcFace Baseline</span>
                </div>
                <div className="h-44 rounded-xl overflow-hidden border border-slate-800 bg-black">
                  <img
                    src={session.candidatePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt="Registered ID"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Selected Snapshot Frame */}
              <div className="space-y-1.5">
                <div className="text-[11px] text-slate-400 font-semibold flex justify-between">
                  <span>Audit Evidence Frame (Click any incident below)</span>
                  <span className="text-rose-400 font-mono">CV Timestamp Capture</span>
                </div>
                <div className="h-44 rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                  {selectedSnapshot ? (
                    <img
                      src={selectedSnapshot}
                      alt="Incident Snapshot"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">No snapshot attached for this incident</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chronological Violations Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Chronological Violation Timeline ({session.violations.length} Incidents)
            </h3>

            {session.violations.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero integrity violations recorded during the active examination. Verified clean session.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {session.violations.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setSelectedSnapshot(v.snapshotDataUrl || null)}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-rose-400 uppercase tracking-wider">
                          {v.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          Strike {v.strikeNumber}
                        </span>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                            v.severity === 'critical'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {v.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono">{v.details}</p>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                      {new Date(v.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HR Decision & Audit Override Form */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Recruiter Override & Evaluation Decision
            </h3>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                  decision === 'approved'
                    ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Candidate (Certified Clean)</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                  decision === 'rejected'
                    ? 'bg-rose-600 text-white border-rose-500 ring-2 ring-rose-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Reject (Proctoring Failure / Plagiarism)</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('flagged')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                  decision === 'flagged'
                    ? 'bg-amber-600 text-white border-amber-500 ring-2 ring-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Flag for Senior Audit / Re-Examination</span>
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Recruiter Audit Notes (Saved to permanent candidate file):
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Document justification for approval/rejection override, review of snapshot frames, and candidate interview follow-up..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>

          <button
            id="save-hr-decision-btn"
            onClick={handleSaveDecision}
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
          >
            <span>{isSaving ? 'Saving Decision...' : 'Save Audit Decision'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
