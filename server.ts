import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy Groq client helper
function getGroqClient(): Groq | null {
  const key = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  if (!key || key.includes('YOUR_GROQ_API_KEY')) return null;
  return new Groq({ apiKey: key });
}

// Robust JSON extractor for LLM output
function cleanParseJSON(rawText: string, fallback: any = {}) {
  if (!rawText) return fallback;
  try {
    return JSON.parse(rawText);
  } catch (e) {
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (innerErr) {}
    }
    const objectMatch = rawText.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch (innerErr) {}
    }
    return fallback;
  }
}

// Lazy Gemini client helper
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

// In-memory Database Store for realistic demo state
interface Store {
  exams: any[];
  sessions: any[];
  phonePairings: Record<string, any>;
}

const store: Store = {
  exams: [
    {
      id: 'exam-eng-101',
      code: 'ENG-2026',
      title: 'Senior Full-Stack & System Design Exam',
      category: 'Software Engineering',
      durationMinutes: 25,
      maxAllowedStrikes: 3,
      passingScorePercent: 70,
      scheduledDate: '2026-08-21T10:00:00Z',
      status: 'active',
      enableDualCamera: true,
      enableObjectDetection: true,
      enableAudioMonitoring: true,
      createdAt: new Date().toISOString(),
      instructions: [
        'Ensure both primary webcam and secondary paired phone camera remain unobstructed throughout.',
        'No tab switching or switching active browser windows is permitted. Any focus loss triggers a strike.',
        'Looking away from the screen for >5 seconds or presence of multiple faces will be flagged.',
        'Prohibited items (smartphones, headphones, notebooks) will be detected automatically via CV.',
        'Reaching 4 violations automatically terminates the exam session with an incident report.',
      ],
      questions: [
        {
          id: 'q1',
          type: 'mcq',
          question: 'What happens in a distributed system when network partitions occur, according to the CAP Theorem?',
          options: [
            'The system can guarantee Consistency and Availability simultaneously.',
            'The system must trade off between Consistency and Availability.',
            'The system automatically switches from synchronous to asynchronous replication.',
            'Partition tolerance is optional if using multi-leader consensus protocols.',
          ],
          correct_answer: 'The system must trade off between Consistency and Availability.',
          explanation: 'Under CAP Theorem, when a network partition (P) occurs, a distributed system must choose between guaranteeing Consistency (C) or Availability (A).',
          difficulty: 'medium',
          topic: 'Distributed Systems',
          subtopic: 'CAP Theorem',
          maxPoints: 5,
        },
        {
          id: 'q2',
          type: 'mcq',
          question: 'Which HTTP/2 and HTTP/3 feature eliminates Head-of-Line (HoL) blocking at the transport layer?',
          options: [
            'Server push in HTTP/2',
            'QUIC protocol utilizing independent streams over UDP in HTTP/3',
            'GZIP compression headers',
            'Chunked transfer encoding',
          ],
          correct_answer: 'QUIC protocol utilizing independent streams over UDP in HTTP/3',
          explanation: 'HTTP/3 runs over QUIC (UDP), which provides true multiplexing without transport-layer HoL blocking when a single packet is lost.',
          difficulty: 'hard',
          topic: 'Web Networking',
          subtopic: 'Protocols',
          maxPoints: 5,
        },
        {
          id: 'q3',
          type: 'mcq',
          question: 'In React 19, what is the primary benefit of the `use` API when resolving promises?',
          options: [
            'It prevents all client-side re-renders permanently.',
            'It integrates directly with Suspense boundaries, suspending component rendering until resolved.',
            'It replaces standard React state management with web workers.',
            'It executes code only in server actions and ignores client hydration.',
          ],
          correct_answer: 'It integrates directly with Suspense boundaries, suspending component rendering until resolved.',
          explanation: 'The `use` hook can read Promises and Context directly in render and seamlessly trigger Suspense fallbacks.',
          difficulty: 'medium',
          topic: 'Frontend Architecture',
          subtopic: 'React Internals',
          maxPoints: 5,
        },
        {
          id: 'q4',
          type: 'subjective',
          question: 'Explain how rate limiting with the Token Bucket algorithm works and how you would implement it in a distributed API gateway using Redis.',
          difficulty: 'hard',
          topic: 'System Design',
          subtopic: 'Rate Limiting',
          maxPoints: 10,
          rubricGuidelines: 'Candidate should mention: fixed bucket capacity, steady refill rate, atomic token decrement using Redis Lua script or sorted sets, handling clock drift, and returning HTTP 429 Too Many Requests.',
        },
        {
          id: 'q5',
          type: 'subjective',
          question: 'Describe the difference between pessimistic locking and optimistic concurrency control (OCC) in relational databases. When is OCC preferable?',
          difficulty: 'medium',
          topic: 'Database Engineering',
          subtopic: 'Concurrency Control',
          maxPoints: 10,
          rubricGuidelines: 'Must explain lock acquisition vs version/timestamp checking at commit. OCC is preferable in high-read low-contention environments where lock overhead hurts throughput.',
        },
      ],
    },
    {
      id: 'exam-ml-202',
      code: 'AI-2026',
      title: 'Machine Learning & Deep Learning Core Evaluation',
      category: 'Artificial Intelligence',
      durationMinutes: 20,
      maxAllowedStrikes: 3,
      passingScorePercent: 75,
      scheduledDate: '2026-08-22T14:00:00Z',
      status: 'scheduled',
      enableDualCamera: true,
      enableObjectDetection: true,
      enableAudioMonitoring: true,
      createdAt: new Date().toISOString(),
      instructions: [
        'Dual-camera angle required for wide workspace monitoring.',
        'Closed book: background noise and gaze redirection will be logged.',
      ],
      questions: [
        {
          id: 'ml-1',
          type: 'mcq',
          question: 'Why is FlashAttention computationally faster than standard Multi-Head Self-Attention?',
          options: [
            'It compresses token embeddings to 8-bit precision before matrix multiplication.',
            'It tiles matrix blocks to minimize slow High Bandwidth Memory (HBM) read/write operations by utilizing SRAM.',
            'It eliminates softmax computation entirely.',
            'It prunes attention weights below a certain threshold dynamically.',
          ],
          correct_answer: 'It tiles matrix blocks to minimize slow High Bandwidth Memory (HBM) read/write operations by utilizing SRAM.',
          explanation: 'FlashAttention uses tiling to perform the exact softmax without materializing large N×N attention matrices in global GPU HBM, computing in fast on-chip SRAM.',
          difficulty: 'hard',
          topic: 'Deep Learning',
          subtopic: 'Transformer Optimization',
          maxPoints: 5,
        },
      ],
    },
  ],
  sessions: [
    {
      id: 'sess-candidate-1',
      examId: 'exam-eng-101',
      examTitle: 'Senior Full-Stack & System Design Exam',
      candidateId: 'cand-001',
      candidateName: 'Alex Morgan',
      candidateEmail: 'alex.morgan@example.com',
      candidatePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      status: 'under_review',
      strikeCount: 2,
      maxStrikes: 3,
      startTime: '2026-08-21T07:15:00Z',
      endTime: '2026-08-21T07:38:00Z',
      remainingTimeSeconds: 0,
      answers: {
        q1: 'The system must trade off between Consistency and Availability.',
        q2: 'QUIC protocol utilizing independent streams over UDP in HTTP/3',
        q3: 'It integrates directly with Suspense boundaries, suspending component rendering until resolved.',
        q4: 'We maintain tokens in Redis key with TTL and refill based on elapsed time timestamp. When request arrives, Lua script decrements if tokens > 0, else returns 429.',
      },
      score: 22,
      totalPoints: 35,
      percentageScore: 63,
      integrityScore: 78,
      primaryCameraActive: true,
      secondaryCameraActive: true,
      micActive: true,
      violations: [
        {
          id: 'viol-101',
          sessionId: 'sess-candidate-1',
          candidateId: 'cand-001',
          candidateName: 'Alex Morgan',
          examId: 'exam-eng-101',
          examTitle: 'Senior Full-Stack & System Design Exam',
          timestamp: '2026-08-21T07:22:15Z',
          type: 'tab_switch',
          strikeNumber: 1,
          severity: 'medium',
          details: 'Browser window lost focus for 4.2 seconds (Page Visibility event).',
          snapshotDataUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          acknowledgedByCandidate: true,
        },
        {
          id: 'viol-102',
          sessionId: 'sess-candidate-1',
          candidateId: 'cand-001',
          candidateName: 'Alex Morgan',
          examId: 'exam-eng-101',
          examTitle: 'Senior Full-Stack & System Design Exam',
          timestamp: '2026-08-21T07:31:40Z',
          type: 'prohibited_object',
          strikeNumber: 2,
          severity: 'high',
          details: 'Secondary camera detected secondary smartphone in hand (Confidence: 94.2%).',
          snapshotDataUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
          acknowledgedByCandidate: true,
        },
      ],
      hrDecision: 'flagged',
      hrNotes: 'Candidate switched tabs once and phone was spotted near keyboard at minute 16. Needs senior recruiter manual audit.',
      reviewedBy: 'HR Lead Sarah Jenkins',
      reviewedAt: '2026-08-21T08:00:00Z',
    },
    {
      id: 'sess-candidate-2',
      examId: 'exam-eng-101',
      examTitle: 'Senior Full-Stack & System Design Exam',
      candidateId: 'cand-002',
      candidateName: 'Priya Sharma',
      candidateEmail: 'priya.sharma@techpulse.io',
      candidatePhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      status: 'approved',
      strikeCount: 0,
      maxStrikes: 3,
      startTime: '2026-08-21T06:00:00Z',
      endTime: '2026-08-21T06:24:00Z',
      remainingTimeSeconds: 0,
      answers: {
        q1: 'The system must trade off between Consistency and Availability.',
        q2: 'QUIC protocol utilizing independent streams over UDP in HTTP/3',
        q3: 'It integrates directly with Suspense boundaries, suspending component rendering until resolved.',
        q4: 'Token bucket algorithm maintains tokens with capacity B and replenishment rate R. Using a Redis hash with last_refill_timestamp and tokens_remaining, an atomic EVAL script calculates newly accrued tokens, validates sufficiency, deducts 1, and updates timestamp.',
        q5: 'Pessimistic locking locks rows on read (SELECT FOR UPDATE) preventing concurrent modifications. Optimistic Concurrency Control does not lock on read but checks version or hash at commit time. OCC is superior in high read concurrency with low conflict probability.',
      },
      score: 34,
      totalPoints: 35,
      percentageScore: 97,
      integrityScore: 99,
      primaryCameraActive: true,
      secondaryCameraActive: true,
      micActive: true,
      violations: [],
      hrDecision: 'approved',
      hrNotes: 'Flawless proctoring session. Zero tab switches, face continuously verified on dual feeds, outstanding technical answers.',
      reviewedBy: 'HR Lead Sarah Jenkins',
      reviewedAt: '2026-08-21T06:45:00Z',
    },
    {
      id: 'sess-candidate-3',
      examId: 'exam-eng-101',
      examTitle: 'Senior Full-Stack & System Design Exam',
      candidateId: 'cand-003',
      candidateName: 'Marcus Vance',
      candidateEmail: 'marcus.v@devnetwork.co',
      candidatePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      status: 'terminated_strikes',
      strikeCount: 4,
      maxStrikes: 3,
      startTime: '2026-08-21T05:10:00Z',
      endTime: '2026-08-21T05:21:00Z',
      remainingTimeSeconds: 840,
      answers: {
        q1: 'The system automatically switches from synchronous to asynchronous replication.',
      },
      score: 0,
      totalPoints: 35,
      percentageScore: 0,
      integrityScore: 12,
      primaryCameraActive: false,
      secondaryCameraActive: false,
      micActive: false,
      violations: [
        {
          id: 'viol-201',
          sessionId: 'sess-candidate-3',
          candidateId: 'cand-003',
          candidateName: 'Marcus Vance',
          examId: 'exam-eng-101',
          examTitle: 'Senior Full-Stack & System Design Exam',
          timestamp: '2026-08-21T05:12:10Z',
          type: 'tab_switch',
          strikeNumber: 1,
          severity: 'medium',
          details: 'Window blurred, candidate switched to another browser tab.',
          snapshotDataUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'viol-202',
          sessionId: 'sess-candidate-3',
          candidateId: 'cand-003',
          candidateName: 'Marcus Vance',
          examId: 'exam-eng-101',
          examTitle: 'Senior Full-Stack & System Design Exam',
          timestamp: '2026-08-21T05:14:30Z',
          type: 'multiple_faces',
          strikeNumber: 2,
          severity: 'high',
          details: 'Secondary face detected behind candidate.',
          snapshotDataUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'viol-203',
          sessionId: 'sess-candidate-3',
          candidateId: 'cand-003',
          candidateName: 'Marcus Vance',
          examId: 'exam-eng-101',
          examTitle: 'Senior Full-Stack & System Design Exam',
          timestamp: '2026-08-21T05:17:45Z',
          type: 'prohibited_object',
          strikeNumber: 3,
          severity: 'high',
          details: 'Smartphone detected in right hand.',
          snapshotDataUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'viol-204',
          sessionId: 'sess-candidate-3',
          candidateId: 'cand-003',
          candidateName: 'Marcus Vance',
          examId: 'exam-eng-101',
          examTitle: 'Senior Full-Stack & System Design Exam',
          timestamp: '2026-08-21T05:21:00Z',
          type: 'face_not_visible',
          strikeNumber: 4,
          severity: 'critical',
          details: '4th Strike: Candidate completely left camera frame for >15s. Session auto-terminated.',
          snapshotDataUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        },
      ],
      hrDecision: 'rejected',
      hrNotes: 'Candidate exceeded 3 violation limit. Auto-terminated on 4th strike with multiple faces and phone in hand.',
      reviewedBy: 'Automated System & HR Lead Sarah Jenkins',
      reviewedAt: '2026-08-21T05:22:00Z',
    },
  ],
  phonePairings: {},
};

