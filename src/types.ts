export type UserRole = 'hr' | 'student';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  registeredPhoto?: string;
  studentId: string;
}

export type ViolationType =
  | 'tab_switch'
  | 'face_not_visible'
  | 'multiple_faces'
  | 'face_mismatch'
  | 'phone_disconnected'
  | 'prohibited_object'
  | 'audio_anomaly';

export interface ViolationEvent {
  id: string;
  sessionId: string;
  candidateId: string;
  candidateName: string;
  examId: string;
  examTitle: string;
  timestamp: string;
  type: ViolationType;
  strikeNumber: number; // 1, 2, 3, or 4 (auto-terminate)
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  snapshotDataUrl?: string;
  secondaryCameraSnapshot?: string;
  acknowledgedByCandidate?: boolean;
}

export interface ExamQuestion {
  id: string;
  type: 'mcq' | 'subjective';
  question: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  subtopic?: string;
  maxPoints: number;
  rubricGuidelines?: string;
}

export interface Exam {
  id: string;
  code: string;
  title: string;
  category: string;
  durationMinutes: number;
  maxAllowedStrikes: number; // default 3, 4th terminates
  passingScorePercent: number;
  questions: ExamQuestion[];
  instructions: string[];
  scheduledDate: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  enableDualCamera: boolean;
  enableObjectDetection: boolean;
  enableAudioMonitoring: boolean;
  createdAt: string;
}

export interface ExamSession {
  id: string;
  examId: string;
  examTitle: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhotoUrl?: string;
  status:
    | 'system_check'
    | 'in_progress'
    | 'submitted'
    | 'terminated_strikes'
    | 'under_review'
    | 'approved'
    | 'rejected';
  strikeCount: number;
  maxStrikes: number;
  startTime?: string;
  endTime?: string;
  remainingTimeSeconds: number;
  answers: Record<string, string>; // questionId -> answer text or selected option
  score?: number;
  totalPoints?: number;
  percentageScore?: number;
  integrityScore: number; // 0 - 100%
  violations: ViolationEvent[];
  primaryCameraActive: boolean;
  secondaryCameraActive: boolean;
  micActive: boolean;
  secondaryDeviceCode?: string;
  hrDecision?: 'approved' | 'rejected' | 'flagged';
  hrNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface PhonePairingSession {
  code: string;
  sessionId: string;
  candidateId: string;
  candidateName: string;
  examTitle: string;
  status: 'waiting' | 'connected' | 'streaming' | 'disconnected';
  lastPing: number;
  latestFrame?: string;
}

export interface PracticeEvaluationResult {
  score: number;
  maxScore: number;
  overallFeedback: string;
  strengths: string[];
  areasForImprovement: string[];
  keyMissingPoints: string[];
  modelAnswer: string;
  criteriaBreakdown: {
    criterion: string;
    score: number;
    max: number;
    comment: string;
  }[];
}

export interface DoubtChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  questionContext?: string;
}
