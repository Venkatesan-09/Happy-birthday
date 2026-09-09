// Web Audio API Procedural Sound Engine
let audioCtx: AudioContext | null = null;
let ambientOscillators: { stop: () => void } | null = null;
let isMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const SoundEffects = {
  toggleMute: () => {
    isMuted = !isMuted;
    if (isMuted && ambientOscillators) {
      ambientOscillators.stop();
      ambientOscillators = null;
    }
    return isMuted;
  },

  getIsMuted: () => isMuted,

  playChime: () => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.65);
    });
  },

  playPop: () => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  },

  playSparkle: () => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const freqs = [880, 1174.66, 1318.51, 1567.98, 1760];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.05 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.05);
      osc.stop(ctx.currentTime + idx * 0.05 + 0.45);
    });
  },

  playCelebrationFanfare: () => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { f: 523.25, t: 0, d: 0.2 },
      { f: 659.25, t: 0.18, d: 0.2 },
      { f: 783.99, t: 0.36, d: 0.2 },
      { f: 1046.5, t: 0.54, d: 0.6 },
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.t);

      gain.gain.setValueAtTime(0.12, ctx.currentTime + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.t + n.d);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + n.t);
      osc.stop(ctx.currentTime + n.t + n.d);
    });
  },

  startAmbientTrack: () => {
    if (isMuted || ambientOscillators) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Soft warm pentatonic pad loop (C3, G3, E4, B4)
    const freqs = [130.81, 196.0, 329.63, 493.88];
    const nodes: OscillatorNode[] = [];
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.03, ctx.currentTime);
    masterGain.connect(ctx.destination);

    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.connect(masterGain);
      osc.start();
      nodes.push(osc);
    });

    ambientOscillators = {
      stop: () => {
        nodes.forEach((n) => {
          try {
            n.stop();
          } catch {}
        });
        ambientOscillators = null;
      },
    };
  },

  stopAmbientTrack: () => {
    if (ambientOscillators) {
      ambientOscillators.stop();
      ambientOscillators = null;
    }
  },
};