// --- EXAM ROUTES ---
app.get('/api/exams', (req, res) => {
  res.json({ success: true, exams: store.exams });
});

app.post('/api/exams', (req, res) => {
  const { title, category, durationMinutes, maxAllowedStrikes, passingScorePercent, questions, instructions, enableDualCamera } = req.body;
  const newExam = {
    id: `exam-${Date.now()}`,
    code: `EXAM-${Math.floor(1000 + Math.random() * 9000)}`,
    title: title || 'Custom Scheduled Exam',
    category: category || 'General Technical',
    durationMinutes: Number(durationMinutes) || 30,
    maxAllowedStrikes: Number(maxAllowedStrikes) || 3,
    passingScorePercent: Number(passingScorePercent) || 70,
    scheduledDate: new Date().toISOString(),
    status: 'active',
    enableDualCamera: enableDualCamera !== false,
    enableObjectDetection: true,
    enableAudioMonitoring: true,
    createdAt: new Date().toISOString(),
    instructions: instructions || [
      'Dual-camera monitoring is active.',
      'Tab switching is prohibited.',
      '4th violation triggers immediate session termination.',
    ],
    questions: questions || [
      {
        id: 'q1',
        type: 'mcq',
        question: 'Which protocol is most suited for low-latency bidirectional real-time video streaming in modern browsers?',
        options: ['WebRTC', 'HTTP Polling', 'FTP', 'SMTP'],
        correct_answer: 'WebRTC',
        explanation: 'WebRTC provides sub-second peer-to-peer audio and video transmission with built-in NAT traversal.',
        difficulty: 'easy',
        topic: 'Networking',
        maxPoints: 5,
      },
    ],
  };
  store.exams.unshift(newExam);
  res.json({ success: true, exam: newExam });
});

