import type { NoiseLayer, ToneLayer } from "./profiles";
import type { AudioRig } from "./rig";

const ATTACK = 0.0008;

export const envelope = (context: AudioContext, at: number, gain: number, decay: number) => {
  const node = context.createGain();
  node.gain.setValueAtTime(0, at);
  node.gain.linearRampToValueAtTime(gain, at + ATTACK);
  node.gain.exponentialRampToValueAtTime(0.0001, at + ATTACK + decay);
  return node;
};

export const noiseHit = (rig: AudioRig, target: AudioNode, at: number, layer: NoiseLayer, pitch: number, level: number) => {
  const { context } = rig;
  const source = context.createBufferSource();
  source.buffer = rig.noise;
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = layer.frequency * pitch;
  filter.Q.value = layer.q;
  source.connect(filter).connect(envelope(context, at, layer.gain * level, layer.decay)).connect(target);
  const offset = Math.random() * (rig.noise.duration - layer.decay - 0.05);
  source.start(at, Math.max(0, offset), layer.decay + 0.03);
};

export const toneHit = (context: AudioContext, target: AudioNode, at: number, layer: ToneLayer, pitch: number, level: number) => {
  const oscillator = context.createOscillator();
  const start = layer.frequency * pitch;
  oscillator.frequency.setValueAtTime(start, at);
  oscillator.frequency.exponentialRampToValueAtTime(start * layer.drop, at + layer.decay);
  oscillator.connect(envelope(context, at, layer.gain * level, layer.decay)).connect(target);
  oscillator.start(at);
  oscillator.stop(at + layer.decay + 0.03);
};
