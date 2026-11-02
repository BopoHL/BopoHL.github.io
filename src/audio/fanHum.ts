import { audioRig, type AudioRig } from "./rig";

const IDLE_STOP_SECONDS = 1.2;
const NOISE_SECONDS = 3;
const WHOOSH_LEVEL = 0.09;
const WHOOSH_BAND: [number, number] = [380, 1150];
const CHOP_DEPTH = 0.3;
const MAX_BLADE_PASS_HZ = 14;
const HUM_LEVEL = 0.022;
const MOTOR_HZ = 100;
const GLIDE = 0.08;
const CHANGE_EPSILON = 0.002;

interface HumVoice {
  context: AudioContext;
  whoosh: GainNode;
  band: BiquadFilterNode;
  chop: OscillatorNode;
  chopDepth: GainNode;
  hum: GainNode;
  sources: AudioScheduledSourceNode[];
  output: GainNode;
}

const brownNoise = (context: AudioContext) => {
  const buffer = context.createBuffer(1, Math.round(context.sampleRate * NOISE_SECONDS), context.sampleRate);
  const data = buffer.getChannelData(0);
  let level = 0;
  for (let i = 0; i < data.length; i++) {
    level = (level + 0.04 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = level * 3.5;
  }
  return buffer;
};

const createVoice = ({ context, output: destination }: AudioRig): HumVoice => {
  const output = context.createGain();
  output.connect(destination);

  const noise = context.createBufferSource();
  noise.buffer = brownNoise(context);
  noise.loop = true;
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.7;
  const whoosh = context.createGain();
  whoosh.gain.value = 0;
  noise.connect(band).connect(whoosh).connect(output);

  const chop = context.createOscillator();
  const chopDepth = context.createGain();
  chopDepth.gain.value = 0;
  chop.connect(chopDepth).connect(whoosh.gain);

  const motor = context.createOscillator();
  motor.type = "sawtooth";
  motor.frequency.value = MOTOR_HZ;
  const motorTone = context.createBiquadFilter();
  motorTone.type = "lowpass";
  motorTone.frequency.value = 320;
  const hum = context.createGain();
  hum.gain.value = 0;
  motor.connect(motorTone).connect(hum).connect(output);

  const sources = [noise, chop, motor];
  for (const source of sources) source.start();
  return { context, whoosh, band, chop, chopDepth, hum, sources, output };
};

export class FanHum {
  private voice: HumVoice | null = null;
  private idle = 0;
  private applied = { spin: Number.NaN, running: false };

  update(spin: number, running: boolean, delta: number) {
    if (!running && spin < 0.005) {
      if (!this.voice) return;
      this.idle += delta;
      if (this.idle > IDLE_STOP_SECONDS) this.stop();
      else this.apply(this.voice, 0, false);
      return;
    }
    this.idle = 0;
    if (!this.voice) {
      const rig = audioRig();
      if (!rig) return;
      this.voice = createVoice(rig);
    }
    this.apply(this.voice, spin, running);
  }

  stop() {
    if (!this.voice) return;
    for (const source of this.voice.sources) source.stop();
    this.voice.output.disconnect();
    this.voice = null;
    this.idle = 0;
    this.applied = { spin: Number.NaN, running: false };
  }

  private apply({ context, whoosh, band, chop, chopDepth, hum }: HumVoice, spin: number, running: boolean) {
    if (Math.abs(spin - this.applied.spin) < CHANGE_EPSILON && running === this.applied.running) return;
    this.applied = { spin, running };
    const now = context.currentTime;
    const level = WHOOSH_LEVEL * spin * spin;
    whoosh.gain.setTargetAtTime(level, now, GLIDE);
    chopDepth.gain.setTargetAtTime(level * CHOP_DEPTH, now, GLIDE);
    chop.frequency.setTargetAtTime(Math.max(0.1, MAX_BLADE_PASS_HZ * spin), now, GLIDE);
    band.frequency.setTargetAtTime(WHOOSH_BAND[0] + (WHOOSH_BAND[1] - WHOOSH_BAND[0]) * spin, now, GLIDE);
    hum.gain.setTargetAtTime(running ? HUM_LEVEL : 0, now, GLIDE);
  }
}
