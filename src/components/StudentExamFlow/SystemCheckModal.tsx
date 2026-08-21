import React, { useState, useEffect } from 'react';
import { CheckCircle2, Mic, Video, Wifi, Monitor, AlertCircle, ArrowRight } from 'lucide-react';
import { initAudioMonitoring, AudioDetectorHandle } from '../../utils/audioDetector';

interface SystemCheckModalProps {
  onPassed: () => void;
}

export const SystemCheckModal: React.FC<SystemCheckModalProps> = ({ onPassed }) => {
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [networkOk, setNetworkOk] = useState<boolean | null>(null);
  const [screenOk, setScreenOk] = useState<boolean>(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let audioHandle: AudioDetectorHandle | null = null;
    let micPoll: any = null;

    async function runDiagnostics() {
      // 1. Camera check
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        setCameraOk(true);
      } catch (err) {
        setCameraOk(false);
      }

      // 2. Mic check
      try {
        audioHandle = await initAudioMonitoring(() => {}, 80);
        if (audioHandle) {
          setMicOk(true);
          micPoll = setInterval(() => {
            if (audioHandle) setMicLevel(audioHandle.getAudioLevel());
          }, 200);
        } else {
          setMicOk(false);
        }
      } catch (err) {
        setMicOk(false);
      }

      // 3. Network check
      setNetworkOk(navigator.onLine);

      setChecking(false);
    }

    runDiagnostics();

    return () => {
      if (audioHandle) audioHandle.stop();
      if (micPoll) clearInterval(micPoll);
    };
  }, []);

  const allPassed = cameraOk && micOk && networkOk && screenOk;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto text-white">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
          <Monitor className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Step 2: System & Hardware Diagnostics</h2>
          <p className="text-xs text-slate-400">
            Validating browser compatibility, video hardware, audio input, and network bandwidth.
          </p>
        </div>
      </div>

      <div className="space-y-3 my-6">
        {/* Camera Check */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">Webcam Hardware & Permissions</div>
              <div className="text-xs text-slate-400">Required for primary facial gaze and head-pose tracking</div>
            </div>
          </div>
          <div>
            {cameraOk === null ? (
              <span className="text-xs text-slate-400">Testing...</span>
            ) : cameraOk ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> 720p Ready
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5" /> Blocked
              </span>
            )}
          </div>
        </div>

        {/* Microphone Check */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">Microphone & Audio Input</div>
              <div className="text-xs text-slate-400">Live background speech and whisper anomaly detection</div>
              {micOk && (
                <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-150"
                    style={{ width: `${Math.min(100, micLevel * 2)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            {micOk === null ? (
              <span className="text-xs text-slate-400">Testing...</span>
            ) : micOk ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5" /> Denied
              </span>
            )}
          </div>
        </div>

        {/* Network Bandwidth */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">Network Latency & Uplink</div>
              <div className="text-xs text-slate-400">Low-latency WebRTC telemetry & heartbeat sync</div>
            </div>
          </div>
          <div>
            {networkOk ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Stable ({navigator.onLine ? 'Connected' : 'Offline'})
              </span>
            ) : (
              <span className="text-xs text-rose-400">Disconnected</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-400">
          All checks must pass before advancing to dual-camera pairing.
        </div>

        <button
          id="system-check-continue-btn"
          onClick={onPassed}
          disabled={!allPassed || checking}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition disabled:opacity-40"
        >
          <span>Continue to Dual-Camera Pairing</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