app.get('/api/exams/:id', (req, res) => {
  const exam = store.exams.find((e) => e.id === req.params.id || e.code === req.params.id);
  if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });
  res.json({ success: true, exam });
});

// --- SESSIONS & LIVE PROCTORING ROUTES ---
app.get('/api/sessions', (req, res) => {
  res.json({ success: true, sessions: store.sessions });
});

app.get('/api/sessions/:id', (req, res) => {
  const session = store.sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
  res.json({ success: true, session });
});

app.post('/api/sessions/start', (req, res) => {
  const { examId, candidateName, candidateEmail, candidatePhotoUrl, secondaryDeviceCode } = req.body;
  const exam = store.exams.find((e) => e.id === examId || e.code === examId) || store.exams[0];
  
  const existingSession = store.sessions.find((s) => s.candidateEmail === candidateEmail && s.examId === exam.id && s.status === 'in_progress');
  if (existingSession) {
    return res.json({ success: true, session: existingSession, exam });
  }

  const newSession = {
    id: `sess-${Date.now()}`,
    examId: exam.id,
    examTitle: exam.title,
    candidateId: `cand-${Date.now().toString().slice(-4)}`,
    candidateName: candidateName || 'Candidate',
    candidateEmail: candidateEmail || `student-${Date.now()}@example.com`,
    candidatePhotoUrl: candidatePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    status: 'in_progress',
    strikeCount: 0,
    maxStrikes: exam.maxAllowedStrikes || 3,
    startTime: new Date().toISOString(),
    remainingTimeSeconds: exam.durationMinutes * 60,
    answers: {},
    integrityScore: 100,
    violations: [],
    primaryCameraActive: true,
    secondaryCameraActive: !!secondaryDeviceCode,
    micActive: true,
    secondaryDeviceCode: secondaryDeviceCode || '',
  };

  store.sessions.unshift(newSession);
  res.json({ success: true, session: newSession, exam });
});

