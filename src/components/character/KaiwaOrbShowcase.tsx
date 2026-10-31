import React, { useState, useEffect, useRef } from 'react';
import { KaiwaOrbCharacter, OrbState } from './KaiwaOrbCharacter';
import { Mic, Volume2, Sparkles, Play, Pause } from 'lucide-react';

export const KaiwaOrbShowcase: React.FC = () => {
  const [activeState, setActiveState] = useState<OrbState>('idle');
  const [volume, setVolume] = useState<number>(0.4);
  const [isSimulatingAudio, setIsSimulatingAudio] = useState<boolean>(true);
  const [isRealMicActive, setIsRealMicActive] = useState<boolean>(false);
  const [size, setSize] = useState<number>(260);

  // Audio Context refs for real microphone testing
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnimRef = useRef<number | null>(null);

  // Auto-pulse simulation for natural speaking rhythm
  useEffect(() => {
    if (!isSimulatingAudio || isRealMicActive) return;
    if (activeState === 'idle') return;

    let time = 0;
    let interval: NodeJS.Timeout;

    if (activeState === 'speaking') {
      interval = setInterval(() => {
        time += 0.15;
        // Natural speech rhythm simulation with pauses
        const rawWave = Math.sin(time * 3.2) * 0.4 + Math.sin(time * 7.1) * 0.25;
        const speechEnvelope = Math.max(0, Math.sin(time * 0.9)); // speaking phrasing with pauses
        const computed =
          speechEnvelope > 0.25 ? Math.max(0.05, Math.min(1, Math.abs(rawWave) * 1.35)) : 0.02;
        setVolume(Number(computed.toFixed(2)));
      }, 50);
    } else if (activeState === 'listening') {
      interval = setInterval(() => {
        time += 0.1;
        const ambient = 0.08 + Math.abs(Math.sin(time * 1.5)) * 0.25;
        setVolume(Number(ambient.toFixed(2)));
      }, 70);
    }

    return () => clearInterval(interval);
  }, [isSimulatingAudio, isRealMicActive, activeState]);

  // Real Microphone Toggle
  const toggleRealMic = async () => {
    if (isRealMicActive) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (micAnimRef.current) cancelAnimationFrame(micAnimRef.current);
      setIsRealMicActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        // Normalize 0..128 -> 0..1
        const normalized = Math.min(1, Math.max(0, (avg - 8) / 70));
        setVolume(Number(normalized.toFixed(2)));
        micAnimRef.current = requestAnimationFrame(checkVolume);
      };

      micAnimRef.current = requestAnimationFrame(checkVolume);
      setIsRealMicActive(true);
      setIsSimulatingAudio(false);
      setActiveState('listening');
    } catch (err) {
      console.error('Mikrofon xatosi:', err);
      alert('Mikrofon ruxsati olinmadi. Iltimos brauzer sozlamalarini tekshiring.');
    }
  };

  useEffect(() => {
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (micAnimRef.current) cancelAnimationFrame(micAnimRef.current);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen w-full select-none flex-col items-center justify-between overflow-x-hidden bg-[#0a0b1f] p-4 text-slate-100 sm:p-8">
      {/* Background Starry / Ambient Radial Tint */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(110, 80, 220, 0.15) 0%, rgba(10, 11, 31, 0) 70%)',
        }}
      />

      {/* Header Info */}
      <header className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-2 pt-2 text-center sm:pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-semibold text-rose-300">
          <Sparkles size={13} className="text-rose-400" />
          <span>Kaiwa AI Sharcha Personaj</span>
        </div>
        <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
          Yumshoq Gradient Sharcha & Jonli Ko&apos;zlar
        </h1>
        <p className="max-w-lg text-xs leading-relaxed text-slate-400 sm:text-sm">
          Fon: to&apos;q navy (<code className="text-rose-300">#0a0b1f</code>). Yuz va
          oyoq-qo&apos;llarsiz, faqat ikkita qora kapsula ko&apos;z va oq yaltiroq nuqta.
        </p>
      </header>

      {/* Character Stage */}
      <main className="relative z-10 my-auto flex flex-1 flex-col items-center justify-center py-6 sm:py-10">
        <KaiwaOrbCharacter
          state={activeState}
          audioVolume={activeState === 'idle' ? 0 : volume}
          size={size}
          interactive={true}
          onStateChange={(next) => setActiveState(next)}
        />

        {/* Quick state caption below orb */}
        <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
          <span
            className={`h-2 w-2 rounded-full ${
              activeState === 'idle'
                ? 'bg-[#e2523f]'
                : activeState === 'listening'
                  ? 'animate-pulse bg-[#ff4d8d]'
                  : 'animate-ping bg-[#5b4bdb]'
            }`}
          />
          <span className="capitalize">{activeState} rejimida</span>
          <span className="text-slate-500">•</span>
          <span className="text-[11px] text-slate-400">
            {activeState === 'idle' && 'Sekin nafas, 2px float, 2-5s pirpirash'}
            {activeState === 'listening' && '+8% hajm, ko‘zlar yuqoriga, yorqin rang'}
            {activeState === 'speaking' && '+10% Y, -5% X cho‘zilish, 10px sakrash'}
          </span>
        </div>
      </main>

      {/* Control Panel */}
      <footer className="relative z-10 flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-md sm:p-5">
        {/* State Toggle Buttons */}
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Holatni tanlang:
          </span>
          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveState('idle')}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                activeState === 'idle'
                  ? 'bg-gradient-to-r from-[#e2523f] to-[#e8486a] text-white shadow-lg shadow-[#e2523f]/30'
                  : 'border border-white/5 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Sparkles size={14} />
              <span>Idle</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveState('listening')}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                activeState === 'listening'
                  ? 'bg-gradient-to-r from-[#ff5a4d] to-[#ff4d8d] text-white shadow-lg shadow-[#ff4d8d]/30'
                  : 'border border-white/5 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Mic size={14} />
              <span>Listening</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveState('speaking')}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                activeState === 'speaking'
                  ? 'bg-gradient-to-r from-[#f04678] to-[#5b4bdb] text-white shadow-lg shadow-[#5b4bdb]/30'
                  : 'border border-white/5 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Volume2 size={14} />
              <span>Speaking</span>
            </button>
          </div>
        </div>

        {/* Audio Simulation Controls */}
        <div className="flex flex-col gap-2 border-t border-white/5 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Ovoz kuchi (audioVolume):</span>
              <span className="font-mono font-bold text-rose-300">{volume.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleRealMic}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                  isRealMicActive
                    ? 'animate-pulse border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
                title="Mikrofoningiz ovozi orqali test qilish"
              >
                <Mic size={12} />
                <span>{isRealMicActive ? 'Mikrofon Faol' : 'Jonli Mikrofon'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSimulatingAudio((v) => !v)}
                disabled={isRealMicActive}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
              >
                {isSimulatingAudio ? <Pause size={12} /> : <Play size={12} />}
                <span>{isSimulatingAudio ? 'Auto Ritm' : "Qo'lda"}</span>
              </button>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            disabled={isRealMicActive}
            onChange={(e) => {
              setIsSimulatingAudio(false);
              setVolume(parseFloat(e.target.value));
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-[#ff4d8d]"
          />
        </div>

        {/* Orb Size Selector */}
        <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-2 text-xs text-slate-400">
          <span>O&apos;lcham (Size):</span>
          <div className="flex items-center gap-1.5">
            {[200, 260, 320].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`rounded-lg px-2.5 py-1 font-mono text-xs transition ${
                  size === s
                    ? 'bg-white/20 font-bold text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {s}px
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default KaiwaOrbShowcase;
