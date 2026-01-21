
let audioCtx: AudioContext | null = null;

/**
 * Lazy initialization of AudioContext to comply with browser autoplay policies
 * and reuse the same context.
 */
export const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  return audioCtx;
};

/**
 * Plays a simple beep tone.
 */
export const playBeepTone = (freq: number, dur: number, gainVal: number = 0.08): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch (e) {
    console.warn("Audio playback failed:", e);
  }
};