app.post('/api/sessions/:id/update', (req, res) => {
  const session = store.sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

  const { answers, status, remainingTimeSeconds, primaryCameraActive, secondaryCameraActive, micActive } = req.body;
  if (answers !== undefined) session.answers = { ...session.answers, ...answers };
  if (status !== undefined) session.status = status;
  if (remainingTimeSeconds !== undefined) session.remainingTimeSeconds = remainingTimeSeconds;
  if (primaryCameraActive !== undefined) session.primaryCameraActive = primaryCameraActive;
  if (secondaryCameraActive !== undefined) session.secondaryCameraActive = secondaryCameraActive;
  if (micActive !== undefined) session.micActive = micActive;

  if (status === 'submitted' || status === 'terminated_strikes') {
    session.endTime = new Date().toISOString();
    // Calculate Score for MCQs
    const exam = store.exams.find((e) => e.id === session.examId);
    if (exam) {
      let earned = 0;
      let total = 0;
      exam.questions.forEach((q: any) => {
        const pts = q.maxPoints || 5;
        total += pts;
        if (q.type === 'mcq' && session.answers[q.id] === q.correct_answer) {
          earned += pts;
        } else if (q.type === 'subjective' && session.answers[q.id] && session.answers[q.id].length > 20) {
          // Give provisional score pending AI/HR grading
          earned += Math.floor(pts * 0.7);
        }
      });
      session.score = earned;
      session.totalPoints = total;
      session.percentageScore = Math.round((earned / (total || 1)) * 100);
      if (session.status !== 'terminated_strikes') {
        session.status = 'under_review';
      }
    }
  }

  res.json({ success: true, session });
});

