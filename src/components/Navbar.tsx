import React, { useState } from 'react';
import { ShieldCheck, Video, Users, BookOpen, Smartphone, Activity, Menu, X, LogIn, UserPlus, LogOut, User as UserIcon } from 'lucide-react';
import { UserRole } from '../types';
import { User } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface NavbarProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  activeView: 'exam' | 'practice' | 'hr' | 'phone_streamer';
  setActiveView: (view: 'exam' | 'practice' | 'hr' | 'phone_streamer') => void;
  isExamInProgress?: boolean;
  user?: User | null;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  setRole,
  activeView,
  setActiveView,
  isExamInProgress = false,
  user = null,
  onOpenAuth,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white shadow-md select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => !isExamInProgress && setActiveView(currentRole === 'hr' ? 'hr' : 'exam')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                ProctorGuard AI
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Enterprise CV
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Dual-Stream 3-Strike Proctoring
            </p>
          </div>
        </div>

        {/* Center Navigation when not in active locked exam */}
        {!isExamInProgress && (
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shadow-inner">
            <button
              id="nav-candidate-exam-btn"
              onClick={() => {
                setRole('student');
                setActiveView('exam');
              }}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'exam' && currentRole === 'student'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Candidate Exam</span>
            </button>

            <button
              id="nav-practice-suite-btn"
              onClick={() => {
                setRole('student');
                setActiveView('practice');
              }}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'practice'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
              <span>AI Practice Hub</span>
              <span className="text-[9px] bg-indigo-400/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-400/30 font-mono">LLM</span>
            </button>

            <button
              id="nav-hr-dashboard-btn"
              onClick={() => {
                setRole('hr');
                setActiveView('hr');
              }}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'hr' && currentRole === 'hr'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>HR Live Command</span>
            </button>

            <button
              id="nav-phone-stream-btn"
              onClick={() => setActiveView('phone_streamer')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'phone_streamer'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
              <span>Phone Streamer</span>
            </button>
          </nav>
        )}

        {/* Right Controls: Role Switcher & Auth Buttons */}
        <div className="flex items-center space-x-3">
          {isExamInProgress ? (
            <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-lg text-rose-400 text-xs font-semibold animate-pulse">
              <Activity className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">PROCTORED EXAM IN PROGRESS (LOCKED)</span>
              <span className="sm:hidden">EXAM LOCKED</span>
            </div>
          ) : (
            <>
              {/* Role Switcher */}
              <div className="hidden lg:flex items-center space-x-2 text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 hidden sm:inline">Role:</span>
                <button
                  id="role-switch-student"
                  onClick={() => {
                    setRole('student');
                    setActiveView('exam');
                  }}
                  className={`font-semibold px-2 py-0.5 rounded transition ${
                    currentRole === 'student'
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Candidate
                </button>
                <span className="text-slate-600">|</span>
                <button
                  id="role-switch-hr"
                  onClick={() => {
                    setRole('hr');
                    setActiveView('hr');
                  }}
                  className={`font-semibold px-2 py-0.5 rounded transition ${
                    currentRole === 'hr'
                      ? 'bg-amber-500 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  HR Admin
                </button>
              </div>

              {/* Login / Sign Up vs User Profile */}
              {user ? (
                <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1.5 rounded-xl">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full border border-blue-400/40" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-slate-100 max-w-[100px] truncate leading-tight">
                      {user.displayName || 'Candidate'}
                    </div>
                    <div className="text-[10px] text-slate-400 max-w-[100px] truncate leading-tight">
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 transition ml-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    id="nav-login-btn"
                    onClick={() => onOpenAuth && onOpenAuth('login')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
                  >
                    <LogIn className="w-3.5 h-3.5 text-blue-400" />
                    <span>Login</span>
                  </button>

                  <button
                    id="nav-signup-btn"
                    onClick={() => onOpenAuth && onOpenAuth('signup')}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}
            </>
          )}

          {!isExamInProgress && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {!isExamInProgress && mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-2">
          <button
            onClick={() => {
              setRole('student');
              setActiveView('exam');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
              activeView === 'exam' && currentRole === 'student' ? 'bg-blue-600 text-white' : 'text-slate-300 bg-slate-800/60'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Candidate Exam Portal</span>
          </button>

          <button
            onClick={() => {
              setRole('student');
              setActiveView('practice');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
              activeView === 'practice' ? 'bg-indigo-600 text-white' : 'text-slate-300 bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>AI Practice & Knowledge Hub</span>
          </button>

          <button
            onClick={() => {
              setRole('hr');
              setActiveView('hr');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
              activeView === 'hr' && currentRole === 'hr' ? 'bg-amber-600 text-white' : 'text-slate-300 bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>HR Command Console</span>
          </button>

          <button
            onClick={() => {
              setActiveView('phone_streamer');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
              activeView === 'phone_streamer' ? 'bg-emerald-600 text-white' : 'text-slate-300 bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Secondary Phone Camera Streamer</span>
          </button>
        </div>
      )}
    </header>
  );
};

