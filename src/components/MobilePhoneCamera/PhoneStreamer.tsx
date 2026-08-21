import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Video, CheckCircle2, AlertCircle, RefreshCw, Shield, Wifi } from 'lucide-react';

interface PhoneStreamerProps {
  initialCode?: string;
  onExit?: () => void;
}

export const PhoneStreamer: React.FC<PhoneStreamerProps> = ({ initialCode = '', onExit }) => {
  const [pairingCode, setPairingCode] = useState(initialCode);
  const [isConnected, setIsConnected] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [fps, setFps] = useState(15);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleConnect = async (codeToUse = pairingCode) => {
    if (!codeToUse.trim()) return;
    setError(null);

    try {
      // 1. Verify code with backend
      const res = await fetch(`/api/pair/${codeToUse.trim()}/status`);
      const data = await res.json();
      if (!data.success) {
        setError('Invalid or expired pairing code. Please verify the code displayed on candidate screen.');
        return;
      }

      setCandidateName(data.pairing.candidateName || 'Candidate');
      setExamTitle(data.pairing.examTitle || 'Proctored Exam');

      // 2. Start Camera (rear camera if available on mobile)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsConnected(true);
    } catch (err: any) {
      console.error('Camera streaming error:', err);
      setError('Unable to access device camera. Please allow camera permissions in your browser.');
    }
  };

  // Auto connect if initialCode is provided in URL
  useEffect(() => {
    if (initialCode) {
      handleConnect(initialCode);
    }
  }, [initialCode]);

  // Frame streaming loop via canvas capture
  useEffect(() => {
    if (!isConnected || !pairingCode) return;

    const interval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

        fetch(`/api/pair/${pairingCode}/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'streaming',
            frame: dataUrl,
          }),
        }).catch((e) => console.warn('Frame sync error:', e));
      }
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [isConnected, pairingCode, fps]);

  return (
    <div className="max-w-md mx-auto my-6 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-white">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Secondary Mobile Streamer</h2>
          <p className="text-xs text-slate-400">Position phone to capture keyboard, hands, and workspace.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!isConnected ? (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Enter 6-Digit Pairing Code:
            </label>
            <input
              type="text"
              maxLength={6}
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value.trim())}
              placeholder="e.g. 849201"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-center text-2xl font-mono font-extrabold tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400 text-center">
              The 6-digit code shown on the candidate desktop screen.
            </p>
          </div>

          <button
            onClick={() => handleConnect()}
            disabled={pairingCode.length < 5}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-40"
          >
            <Video className="w-4 h-4" />
            <span>Connect & Stream Mobile Camera</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Streaming Badge */}
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Paired: <strong>{candidateName}</strong></span>
            </div>
            <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">
              STREAMING
            </span>
          </div>

          {/* Live Mobile Camera Preview */}
          <div className="relative aspect-[3/4] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute top-3 left-3 bg-slate-900/90 text-emerald-400 text-[10px] font-mono px-2 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>Relay: 30 FPS Low Latency</span>
            </div>
          </div>

          {/* Positioning Guide */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="font-semibold text-slate-200">Recommended Placement:</div>
            <p className="text-slate-400 leading-relaxed">
              Place phone on your side (approx. 45-degree angle) pointing towards your keyboard and screen so your hands remain in view.
            </p>
          </div>

          {onExit && (
            <button
              onClick={onExit}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Exit Mobile Streamer
            </button>
          )}
        </div>
      )}
    </div>
  );
};
