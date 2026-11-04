/**
 * Web Audio API synthesized conversational sound cues (zero external audio file dependency)
 */

export const playConversationChime = (type: 'listen_start' | 'commit' | 'barge_in'): void => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'listen_start') {
      // Pleasant upward 440Hz -> 784Hz chime (Mic active / your turn)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(784, now + 0.1);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'commit') {
      // Soft downward 660Hz -> 440Hz chime (Speech committed / AI processing)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'barge_in') {
      // Quick 350Hz chime (Interrupted)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch {
    // Silently skip if audio context cannot be initialized
  }
};