// Violation logging with 3-strike check
app.post('/api/sessions/:id/violation', (req, res) => {
  const session = store.sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

  const { type, details, snapshotDataUrl, secondaryCameraSnapshot, severity } = req.body;
  const newStrikeNumber = (session.strikeCount || 0) + 1;
  session.strikeCount = newStrikeNumber;

  // Calculate integrity score penalty
  const penalty = severity === 'critical' ? 30 : severity === 'high' ? 20 : 10;
  session.integrityScore = Math.max(0, session.integrityScore - penalty);

  const violation: any = {
    id: `viol-${Date.now()}`,
    sessionId: session.id,
    candidateId: session.candidateId,
    candidateName: session.candidateName,
    examId: session.examId,
    examTitle: session.examTitle,
    timestamp: new Date().toISOString(),
    type: type || 'tab_switch',
    strikeNumber: newStrikeNumber,
    severity: severity || (newStrikeNumber >= 3 ? 'critical' : 'high'),
    details: details || `Violation #${newStrikeNumber} recorded by proctoring engine.`,
    snapshotDataUrl: snapshotDataUrl || '',
    secondaryCameraSnapshot: secondaryCameraSnapshot || '',
    acknowledgedByCandidate: false,
  };

  session.violations.push(violation);

  let isTerminated = false;
  // Strike 4 triggers auto-submit and force exit
  if (newStrikeNumber > session.maxStrikes) {
    session.status = 'terminated_strikes';
    session.endTime = new Date().toISOString();
    isTerminated = true;
  }

  res.json({
    success: true,
    session,
    violation,
    strikeNumber: newStrikeNumber,
    isTerminated,
    remainingStrikes: Math.max(0, (session.maxStrikes + 1) - newStrikeNumber),
  });
});

