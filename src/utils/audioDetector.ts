// Client-side Web Audio API Sound Meter for detecting whispers/talking during proctored exam

export interface AudioDetectorHandle {
  stop: () => void;
  getAudioLevel: () => number; // 0 to 100
}

export async function initAudioMonitoring(
  onSpeechAnomaly: (dbLevel: number) => void,
  thresholdDb: number = 65
): Promise<AudioDetectorHandle | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let currentLevel = 0;
    let anomalyStreak = 0;
    let intervalId: any = null;

    intervalId = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      currentLevel = Math.min(100, Math.round((average / 128) * 100));

      if (currentLevel > thresholdDb) {
        anomalyStreak++;
        if (anomalyStreak >= 3) {
          // Sustained sound for ~1.5s
          onSpeechAnomaly(currentLevel);
          anomalyStreak = 0;
        }
      } else {
        anomalyStreak = Math.max(0, anomalyStreak - 1);
      }
    }, 500);

    return {
      stop: () => {
        clearInterval(intervalId);
        stream.getTracks().forEach((track) => track.stop());
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
      },
      getAudioLevel: () => currentLevel,
    };
  } catch (err) {
    console.warn('Audio monitoring unavailable or permission denied:', err);
    return null;
  }
}
