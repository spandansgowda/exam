import React from 'react';
import { Video, Smartphone, AlertTriangle, ShieldCheck, User, ExternalLink, XCircle } from 'lucide-react';
import { ExamSession } from '../../types';

interface LiveMonitoringGridProps {
  sessions: ExamSession[];
  onSelectCandidate: (session: ExamSession) => void;
}

export const LiveMonitoringGrid: React.FC<LiveMonitoringGridProps> = ({
  sessions,
  onSelectCandidate,
}) => {
  const activeSessions = sessions.filter(
    (s) => s.status === 'in_progress' || s.status === 'under_review' || s.status === 'terminated_strikes'
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Candidate Monitoring Matrix ({activeSessions.length} Active Feeds)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time dual-camera telemetry, strike counters, and instant forensic audit triggers.
          </p>
        </div>
      </div>

      {activeSessions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          No live proctored exam sessions are currently running.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeSessions.map((s) => {
            const isTerminated = s.status === 'terminated_strikes';
            const isWarning = s.strikeCount > 0 && !isTerminated;

            return (
              <div
                key={s.id}
                className={`bg-slate-900 rounded-2xl border p-4 shadow-xl flex flex-col justify-between transition-all ${
                  isTerminated
                    ? 'border-rose-600/80 bg-rose-950/20'
                    : isWarning
                    ? 'border-amber-500/60 bg-amber-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Candidate Top Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-800">
                        <img
                          src={s.candidatePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={s.candidateName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">{s.candidateName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.candidateId}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        isTerminated
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {isTerminated ? 'TERMINATED' : `Strikes: ${s.strikeCount}/${s.maxStrikes}`}
                    </span>
                  </div>

                  {/* Dual Video Stream Mockup Tile */}
                  <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 mb-3 group">
                    <img
                      src={
                        s.violations[s.violations.length - 1]?.snapshotDataUrl ||
                        s.candidatePhotoUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                      }
                      alt="Live Candidate Webcam"
                      className="w-full h-full object-cover"
                    />

                    {/* Camera Labels */}
                    <div className="absolute top-2 left-2 flex items-center space-x-1.5">
                      <span className="bg-slate-900/90 text-blue-400 text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Video className="w-2.5 h-2.5" /> WebCam
                      </span>
                      {s.secondaryCameraActive && (
                        <span className="bg-slate-900/90 text-emerald-400 text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Smartphone className="w-2.5 h-2.5" /> Dual-Cam
                        </span>
                      )}
                    </div>

                    {/* Integrity Badge on stream */}
                    <div className="absolute bottom-2 left-2 bg-slate-900/90 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 text-slate-200">
                      Trust: <strong className={s.integrityScore > 75 ? 'text-emerald-400' : 'text-rose-400'}>{s.integrityScore}%</strong>
                    </div>

                    {/* Status Pill */}
                    <div className="absolute top-2 right-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                    </div>
                  </div>

                  {/* Exam & Violations count */}
                  <div className="text-[11px] text-slate-300 space-y-1 mb-3">
                    <div className="truncate font-medium text-slate-200">{s.examTitle}</div>
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>Violations Logged: {s.violations.length}</span>
                      <span>Questions Answered: {Object.keys(s.answers || {}).length}</span>
                    </div>
                  </div>
                </div>

                {/* Audit Actions Button */}
                <button
                  onClick={() => onSelectCandidate(s)}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Forensic Audit Dossier</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
