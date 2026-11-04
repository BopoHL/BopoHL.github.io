import { seededRandom, type Random } from "@/lib/random";
import { audioRig } from "./rig";

const LOOP_SECONDS = 9;
const SEAM_SECONDS = 0.08;
const DROPS_PER_SECOND = 26;
const DROP_HZ: [number, number] = [1600, 4800];
const DROP_DECAY: [number, number] = [0.0015, 0.005];
const DROP_LEVEL: [number, number] = [0.08, 0.45];
const PEAK = 0.9;
const LEVEL = 0.075;
const FADE_IN = 2.5;
const FADE_OUT = 0.6;
const GLASS_LOWPASS = 2600;
const ROOM_HIGHPASS = 180;
const GUST_HZ = 0.06;
const GUST_DEPTH = 0.3;

const between = (random: Random, [min, max]: readonly [number, number]) => min + random() * (max - min);

export const renderRain = (sampleRate: number, random: Random = seededRandom("rain"), seconds = LOOP_SECONDS) => {
  const length = Math.round(sampleRate * seconds);
  const seam = Math.round(sampleRate * SEAM_SECONDS);
  const raw = new Float32Array(length + seam);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < raw.length; i++) {
    const white = random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    raw[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2;
  }
  const drops = Math.round(seconds * DROPS_PER_SECOND);
  for (let d = 0; d < drops; d++) {
    const start = Math.floor(random() * length);
    const omega = (2 * Math.PI * between(random, DROP_HZ)) / sampleRate;
    const decay = between(random, DROP_DECAY) * sampleRate;
    const level = between(random, DROP_LEVEL);
    const span = Math.min(Math.round(decay * 6), raw.length - start);
    for (let k = 0; k < span; k++) raw[start + k] += level * Math.sin(omega * k) * Math.exp(-k / decay);
  }
  const loop = raw.subarray(0, length);
  for (let i = 0; i < seam; i++) {
    const mix = i / seam;
    loop[i] = loop[i] * mix + raw[length + i] * (1 - mix);
  }
  let peak = 0;
  for (const sample of loop) peak = Math.max(peak, Math.abs(sample));
  if (peak > 0) for (let i = 0; i < length; i++) loop[i] *= PEAK / peak;
  return loop;
};

interface RainVoice {
  context: AudioContext;
  sources: AudioScheduledSourceNode[];
  output: GainNode;
}

const buffers = new WeakMap<BaseAudioContext, AudioBuffer>();

const rainBuffer = (context: AudioContext) => {
  const cached = buffers.get(context);
  if (cached) return cached;
  const samples = renderRain(context.sampleRate);
  const buffer = context.createBuffer(1, samples.length, context.sampleRate);
  buffer.copyToChannel(samples, 0);
  buffers.set(context, buffer);
  return buffer;
};

export class RainAmbience {
  private voice: RainVoice | null = null;

  start() {
    if (this.voice) return;
    const rig = audioRig();
    if (!rig) return;
    const { context } = rig;
    const output = context.createGain();
    output.gain.value = 0;
    output.gain.setTargetAtTime(LEVEL, context.currentTime, FADE_IN / 3);
    output.connect(rig.output);

    const rain = context.createBufferSource();
    rain.buffer = rainBuffer(context);
    rain.loop = true;
    const highpass = context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = ROOM_HIGHPASS;
    const lowpass = context.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = GLASS_LOWPASS;
    const gust = context.createGain();
    rain.connect(highpass).connect(lowpass).connect(gust).connect(output);

    const wind = context.createOscillator();
    wind.frequency.value = GUST_HZ;
    const windDepth = context.createGain();
    windDepth.gain.value = GUST_DEPTH;
    wind.connect(windDepth).connect(gust.gain);

    const sources = [rain, wind];
    for (const source of sources) source.start();
    this.voice = { context, sources, output };
  }

  stop() {
    if (!this.voice) return;
    const { context, sources, output } = this.voice;
    const end = context.currentTime + FADE_OUT;
    output.gain.cancelScheduledValues(context.currentTime);
    output.gain.setTargetAtTime(0, context.currentTime, FADE_OUT / 3);
    for (const source of sources) source.stop(end);
    sources[0].onended = () => output.disconnect();
    this.voice = null;
  }
}
