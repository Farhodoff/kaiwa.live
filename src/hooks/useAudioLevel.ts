import { useState, useEffect, useRef } from 'react';

/**
 * Hook to compute normalized real-time audio level (0.0 to 1.0)
 * from an optional MediaStream or AudioContext/AnalyserNode,
 * or smooth an externally provided volume value.
 */
export function useAudioLevel(externalVolume?: number, mediaStream?: MediaStream | null) {
  const [level, setLevel] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mediaStream) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(1, Math.max(0, avg / 128));
        setLevel(normalized);

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('[useAudioLevel] AudioContext init notice:', err);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [mediaStream]);

  // If externalVolume is passed without a stream, apply smoothing and clamp
  useEffect(() => {
    if (mediaStream) return;
    if (typeof externalVolume === 'number') {
      const clamped = Math.max(
        0,
        Math.min(1, externalVolume > 1 ? externalVolume / 60 : externalVolume),
      );
      setLevel(clamped);
    }
  }, [externalVolume, mediaStream]);

  return level;
}

export default useAudioLevel;
