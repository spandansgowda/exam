import React, { useEffect, useRef, useState } from 'react';
import { Video, Smartphone, Eye, Mic, AlertCircle, ShieldAlert, Sparkles, User, RefreshCw } from 'lucide-react';
import { ViolationType } from '../../types';

interface ProctorCameraFeedsProps {
  primaryStream: MediaStream | null;
  secondaryFrame: string | null;
  audioLevel: number;
  strikeCount: number;
  maxStrikes: number;
  integrityScore: number;
  onManualTriggerViolation?: (type: ViolationType, details: string) => void;
}

export const ProctorCameraFeeds: React.FC<ProctorCameraFeedsProps> = ({
  primaryStream,
  secondaryFrame,
  audioLevel,
  strikeCount,
  maxStrikes,
  integrityScore,
  onManualTriggerViolation,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceStatus, setFaceStatus] = useState<'verified' | 'multiple_detected' | 'not_visible'>('verified');
  const [gazeStatus, setGazeStatus] = useState<'center' | 'left' | 'right' | 'down'>('center');
  const [isMinimized, setIsMinimized] = useState(false);

  // Hook primary video stream to element
  useEffect(() => {
    if (videoRef.current && primaryStream) {
      videoRef.current.srcObject = primaryStream;
    }
  }, [primaryStream]);

  // Simulate Face Tracking & Bounding Box on canvas
  useEffect(() => {
    let animationFrameId: number;

    function drawTrackingOverlay() {
      if (!canvasRef.current || !videoRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 320;
      canvas.height = 180;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (faceStatus === 'verified') {
        // Draw Face Bounding Box
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        const boxX = 100;
        const boxY = 30;
        const boxW = 120;
        const boxH = 120;

        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Corner brackets
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        const cl = 12;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + cl); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + cl, boxY);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - cl, boxY); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW, boxY + cl);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + boxH - cl); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + cl, boxY + boxH);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - cl, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH - cl);
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(boxX, boxY - 18, 100, 18);
        ctx.fillStyle = '#93c5fd';
        ctx.font = '10px monospace';
        ctx.fillText('ArcFace ID: 99.2%', boxX + 4, boxY - 5);
      } else if (faceStatus === 'multiple_detected') {
        // Red warning box 1
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 40, 90, 90);
        // Red warning box 2
        ctx.strokeRect(170, 40, 90, 90);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.fillRect(50, 22, 160, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText('MULTIPLE FACES DETECTED', 54, 35);
      }

      animationFrameId = requestAnimationFrame(drawTrackingOverlay);
    }

    drawTrackingOverlay();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [faceStatus]);

  return (
    <aside aria-label="Live Proctoring Feeds" className="fixed bottom-4 right-4 z-30 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all text-white">
      {/* Header Bar */}
      <div className="bg-slate-950/80 px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-200 tracking-wide">LIVE PROCTORING ENGINE</span>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              strikeCount === 0
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : strikeCount < maxStrikes
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}
          >
            Strikes: {strikeCount}/{maxStrikes}
          </span>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-slate-400 hover:text-slate-200 text-xs px-1"
          >
            {isMinimized ? 'Expand' : '—'}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3 space-y-3">
          {/* Dual Feeds Split */}
          <div className="grid grid-cols-2 gap-2">
            {/* Primary Webcam Feed */}
            <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {primaryStream ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />
                </>
              ) : (
                <div className="text-[10px] text-slate-500 flex flex-col items-center">
                  <Video className="w-5 h-5 mb-1 text-slate-600" />
                  Primary WebCam
                </div>
              )}
              <div className="absolute top-1.5 left-1.5 bg-slate-900/80 text-blue-400 text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                <Video className="w-2.5 h-2.5" />
                <span>Primary</span>
              </div>
            </div>

            {/* Secondary Phone Feed */}
            <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {secondaryFrame ? (
                <img
                  src={secondaryFrame}
                  alt="Secondary Phone Feed"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-[10px] text-slate-500 flex flex-col items-center p-2 text-center">
                  <Smartphone className="w-5 h-5 mb-1 text-slate-600" />
                  Secondary Cam
                </div>
              )}
              <div className="absolute top-1.5 left-1.5 bg-slate-900/80 text-emerald-400 text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                <Smartphone className="w-2.5 h-2.5" />
                <span>Side Angle</span>
              </div>
            </div>
          </div>

          {/* Real-Time Telemetry Bar */}
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Eye className="w-3 h-3 text-blue-400" /> Gaze Alignment
              </span>
              <span className="text-emerald-400 font-medium">Focused (Screen Center)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Mic className="w-3 h-3 text-amber-400" /> Noise Level
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-100 ${
                      audioLevel > 65 ? 'bg-rose-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, audioLevel * 1.8)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-300">{audioLevel} dB</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Integrity Index
              </span>
              <span className="font-bold text-emerald-400">{integrityScore}%</span>
            </div>
          </div>

          {/* Test Violation Simulators for Quick Demo Testing */}
          {onManualTriggerViolation && (
            <div className="pt-1">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                Demo Test Controls:
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <button
                  onClick={() => onManualTriggerViolation('tab_switch', 'Simulated Tab Switch / Focus Loss Event')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-left truncate transition"
                  title="Trigger Tab Switch Strike"
                >
                  ⚡ Tab Switch
                </button>
                <button
                  onClick={() => {
                    setFaceStatus('multiple_detected');
                    onManualTriggerViolation('multiple_faces', 'Secondary unauthorized person detected in frame');
                    setTimeout(() => setFaceStatus('verified'), 4000);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-left truncate transition"
                  title="Trigger Multiple Faces Strike"
                >
                  ⚡ Multi-Face
                </button>
                <button
                  onClick={() => onManualTriggerViolation('prohibited_object', 'YOLO detected smartphone held near workspace')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-left truncate transition"
                  title="Trigger Phone Object Strike"
                >
                  ⚡ Phone Object
                </button>
                <button
                  onClick={() => onManualTriggerViolation('audio_anomaly', 'Sustained conversational speech detected')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-left truncate transition"
                  title="Trigger Audio Anomaly Strike"
                >
                  ⚡ Voice Anomaly
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