// HR Review / Approval
app.post('/api/sessions/:id/hr-decision', (req, res) => {
  const session = store.sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

  const { decision, notes, reviewedBy, scoreAdjustment } = req.body;
  session.hrDecision = decision; // 'approved' | 'rejected' | 'flagged'
  session.hrNotes = notes || '';
  session.reviewedBy = reviewedBy || 'HR Admin';
  session.reviewedAt = new Date().toISOString();

  if (decision === 'approved') session.status = 'approved';
  if (decision === 'rejected') session.status = 'rejected';
  if (decision === 'flagged') session.status = 'under_review';

  if (scoreAdjustment !== undefined) {
    session.score = Number(scoreAdjustment);
    if (session.totalPoints) {
      session.percentageScore = Math.round((session.score / session.totalPoints) * 100);
    }
  }

  res.json({ success: true, session });
});

// --- SECONDARY PHONE CAMERA PAIRING ROUTES ---
app.post('/api/pair/generate', (req, res) => {
  const { sessionId, candidateId, candidateName, examTitle } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  store.phonePairings[code] = {
    code,
    sessionId: sessionId || `sess-${Date.now()}`,
    candidateId: candidateId || 'cand-001',
    candidateName: candidateName || 'Candidate',
    examTitle: examTitle || 'Live Proctor Exam',
    status: 'waiting',
    lastPing: Date.now(),
    latestFrame: '',
  };

  res.json({ success: true, code, pairing: store.phonePairings[code] });
});

app.get('/api/pair/:code/status', (req, res) => {
  const pairing = store.phonePairings[req.params.code];
  if (!pairing) return res.status(404).json({ success: false, error: 'Invalid pairing code' });
  res.json({ success: true, pairing });
});

app.post('/api/pair/:code/stream', (req, res) => {
  const pairing = store.phonePairings[req.params.code];
  if (!pairing) return res.status(404).json({ success: false, error: 'Invalid pairing code' });

  const { frame, status } = req.body;
  pairing.lastPing = Date.now();
  if (status) pairing.status = status;
  if (frame) pairing.latestFrame = frame;

  // Also update session secondaryCameraActive if linked
  if (pairing.sessionId) {
    const sess = store.sessions.find((s) => s.id === pairing.sessionId);
    if (sess) sess.secondaryCameraActive = true;
  }

  res.json({ success: true });
});

app.get('/api/pair/:code/frame', (req, res) => {
  const pairing = store.phonePairings[req.params.code];
  if (!pairing) return res.status(404).json({ success: false, error: 'Pairing not found' });
  res.json({
    success: true,
    status: pairing.status,
    latestFrame: pairing.latestFrame || null,
    isAlive: Date.now() - pairing.lastPing < 8000,
  });
});

