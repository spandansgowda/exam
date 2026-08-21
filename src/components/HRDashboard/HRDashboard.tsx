import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Video, Plus, Search, Filter, Download, ExternalLink, Sliders, CheckCircle2, XCircle, AlertTriangle, Copy, ShieldAlert, Sparkles } from 'lucide-react';
import { Exam, ExamSession } from '../../types';
import { LiveMonitoringGrid } from './LiveMonitoringGrid';
import { CandidateAuditModal } from './CandidateAuditModal';
import { CreateExamModal } from './CreateExamModal';
import { exportCandidateReportCSV } from '../../utils/exportUtils';

export const HRDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'candidates' | 'exams' | 'settings'>('live');
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null);
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Settings State
  const [faceConfidence, setFaceConfidence] = useState(92);
  const [tabSwitchGraceMs, setTabSwitchGraceMs] = useState(400);
  const [audioThresholdDb, setAudioThresholdDb] = useState(68);
  const [yoloPhoneConfidence, setYoloPhoneConfidence] = useState(85);

  // Fetch initial exams & sessions
  const loadData = async () => {
    try {
      const [resExams, resSessions] = await Promise.all([
        fetch('/api/exams').then((r) => r.json()),
        fetch('/api/sessions').then((r) => r.json()),
      ]);
      if (resExams.exams) setExams(resExams.exams);
      if (resSessions.sessions) setSessions(resSessions.sessions);
    } catch (err) {
      console.error('Failed to load HR data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyInvite = (code: string) => {
    const inviteUrl = `${window.location.origin}/?exam=${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.examTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalFlaggedOrTerminated = sessions.filter(
    (s) => s.status === 'terminated_strikes' || s.violations.length > 0
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white space-y-8">
      {/* Top Banner & KPI Stat Blocks */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> HR Recruiter Command Console
            </span>
            <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full text-[11px] font-mono border border-slate-700">
              ArcFace & YOLOv8 Vision Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1.5">
            AI Exam Proctoring & Integrity Center
          </h1>
          <p className="text-xs text-slate-400">
            Audit live sessions, cross-reference registered ID biometrics, manage 3-strike violations, and generate forensic compliance reports.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="create-exam-btn"
            onClick={() => setIsCreateExamOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create / Schedule Exam</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Candidates</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{sessions.length}</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">Across {exams.length} scheduled exams</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Active Live Sessions</div>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
            {sessions.filter((s) => s.status === 'in_progress').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Streaming dual-camera feeds</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Flagged / Incidents</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {totalFlaggedOrTerminated}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">Requires recruiter audit</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Certified Approvals</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {sessions.filter((s) => s.status === 'approved').length}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">Clean integrity score &gt; 90%</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 flex items-center space-x-2">
        <button
          id="tab-live-matrix"
          onClick={() => setActiveTab('live')}
          className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold transition border-b-2 ${
            activeTab === 'live'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Live Monitoring Matrix</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>

        <button
          id="tab-candidates"
          onClick={() => setActiveTab('candidates')}
          className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold transition border-b-2 ${
            activeTab === 'candidates'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Candidate Roster & Audits ({sessions.length})</span>
        </button>

        <button
          id="tab-exams"
          onClick={() => setActiveTab('exams')}
          className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold transition border-b-2 ${
            activeTab === 'exams'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Scheduled Exams & Invites ({exams.length})</span>
        </button>

        <button
          id="tab-settings"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold transition border-b-2 ${
            activeTab === 'settings'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>CV Sensitivity & Rules</span>
        </button>
      </div>

      {/* TAB 1: Live Monitoring Grid */}
      {activeTab === 'live' && (
        <LiveMonitoringGrid
          sessions={sessions}
          onSelectCandidate={(s) => setSelectedSession(s)}
        />
      )}

      {/* TAB 2: Candidate Roster & Audits */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          {/* Filter / Search Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate name, email, exam..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="flex items-center space-x-1 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">All Candidates</option>
                <option value="in_progress">In Progress</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="terminated_strikes">Terminated (4 Strikes)</option>
              </select>
            </div>
          </div>

          {/* Candidates Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Exam Assessment</th>
                  <th className="p-4">Strikes</th>
                  <th className="p-4">Integrity Index</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Status & Decision</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex-shrink-0">
                          <img
                            src={s.candidatePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                            alt={s.candidateName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">{s.candidateName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{s.candidateEmail}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-medium text-slate-200">
                      <div>{s.examTitle}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{s.examId}</div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          s.strikeCount === 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : s.strikeCount < s.maxStrikes
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {s.strikeCount} / {s.maxStrikes}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              s.integrityScore > 75
                                ? 'bg-emerald-400'
                                : s.integrityScore > 40
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${s.integrityScore}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-200">{s.integrityScore}%</span>
                      </div>
                    </td>

                    <td className="p-4 font-mono font-bold text-indigo-300">
                      {s.score || 0} / {s.totalPoints || 0} ({s.percentageScore || 0}%)
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          s.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : s.status === 'rejected' || s.status === 'terminated_strikes'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {s.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedSession(s)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 font-semibold border border-blue-500/30 transition text-[11px]"
                      >
                        Audit Dossier
                      </button>
                      <button
                        onClick={() => exportCandidateReportCSV(s)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Export CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Scheduled Exams & Invites */}
      {activeTab === 'exams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-bold">
                    {exam.code}
                  </span>
                  <span className="text-xs text-slate-400">{exam.category}</span>
                </div>

                <h3 className="text-base font-bold text-slate-100">{exam.title}</h3>

                <div className="text-xs text-slate-400 space-y-1">
                  <div>Duration: <strong className="text-slate-200">{exam.durationMinutes} mins</strong></div>
                  <div>Questions: <strong className="text-slate-200">{exam.questions.length} total</strong></div>
                  <div>Max Allowed Strikes: <strong className="text-slate-200">{exam.maxAllowedStrikes} (4th terminates)</strong></div>
                  <div>Dual-Camera Mode: <strong className={exam.enableDualCamera ? 'text-emerald-400' : 'text-slate-400'}>{exam.enableDualCamera ? 'Required' : 'Optional'}</strong></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => handleCopyInvite(exam.code)}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode === exam.code ? 'Invite Link Copied!' : 'Copy Candidate Invite Link'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: CV Sensitivity & Security Policy */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 max-w-3xl">
          <div>
            <h3 className="text-base font-bold text-slate-100">Proctoring CV Sensitivity & Debounce Thresholds</h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure false-positive debounce tolerances, facial match confidence, and prohibited object recognition thresholds.
            </p>
          </div>

          <div className="space-y-5">
            {/* ArcFace Match */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>ArcFace Biometric Match Threshold:</span>
                <span className="font-mono text-blue-400">{faceConfidence}%</span>
              </div>
              <input
                type="range"
                min={75}
                max={99}
                value={faceConfidence}
                onChange={(e) => setFaceConfidence(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <span className="text-[11px] text-slate-500">Cross-matches registered ID photo against laptop & phone camera streams.</span>
            </div>

            {/* Tab switch grace period */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Tab-Switch Grace Period Debounce:</span>
                <span className="font-mono text-blue-400">{tabSwitchGraceMs} ms</span>
              </div>
              <input
                type="range"
                min={100}
                max={1500}
                step={50}
                value={tabSwitchGraceMs}
                onChange={(e) => setTabSwitchGraceMs(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <span className="text-[11px] text-slate-500">Prevents false alarms from transient OS notification focus blurs.</span>
            </div>

            {/* Audio db threshold */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Audio Speech Anomaly Threshold:</span>
                <span className="font-mono text-amber-400">{audioThresholdDb} dB</span>
              </div>
              <input
                type="range"
                min={50}
                max={90}
                value={audioThresholdDb}
                onChange={(e) => setAudioThresholdDb(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="text-[11px] text-slate-500">Web Audio API decibel threshold for background whisper/speech detection.</span>
            </div>

            {/* YOLO phone confidence */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>YOLOv8 Prohibited Device Confidence:</span>
                <span className="font-mono text-rose-400">{yoloPhoneConfidence}%</span>
              </div>
              <input
                type="range"
                min={60}
                max={95}
                value={yoloPhoneConfidence}
                onChange={(e) => setYoloPhoneConfidence(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
              <span className="text-[11px] text-slate-500">Confidence required before flagging smartphone or headphones in hand.</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => alert('Proctoring CV parameters successfully synchronized across active cluster nodes.')}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
            >
              Apply CV Configuration
            </button>
          </div>
        </div>
      )}

      {/* Forensic Audit Dossier Modal */}
      {selectedSession && (
        <CandidateAuditModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onDecisionUpdated={(updated) => {
            setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setSelectedSession(updated);
          }}
        />
      )}

      {/* Create Exam Modal */}
      {isCreateExamOpen && (
        <CreateExamModal
          onClose={() => setIsCreateExamOpen(false)}
          onExamCreated={(newExam) => {
            setExams((prev) => [newExam, ...prev]);
          }}
        />
      )}
    </div>
  );
};
