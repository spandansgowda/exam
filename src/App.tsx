import React, { useState, useEffect } from 'react';
import { UserRole, Exam, ExamSession } from './types';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { IDVerification } from './components/StudentExamFlow/IDVerification';
import { SystemCheckModal } from './components/StudentExamFlow/SystemCheckModal';
import { PhonePairingModal } from './components/StudentExamFlow/PhonePairingModal';
import { ActiveExamRoom } from './components/StudentExamFlow/ActiveExamRoom';
import { ExamCompletedView } from './components/StudentExamFlow/ExamCompletedView';
import { PracticeHub } from './components/PracticeSuite/PracticeHub';
import { HRDashboard } from './components/HRDashboard/HRDashboard';
import { PhoneStreamer } from './components/MobilePhoneCamera/PhoneStreamer';
import { ShieldCheck, Video, ArrowRight, BookOpen, Users, Smartphone, CheckSquare, Sparkles, KeyRound } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

export default function App() {
  // Firebase Auth State & Modal
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Global Role and View State
  const [role, setRole] = useState<UserRole>('student');
  const [activeView, setActiveView] = useState<'exam' | 'practice' | 'hr' | 'phone_streamer'>('exam');

  // Candidate Pre-Exam State Flow
  // 0 = Lobby / Invite, 1 = ID Verification, 2 = Diagnostics, 3 = Phone Pairing, 4 = Rules, 5 = In Exam, 6 = Completed
  const [examStep, setExamStep] = useState<number>(0);
  const [candidateName, setCandidateName] = useState('Alex Morgan');
  const [candidateEmail, setCandidateEmail] = useState('alex.morgan@example.com');
  const [examCodeInput, setExamCodeInput] = useState('ENG-2026');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [registeredPhoto, setRegisteredPhoto] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [rulesAgreed, setRulesAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.displayName) setCandidateName(currentUser.displayName);
        if (currentUser.email) setCandidateEmail(currentUser.email);
      }
    });
    return () => unsubscribe();
  }, []);

  // Parse URL query params on load (e.g. for phone pairing: ?role=phone&code=123456)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const codeParam = params.get('code');
    const examParam = params.get('exam');

    if (roleParam === 'phone') {
      setActiveView('phone_streamer');
      if (codeParam) setPairingCode(codeParam);
    } else if (roleParam === 'hr') {
      setRole('hr');
      setActiveView('hr');
    }

    if (examParam) {
      setExamCodeInput(examParam);
    }
  }, []);

  // Fetch available exam on code enter
  const handleProceedFromLobby = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/exams/${examCodeInput.trim() || 'ENG-2026'}`);
      const data = await res.json();
      if (data.success && data.exam) {
        setSelectedExam(data.exam);
        setExamStep(1); // Go to ID Verification
      } else {
        // Fallback to first available exam
        const allRes = await fetch('/api/exams');
        const allData = await allRes.json();
        if (allData.exams && allData.exams.length > 0) {
          setSelectedExam(allData.exams[0]);
          setExamStep(1);
        }
      }
    } catch (err) {
      console.error('Failed to fetch exam:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start Live Session
  const handleStartExamSession = async () => {
    if (!selectedExam) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam.id,
          candidateName,
          candidateEmail,
          candidatePhotoUrl: registeredPhoto,
          secondaryDeviceCode: pairingCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.session);
        setExamStep(5); // In Exam Room
      }
    } catch (err) {
      console.error('Failed to start session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isExamInProgress = activeView === 'exam' && examStep === 5;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Universal Top Navigation */}
      <Navbar
        currentRole={role}
        setRole={setRole}
        activeView={activeView}
        setActiveView={setActiveView}
        isExamInProgress={isExamInProgress}
        user={user}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
      />

      <main className="flex-1">
        {/* VIEW 1: HR Command Console */}
        {activeView === 'hr' && <HRDashboard />}

        {/* VIEW 2: Separate LLM Practice Hub */}
        {activeView === 'practice' && <PracticeHub />}

        {/* VIEW 3: Dedicated Mobile Phone Camera Streamer */}
        {activeView === 'phone_streamer' && (
          <PhoneStreamer
            initialCode={pairingCode}
            onExit={() => setActiveView('exam')}
          />
        )}

        {/* VIEW 4: Candidate Exam Flow */}
        {activeView === 'exam' && (
          <div className="py-8 px-4 sm:px-6">
            {/* Step 0: Exam Lobby & Invite Entry */}
            {examStep === 0 && (
              <div className="max-w-xl mx-auto my-6 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-100">Candidate Exam Entry Portal</h1>
                    <p className="text-xs text-slate-400">Enter your credentials and exam invite code to begin.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Full Legal Name:</label>
                    <input
                      type="text"
                      required
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Candidate Email:</label>
                    <input
                      type="email"
                      required
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      placeholder="e.g. alex.morgan@example.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Exam Code / Invite Token:</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={examCodeInput}
                        onChange={(e) => setExamCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. ENG-2026"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-blue-400 focus:outline-none focus:border-blue-500 uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>AI Dual-Camera 3-Strike Proctoring Rules:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    You will be guided through ID biometric verification, hardware checks, and optional mobile camera pairing. Tab-switching or unauthorized aids will log strikes.
                  </p>
                </div>

                <button
                  id="start-pre-exam-flow-btn"
                  onClick={handleProceedFromLobby}
                  disabled={!candidateName.trim() || isLoading}
                  className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition disabled:opacity-40"
                >
                  <span>{isLoading ? 'Verifying Invite...' : 'Continue to ID Verification'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 1: ID & Facial Biometric Capture */}
            {examStep === 1 && (
              <IDVerification
                candidateName={candidateName}
                onVerified={(photoUrl) => {
                  setRegisteredPhoto(photoUrl);
                  setExamStep(2); // Go to System Check
                }}
              />
            )}

            {/* Step 2: System Diagnostics Check */}
            {examStep === 2 && (
              <SystemCheckModal
                onPassed={() => setExamStep(3)} // Go to Phone Pairing
              />
            )}

            {/* Step 3: Secondary Phone Pairing */}
            {examStep === 3 && (
              <PhonePairingModal
                candidateName={candidateName}
                examTitle={selectedExam?.title || 'Senior Engineering Exam'}
                onPaired={(code) => {
                  setPairingCode(code);
                  setExamStep(4); // Go to Rules Acknowledgment
                }}
              />
            )}

            {/* Step 4: Strict Exam Rules & Final Acknowledgment */}
            {examStep === 4 && (
              <div className="max-w-2xl mx-auto my-6 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-white">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">Step 4: Examination Security Rules</h2>
                    <p className="text-xs text-slate-400">Please review and acknowledge the proctoring terms before launching the exam.</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start space-x-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0"></span>
                    <span><strong>Tab / Window Switch Detection:</strong> Switching tabs or opening external applications immediately logs a strike.</span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0"></span>
                    <span><strong>3-Strike Violation System:</strong> Strikes 1 and 2 display warning modals. Strike 3 is the final warning. The 4th violation automatically submits and locks the exam.</span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0"></span>
                    <span><strong>Continuous Biometrics & Objects:</strong> Face presence and secondary devices (phones, headphones) are continuously verified via CV.</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="acknowledge-rules-checkbox"
                    checked={rulesAgreed}
                    onChange={(e) => setRulesAgreed(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="acknowledge-rules-checkbox" className="text-xs text-slate-200 font-semibold cursor-pointer">
                    I understand and accept the 3-strike proctoring rules and authorize dual-stream monitoring.
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setExamStep(3)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Back to Pairing
                  </button>

                  <button
                    id="launch-live-exam-btn"
                    onClick={handleStartExamSession}
                    disabled={!rulesAgreed || isLoading}
                    className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-40"
                  >
                    <span>{isLoading ? 'Starting Exam...' : 'Enter Proctored Exam Room'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Active Proctored Exam Room */}
            {examStep === 5 && selectedExam && activeSession && (
              <ActiveExamRoom
                exam={selectedExam}
                session={activeSession}
                onSessionUpdated={(updated) => setActiveSession(updated)}
                onExamFinished={(final) => {
                  setActiveSession(final);
                  setExamStep(6); // Completed view
                }}
                candidatePhotoUrl={registeredPhoto}
                pairingCode={pairingCode}
              />
            )}

            {/* Step 6: Post-Exam Completed Summary */}
            {examStep === 6 && activeSession && (
              <ExamCompletedView
                session={activeSession}
                onGoToPractice={() => setActiveView('practice')}
                onRetakeOrReset={() => {
                  setExamStep(0);
                  setActiveSession(null);
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Firebase Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          if (loggedInUser.displayName) setCandidateName(loggedInUser.displayName);
          if (loggedInUser.email) setCandidateEmail(loggedInUser.email);
        }}
      />
    </div>
  );
}
