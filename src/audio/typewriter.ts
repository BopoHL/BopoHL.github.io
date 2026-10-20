type Kind = "key" | "space" | "bell" | "stamp";

let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;

const ensureContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!context) {
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
    noise = context.createBuffer(1, context.sampleRate * 0.25, context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (context.state === "suspended") void context.resume();
  return context;
};

const burst = (ctx: AudioContext, at: number, frequency: number, q: number, gain: number, decay: number) => {
  if (!noise) return;
  const source = ctx.createBufferSource();
  source.buffer = noise;
  source.playbackRate.value = 0.8 + Math.random() * 0.4;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(gain, at);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  source.connect(filter).connect(envelope).connect(ctx.destination);
  source.start(at, Math.random() * 0.1, decay + 0.02);
};

const thump = (ctx: AudioContext, at: number, frequency: number, gain: number, decay: number) => {
  const oscillator = ctx.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, at);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, at + decay);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(gain, at);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  oscillator.connect(envelope).connect(ctx.destination);
  oscillator.start(at);
  oscillator.stop(at + decay + 0.02);
};

const bell = (ctx: AudioContext, at: number) => {
  for (const [ratio, gain] of [
    [1, 0.12],
    [2.76, 0.05],
    [5.4, 0.02],
  ] as const) {
    const oscillator = ctx.createOscillator();
    oscillator.frequency.value = 2100 * ratio;
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(gain, at);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
    oscillator.connect(envelope).connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + 1);
  }
};

export const unlockAudio = () => {
  ensureContext();
};

export const playTypewriter = (kind: Kind) => {
  const ctx = ensureContext();
  if (!ctx) return;
  const at = ctx.currentTime + 0.005;
  switch (kind) {
    case "key":
      burst(ctx, at, 2600 + Math.random() * 1400, 1.4, 0.35, 0.035);
      thump(ctx, at, 140 + Math.random() * 40, 0.18, 0.04);
      return;
    case "space":
      burst(ctx, at, 900, 0.9, 0.18, 0.05);
      thump(ctx, at, 90, 0.15, 0.06);
      return;
    case "bell":
      bell(ctx, at);
      return;
    case "stamp":
      thump(ctx, at, 70, 0.6, 0.25);
      burst(ctx, at, 500, 0.7, 0.45, 0.18);
      return;
  }
};
