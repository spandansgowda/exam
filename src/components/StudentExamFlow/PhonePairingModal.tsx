import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle2, QrCode, RefreshCw, ArrowRight, ExternalLink, ShieldCheck, Play } from 'lucide-react';

interface PhonePairingModalProps {
  onPaired: (pairingCode: string) => void;
  candidateName: string;
  examTitle: string;
}

export const PhonePairingModal: React.FC<PhonePairingModalProps> = ({
  onPaired,
  candidateName,
  examTitle,
}) => {
  const [pairingCode, setPairingCode] = useState<string>('849201');
  const [pairingStatus, setPairingStatus] = useState<'waiting' | 'streaming'>('waiting');
  const [latestFrame, setLatestFrame] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  // Generate pairing code on mount
  useEffect(() => {
    async function initPairing() {
      try {
        const res = await fetch('/api/pair/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateName, examTitle }),
        });
        const data = await res.json();
        if (data.code) {
          setPairingCode(data.code);
        }
      } catch (err) {
        console.error('Pair generation error:', err);
      }
    }
    initPairing();
  }, [candidateName, examTitle]);

  // Poll for phone connection
  useEffect(() => {
    if (!pairingCode) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pair/${pairingCode}/frame`);
        const data = await res.json();
        if (data.success && data.latestFrame) {
          setPairingStatus('streaming');
          setLatestFrame(data.latestFrame);
        }
      } catch (e) {
        // ignore
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [pairingCode]);

  const handleSimulateConnection = () => {
    setIsSimulated(true);
    setPairingStatus('streaming');
    // Set a realistic side-angle workspace frame
    setLatestFrame('https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80');
    // Report stream to backend
    fetch(`/api/pair/${pairingCode}/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'streaming',
        frame: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      }),
    });
  };

  const phoneUrl = `${window.location.origin}/?role=phone&code=${pairingCode}`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto text-white">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Step 3: Secondary Phone Camera Pairing</h2>
          <p className="text-xs text-slate-400">
            Dual-camera setup monitors your workspace, keyboard, and surrounding area to prevent unauthorized physical aids.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        {/* Pairing Instructions & Code */}
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Pairing Code:
            </div>
            <div className="flex items-center justify-center bg-slate-900 py-3 rounded-lg border border-blue-500/40">
              <span className="font-mono text-3xl font-extrabold tracking-widest text-blue-400">
                {pairingCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Scan the QR code with your phone camera or open the pairing URL in mobile Safari/Chrome.
            </p>
          </div>

          <div className="space-y-2">
            <a
              href={phoneUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Phone Streamer in New Tab</span>
            </a>

            <button
              id="simulate-secondary-cam-btn"
              onClick={handleSimulateConnection}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-medium border border-indigo-500/30 transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Auto-Pair Virtual Secondary Camera</span>
            </button>
          </div>
        </div>

        {/* QR Code / Live Stream Preview */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col items-center justify-center relative min-h-[220px]">
          {pairingStatus === 'streaming' ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-emerald-500/50">
                <img
                  src={latestFrame || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'}
                  alt="Secondary Camera Live Stream"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-emerald-950/80 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE STREAMING
                </div>
              </div>
              <div className="mt-3 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Secondary Feed Active (30 FPS)</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-3">
              {/* Stylized QR Code Visual */}
              <div className="w-32 h-32 bg-white p-2 rounded-xl flex items-center justify-center shadow-md">
                <QrCode className="w-28 h-28 text-slate-900" />
              </div>
              <div className="flex items-center space-x-2 text-xs text-amber-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Waiting for phone connection...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <span>Phone feed is processed in memory for workspace & object verification and securely logged in the audit trail.</span>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => onPaired(pairingCode)}
          className="text-xs text-slate-400 hover:text-slate-200 underline"
        >
          Skip secondary camera (Single Webcam Mode)
        </button>

        <button
          id="phone-pair-start-exam-btn"
          onClick={() => onPaired(pairingCode)}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition"
        >
          <span>Start Proctored Exam</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