// --- SEPARATE LLM PRACTICE SUITE (Using Groq Llama 3.3 & Gemini API) ---
// 1. Generate Practice MCQs with strict exam quality rules
app.post('/api/practice/generate-mcq', async (req, res) => {
  try {
    const { topic, subtopic, difficulty = 'medium', count = 5, previousQuestions = [] } = req.body;
    const groq = getGroqClient();
    const ai = getGeminiClient();

    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ questions: [], error: 'Topic is required to generate practice questions.' });
    }

    const prompt = `You are an expert exam question generator integrated into an educational practice platform used by students preparing for proctored exams.

CONTEXT:
Generate a set of high-quality, original MCQs.
- Topic: "${topic}"
- Subtopic: "${subtopic || 'General'}"
- Difficulty: "${difficulty}" (easy: recall/definitions; medium: application/reasoning; hard: multi-step analysis/edge cases)
- Number of questions: ${count}
${previousQuestions.length > 0 ? `- Previously generated to avoid repeating: ${JSON.stringify(previousQuestions.slice(-10))}` : ''}

RULES FOR QUESTION QUALITY:
- Each question must test a single, clear concept. Avoid compound or trick questions.
- Factually accurate and unambiguous correct answer.
- Exactly 4 answer options with only ONE correct answer.
- Incorrect options (distractors) must be plausible and realistic.
- Do NOT use "All of the above" or "None of the above".
- Explanation: 2-3 concise sentences explaining why the correct answer is right and why distractors fail.

OUTPUT JSON FORMAT ONLY with schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_answer": "exact string match of correct option",
      "explanation": "concise explanation",
      "difficulty": "${difficulty}",
      "topic": "${topic}",
      "subtopic": "${subtopic || ''}"
    }
  ]
}`;

    if (groq) {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an AI exam question generator. Output ONLY a valid JSON object matching the schema.' },
          { role: 'user', content: prompt }
        ],
        model: 'groq/compound',
      });

      const rawText = completion.choices[0]?.message?.content || '';
      const parsed = cleanParseJSON(rawText, { questions: [] });
      return res.json(parsed);
    }

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correct_answer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    topic: { type: Type.STRING },
                    subtopic: { type: Type.STRING },
                  },
                  required: ['id', 'question', 'options', 'correct_answer', 'explanation', 'difficulty', 'topic'],
                },
              },
              error: { type: Type.STRING },
            },
            required: ['questions'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{"questions":[]}');
      return res.json(parsed);
    }

    // Fallback realistic questions when API key is not configured
    return res.json({
      questions: [
        {
          id: `q-mock-${Date.now()}-1`,
          question: `In ${topic} (${subtopic || 'Core Concept'}), what is the primary architectural tradeoff regarding state management at scale?`,
          options: [
            'Centralized synchronized state vs Distributed partition tolerance',
            'Single thread execution vs Monolithic kernel caching',
            'Static asset compression vs Dynamic CDN routing',
            'Lossless image encoding vs Floating point precision',
          ],
          correct_answer: 'Centralized synchronized state vs Distributed partition tolerance',
          explanation: 'Large-scale distributed systems must balance strong immediate consistency with network partition resilience. Centralized state creates bottlenecks.',
          difficulty: difficulty,
          topic: topic,
          subtopic: subtopic || 'Architecture',
        },
        {
          id: `q-mock-${Date.now()}-2`,
          question: `Which data structure provides amortized O(1) average time complexity for both key insertion and lookup operations in ${topic}?`,
          options: [
            'Hash Table with good hash distribution',
            'Balanced Red-Black Binary Search Tree',
            'Singly-linked Skip List',
            'B+ Tree with leaf node chaining',
          ],
          correct_answer: 'Hash Table with good hash distribution',
          explanation: 'Hash tables offer O(1) average lookup/insertion. Trees and skip lists typically offer O(log n) time.',
          difficulty: difficulty,
          topic: topic,
          subtopic: subtopic || 'Data Structures',
        },
      ],
    });
  } catch (error: any) {
    console.error('Error generating practice MCQs:', error);
    res.status(500).json({ questions: [], error: error.message || 'Failed to generate practice questions' });
  }
});

