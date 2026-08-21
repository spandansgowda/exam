import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, UserCheck, Shield } from 'lucide-react';

interface IDVerificationProps {
  onVerified: (photoDataUrl: string) => void;
  candidateName: string;
}

export const IDVerification: React.FC<IDVerificationProps> = ({ onVerified, candidateName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize webcam
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
          setFaceDetected(true);
        }
      } catch (err: any) {
        console.error('Camera error:', err);
        setError('Camera permission denied or camera not found. Please enable webcam access in browser.');
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(dataUrl);
      setAnalyzing(true);

      // Simulate ArcFace / InsightFace biometric extraction and liveness confirmation
      setTimeout(() => {
        setAnalyzing(false);
      }, 1200);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setAnalyzing(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto text-white">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Step 1: Candidate ID & Biometric Verification</h2>
          <p className="text-xs text-slate-400">
            Register your facial baseline. ArcFace will cross-match this against both laptop and secondary phone feeds during the exam.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Video / Photo Preview Box */}
      <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center mb-5">
        {!capturedPhoto ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            {/* Facial Oval Alignment Guide */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-48 h-64 border-2 border-dashed border-blue-400/80 rounded-[50%] flex items-center justify-center animate-pulse">
                <span className="text-[11px] font-medium text-blue-300 bg-slate-900/80 px-2 py-1 rounded">
                  Fit face inside oval
                </span>
              </div>
              <div className="absolute bottom-3 bg-slate-900/90 text-emerald-400 text-xs px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Face Tracking Online</span>
              </div>
            </div>
          </>
        ) : (
          <div className="relative w-full h-full">
            <img
              src={capturedPhoto}
              alt="Candidate Biometric Snapshot"
              className="w-full h-full object-cover"
            />
            {analyzing && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                <p className="text-xs font-semibold text-blue-200">
                  Extracting 512-D ArcFace Biometric Embeddings...
                </p>
              </div>
            )}
            {!analyzing && (
              <div className="absolute bottom-3 left-3 right-3 bg-emerald-950/90 border border-emerald-500/40 p-2.5 rounded-lg flex items-center justify-between text-xs text-emerald-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Biometric signature captured for <strong>{candidateName}</strong></span>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px]">
                  MATCH 99.4%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-400">
          Make sure your room has balanced lighting and no sunglasses/hats.
        </div>

        <div className="flex items-center space-x-3">
          {!capturedPhoto ? (
            <button
              id="capture-id-photo-btn"
              onClick={handleCapture}
              disabled={!streamActive}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Face Photo</span>
            </button>
          ) : (
            <>
              <button
                id="retake-id-photo-btn"
                onClick={handleRetake}
                disabled={analyzing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Retake
              </button>
              <button
                id="confirm-id-photo-btn"
                onClick={() => onVerified(capturedPhoto)}
                disabled={analyzing}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Proceed</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
