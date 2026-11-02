import { audioRig, type AudioRig } from "./rig";
import { envelope, noiseHit, toneHit } from "./voices";
import {
  TYPEWRITER_PROFILES,
  type NoiseLayer,
  type Resonance,
  type Stroke,
  type ToneLayer,
  type TypewriterProfile,
  type TypewriterProfileId,
} from "./profiles";

export type Keystroke = "key" | "space";

const PITCH_JITTER = 0.05;
const GAIN_JITTER = 0.2;
const PAN_SPREAD = 0.12;
const SATURATION_STEPS = 1024;

const buses = new Map<TypewriterProfileId, AudioNode>();

const jitter = (amount: number) => 1 + (Math.random() * 2 - 1) * amount;
const between = ([min, max]: [number, number]) => min + Math.random() * (max - min);

const saturationCurve = (drive: number) => {
  const curve = new Float32Array(SATURATION_STEPS);
  const norm = Math.tanh(drive);
  for (let i = 0; i < SATURATION_STEPS; i++) {
    const x = (i / (SATURATION_STEPS - 1)) * 2 - 1;
    curve[i] = Math.tanh(drive * x) / norm;
  }
  return curve;
};

const roomResponse = (context: AudioContext, seconds: number) => {
  const length = Math.round(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let smoothed = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      smoothed += (Math.random() * 2 - 1 - smoothed) * (0.55 - 0.4 * t);
      data[i] = smoothed * (1 - t) ** 3.2;
    }
    for (const tap of [0.007, 0.013, 0.019, 0.027]) {
      const index = Math.round((tap + channel * 0.0017) * context.sampleRate);
      if (index < length) data[index] += 0.5 * (1 - tap * 20);
    }
  }
  return buffer;
};

const createBus = ({ context, output }: AudioRig, profile: TypewriterProfile) => {
  const input = context.createGain();
  input.gain.value = profile.level;
  const tone = context.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = profile.tone;
  tone.Q.value = 0.5;
  const drive = context.createWaveShaper();
  drive.curve = saturationCurve(profile.drive);
  drive.oversample = "2x";
  const room = context.createConvolver();
  room.buffer = roomResponse(context, profile.room);
  const wet = context.createGain();
  wet.gain.value = profile.reverb;
  input.connect(tone).connect(drive);
  drive.connect(output);
  drive.connect(room).connect(wet).connect(output);
  return input;
};

const busFor = (rig: AudioRig, id: TypewriterProfileId) => {
  const existing = buses.get(id);
  if (existing) return existing;
  const bus = createBus(rig, TYPEWRITER_PROFILES[id]);
  buses.set(id, bus);
  return bus;
};

const ring = (context: AudioContext, target: AudioNode, at: number, partials: Resonance[], pitch: number, level: number) => {
  for (const partial of partials) {
    const oscillator = context.createOscillator();
    oscillator.frequency.value = partial.frequency * pitch * jitter(0.015);
    oscillator.connect(envelope(context, at, partial.gain * level, partial.decay)).connect(target);
    oscillator.start(at);
    oscillator.stop(at + partial.decay + 0.03);
  }
};

const strokeAt = (rig: AudioRig, id: TypewriterProfileId, at: number, kind: Keystroke) => {
  const profile = TYPEWRITER_PROFILES[id];
  const stroke: Stroke = profile[kind];
  const { context } = rig;
  const pan = context.createStereoPanner();
  pan.pan.value = (Math.random() * 2 - 1) * PAN_SPREAD;
  pan.connect(busFor(rig, id));
  const pitch = jitter(PITCH_JITTER);
  const level = jitter(GAIN_JITTER);

  noiseHit(rig, pan, at, stroke.press, pitch, level);
  const strike = at + between(profile.strikeDelay);
  if (stroke.clack) noiseHit(rig, pan, strike, stroke.clack, pitch, level);
  toneHit(context, pan, strike, stroke.thud, pitch, level);
  noiseHit(rig, pan, strike, stroke.body, pitch, level);
  ring(context, pan, strike, profile.partials, pitch, level * stroke.ring);
  noiseHit(rig, pan, strike + between(profile.escapement.delay), profile.escapement, jitter(0.03), jitter(0.25));
};

export const playKeystroke = (id: TypewriterProfileId, kind: Keystroke) => {
  const rig = audioRig();
  if (!rig) return;
  strokeAt(rig, id, rig.context.currentTime + 0.005, kind);
};

const PREVIEW_PHRASE = "Дело 404. Подозреваемый на свободе.";
const PREVIEW_INTERVAL: [number, number] = [0.07, 0.13];

export const previewTypewriter = (id: TypewriterProfileId) => {
  const rig = audioRig();
  if (!rig) return;
  let at = rig.context.currentTime + 0.05;
  for (const char of PREVIEW_PHRASE) {
    strokeAt(rig, id, at, char === " " ? "space" : "key");
    at += between(PREVIEW_INTERVAL) + (char === "." ? 0.18 : 0);
  }
};

const STAMP: { thud: ToneLayer; slap: NoiseLayer; paper: NoiseLayer } = {
  thud: { frequency: 75, drop: 0.5, gain: 1, decay: 0.28 },
  slap: { frequency: 600, q: 0.7, gain: 0.8, decay: 0.16 },
  paper: { frequency: 2600, q: 0.9, gain: 0.35, decay: 0.09 },
};

export const playStamp = (id: TypewriterProfileId) => {
  const rig = audioRig();
  if (!rig) return;
  const bus = busFor(rig, id);
  const at = rig.context.currentTime + 0.005;
  toneHit(rig.context, bus, at, STAMP.thud, 1, 1);
  noiseHit(rig, bus, at, STAMP.slap, 1, 1);
  noiseHit(rig, bus, at + 0.004, STAMP.paper, 1, 1);
};