// 2. Evaluate Subjective / Short-Answer practice with rubric scoring
app.post('/api/practice/evaluate-subjective', async (req, res) => {
  try {
    const { question, studentAnswer, rubricGuidelines, topic, maxScore = 10 } = req.body;
    const groq = getGroqClient();
    const ai = getGeminiClient();

    if (!question || !studentAnswer) {
      return res.status(400).json({ error: 'Question and student answer are required.' });
    }

    const prompt = `You are a strict yet constructive exam grading examiner for a proctored technical evaluation.
Grade the candidate's subjective response objectively based on the question and rubric.

Question: "${question}"
Topic: "${topic || 'General Technical'}"
Rubric / Ideal Guidelines: "${rubricGuidelines || 'Evaluate conceptual correctness, depth, edge cases, and practical clarity.'}"
Maximum Possible Score: ${maxScore}

Candidate's Submitted Answer:
"""
${studentAnswer}
"""

Evaluate fairly. Return ONLY JSON matching this schema:
{
  "score": number,
  "maxScore": ${maxScore},
  "overallFeedback": "string",
  "strengths": ["string"],
  "areasForImprovement": ["string"],
  "keyMissingPoints": ["string"],
  "modelAnswer": "string",
  "criteriaBreakdown": [
    { "criterion": "string", "score": number, "max": number, "comment": "string" }
  ]
}`;

    if (groq) {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an AI exam evaluation engine. Output ONLY valid JSON matching the schema.' },
          { role: 'user', content: prompt }
        ],
        model: 'groq/compound',
      });

      const rawText = completion.choices[0]?.message?.content || '';
      const parsed = cleanParseJSON(rawText, {});
      return res.json(parsed);
    }

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              maxScore: { type: Type.NUMBER },
              overallFeedback: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyMissingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              modelAnswer: { type: Type.STRING },
              criteriaBreakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    criterion: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                    max: { type: Type.NUMBER },
                    comment: { type: Type.STRING },
                  },
                  required: ['criterion', 'score', 'max', 'comment'],
                },
              },
            },
            required: ['score', 'maxScore', 'overallFeedback', 'strengths', 'areasForImprovement', 'keyMissingPoints', 'modelAnswer', 'criteriaBreakdown'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    }

    // Graceful fallback evaluation
    const lengthScore = Math.min(maxScore, Math.max(3, Math.floor(studentAnswer.length / 50)));
    return res.json({
      score: lengthScore,
      maxScore,
      overallFeedback: 'Your response demonstrates a foundational grasp of the core concepts, with clear explanations of primary mechanisms.',
      strengths: ['Identified the core problem statement accurately', 'Structured answer clearly with logical progression'],
      areasForImprovement: ['Elaborate on edge cases and failure recovery strategies', 'Include quantitative metrics or algorithmic complexities'],
      keyMissingPoints: ['Specific performance benchmarks under high contention'],
      modelAnswer: 'A comprehensive answer highlights both theoretical trade-offs, step-by-step mechanics, and distributed resilience considerations.',
      criteriaBreakdown: [
        { criterion: 'Conceptual Accuracy', score: Math.round(lengthScore * 0.4), max: Math.round(maxScore * 0.4), comment: 'Accurate high-level definitions.' },
        { criterion: 'Technical Depth', score: Math.round(lengthScore * 0.4), max: Math.round(maxScore * 0.4), comment: 'Good explanation of mechanics.' },
        { criterion: 'Clarity & Edge Cases', score: Math.round(lengthScore * 0.2), max: Math.round(maxScore * 0.2), comment: 'Could expand on boundary constraints.' },
      ],
    });
  } catch (error: any) {
    console.error('Error evaluating subjective answer:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate answer' });
  }
});

// 3. AI Study Assistant Doubt Solving Chat
app.post('/api/practice/ask-doubt', async (req, res) => {
  try {
    const { questionContext, userQuery, conversationHistory = [] } = req.body;
    const groq = getGroqClient();
    const ai = getGeminiClient();

    if (!userQuery) return res.status(400).json({ error: 'Query is required.' });

    const prompt = `You are an encouraging, highly knowledgeable AI Exam Preparation Tutor for students studying for rigorous exams.
The student has a doubt about a practice question.

Question Context:
"${questionContext || 'General practice question'}"

Student's Question:
"${userQuery}"

Provide a crisp, crystal-clear explanation (under 3-4 paragraphs) that breaks down the concepts intuitively with analogies or concise pseudo-code where helpful, without being overly verbose.`;

    if (groq) {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an encouraging AI Exam Preparation Tutor.' },
          { role: 'user', content: prompt }
        ],
        model: 'groq/compound',
      });

      const reply = completion.choices[0]?.message?.content || '';
      return res.json({ reply });
    }

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return res.json({ reply: response.text });
    }

    res.json({
      reply: `Regarding your question about "${questionContext?.slice(0, 60) || 'this topic'}": The key principle is understanding the underlying architectural mechanics. Make sure you can trace the data flow step-by-step and identify why incorrect choices fail under boundary conditions.`,
    });
  } catch (error: any) {
    console.error('Error answering doubt:', error);
    res.status(500).json({ error: error.message || 'Failed to answer doubt' });
  }
});

// --- SERVER INITIALIZATION ---
const isProduction = process.env.NODE_ENV === 'production';
const staticDistPath = path.resolve(process.cwd(), 'dist');

async function startServer() {
  if (isProduction) {
    app.use(express.static(staticDistPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticDistPath, 'index.html'));
    });
  } else {
    // Vite dev middleware for development mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Proctoring Server running on port ${PORT}`);
  });
}

startServer();
