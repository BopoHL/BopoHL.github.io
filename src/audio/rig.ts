export interface AudioRig {
  context: AudioContext;
  noise: AudioBuffer;
  output: AudioNode;
}

const NOISE_SECONDS = 0.5;

let shared: AudioRig | null = null;

const whiteNoise = (context: AudioContext) => {
  const buffer = context.createBuffer(1, Math.round(context.sampleRate * NOISE_SECONDS), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
};

const createRig = (): AudioRig | null => {
  const AudioContextClass =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  const context = new AudioContextClass();
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.knee.value = 6;
  limiter.ratio.value = 4;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.12;
  limiter.connect(context.destination);
  return { context, noise: whiteNoise(context), output: limiter };
};

export const audioRig = (): AudioRig | null => {
  if (typeof window === "undefined") return null;
  shared ??= createRig();
  if (shared?.context.state === "suspended") void shared.context.resume();
  return shared;
};

export const unlockAudio = () => {
  audioRig();
};
