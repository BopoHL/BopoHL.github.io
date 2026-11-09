import { seededRandom, type Random } from "@/lib/random";
import { audioRig } from "./rig";

const LOOP_SECONDS = 9;
const SEAM_SECONDS = 0.08;
const DROPS_PER_SECOND = 26;
const DROP_HZ: [number, number] = [1600, 4800];
const DROP_DECAY: [number, number] = [0.0015, 0.005];
const DROP_LEVEL: [number, number] = [0.08, 0.45];
const PEAK = 0.9;
const LEVEL = 0.09;
const FADE_IN = 2.5;
const FADE_OUT = 0.6;
const GLASS_LOWPASS = 2600;
const ROOM_HIGHPASS = 180;
const GUST_HZ = 0.06;
const GUST_DEPTH = 0.3;
const GLASS = {
  perSecond: 3.5,
  variants: 12,
  level: 0.16,
  gain: [0.35, 1],
  pitch: [0.85, 1.2],
  pan: 0.6,
  click: 0.0008,
  ring: [2200, 4200],
  ringDecay: [0.004, 0.011],
  overtone: 2.37,
  body: [480, 900],
  bodyDecay: [0.008, 0.016],
  lookahead: 0.25,
  tickMs: 100,
} as const;

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

export const renderGlassDrop = (sampleRate: number, random: Random) => {
  const ring = (2 * Math.PI * between(random, GLASS.ring)) / sampleRate;
  const ringDecay = between(random, GLASS.ringDecay) * sampleRate;
  const body = (2 * Math.PI * between(random, GLASS.body)) / sampleRate;
  const bodyDecay = between(random, GLASS.bodyDecay) * sampleRate;
  const click = Math.max(1, Math.round(GLASS.click * sampleRate));
  const drop = new Float32Array(Math.ceil(Math.max(ringDecay, bodyDecay) * 7));
  let peak = 0;
  for (let i = 0; i < drop.length; i++) {
    const tap = i < click ? (random() * 2 - 1) * (1 - i / click) : 0;
    const glass = Math.sin(ring * i) * Math.exp(-i / ringDecay) * 0.7;
    const overtone = Math.sin(ring * GLASS.overtone * i) * Math.exp((-2 * i) / ringDecay) * 0.25;
    const thud = Math.sin(body * i) * Math.exp(-i / bodyDecay) * 0.5;
    drop[i] = tap * 0.6 + glass + overtone + thud;
    peak = Math.max(peak, Math.abs(drop[i]));
  }
  for (let i = 0; i < drop.length; i++) drop[i] /= peak;
  return drop;
};

const glassDrops = new WeakMap<BaseAudioContext, AudioBuffer[]>();

const glassDropBuffers = (context: AudioContext) => {
  const cached = glassDrops.get(context);
  if (cached) return cached;
  const random = seededRandom("drops on the glass");
  const buffers = Array.from({ length: GLASS.variants }, () => {
    const samples = renderGlassDrop(context.sampleRate, random);
    const buffer = context.createBuffer(1, samples.length, context.sampleRate);
    buffer.copyToChannel(samples, 0);
    return buffer;
  });
  glassDrops.set(context, buffers);
  return buffers;
};

const nextDropIn = () => -Math.log(1 - Math.random()) / GLASS.perSecond;

const strikeGlass = (context: AudioContext, target: AudioNode, buffers: AudioBuffer[], at: number) => {
  const source = context.createBufferSource();
  source.buffer = buffers[Math.floor(Math.random() * buffers.length)];
  source.playbackRate.value = between(Math.random, GLASS.pitch);
  const gain = context.createGain();
  gain.gain.value = between(Math.random, GLASS.gain);
  const pan = context.createStereoPanner();
  pan.pan.value = (Math.random() * 2 - 1) * GLASS.pan;
  source.connect(gain).connect(pan).connect(target);
  source.start(at);
};

interface RainVoice {
  context: AudioContext;
  sources: AudioScheduledSourceNode[];
  output: GainNode;
  timer: number;
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
    output.gain.setTargetAtTime(1, context.currentTime, FADE_IN / 3);
    output.connect(rig.output);
    const wash = context.createGain();
    wash.gain.value = LEVEL;
    wash.connect(output);

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
    rain.connect(highpass).connect(lowpass).connect(gust).connect(wash);

    const wind = context.createOscillator();
    wind.frequency.value = GUST_HZ;
    const windDepth = context.createGain();
    windDepth.gain.value = GUST_DEPTH;
    wind.connect(windDepth).connect(gust.gain);

    const glass = context.createGain();
    glass.gain.value = GLASS.level;
    glass.connect(output);
    const drops = glassDropBuffers(context);
    let next = context.currentTime + nextDropIn();
    const timer = window.setInterval(() => {
      const horizon = context.currentTime + GLASS.lookahead;
      next = Math.max(next, context.currentTime);
      for (; next < horizon; next += nextDropIn()) strikeGlass(context, glass, drops, next);
    }, GLASS.tickMs);

    const sources = [rain, wind];
    for (const source of sources) source.start();
    this.voice = { context, sources, output, timer };
  }

  stop() {
    if (!this.voice) return;
    const { context, sources, output, timer } = this.voice;
    window.clearInterval(timer);
    const end = context.currentTime + FADE_OUT;
    output.gain.cancelScheduledValues(context.currentTime);
    output.gain.setTargetAtTime(0, context.currentTime, FADE_OUT / 3);
    for (const source of sources) source.stop(end);
    sources[0].onended = () => output.disconnect();
    this.voice = null;
  }
}
