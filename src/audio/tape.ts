import { loadRecording } from "./recordings";
import { audioRig, type AudioRig } from "./rig";

export interface TapeRecording {
  src: string;
  seconds: number;
}

export type TapeKey = "record" | "rewind" | "play" | "forward" | "stop" | "pause";
type Transport = "stopped" | "playing" | "rewinding" | "forwarding";

export const TAPE_KEYS: TapeKey[] = ["record", "rewind", "play", "forward", "stop", "pause"];

const WIND_SPEED = 12;
const END_MARGIN = 0.05;
const LEVEL = 0.55;
const HISS_LEVEL = 0.012;
const START_SLUR = 0.12;
const STOP_SLUR = 0.09;
const WOW = { rate: 0.55, depth: 0.004 };
const FLUTTER = { rate: 6.5, depth: 0.0015 };
const WHIRR = { level: 0.05, low: 700, high: 1700, fade: 0.12 };
const SATURATION_STEPS = 512;

const softClip = (drive: number) => {
  const curve = new Float32Array(SATURATION_STEPS);
  const norm = Math.tanh(drive);
  for (let i = 0; i < SATURATION_STEPS; i++) {
    const x = (i / (SATURATION_STEPS - 1)) * 2 - 1;
    curve[i] = Math.tanh(drive * x) / norm;
  }
  return curve;
};

interface Voice {
  context: AudioContext;
  output: GainNode;
  sources: AudioScheduledSourceNode[];
}

interface Playback extends Voice {
  rate: AudioParam;
  offset: number;
  startedAt: number;
}

interface Whirr extends Voice {
  band: BiquadFilterNode;
}

const looped = (rig: AudioRig, target: AudioNode) => {
  const noise = rig.context.createBufferSource();
  noise.buffer = rig.noise;
  noise.loop = true;
  noise.connect(target);
  return noise;
};

const startPlayback = (rig: AudioRig, buffer: AudioBuffer, offset: number): Playback => {
  const { context } = rig;
  const now = context.currentTime;
  const output = context.createGain();
  output.gain.setValueAtTime(0, now);
  output.gain.linearRampToValueAtTime(1, now + 0.03);
  output.connect(rig.output);

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.setValueAtTime(0.7, now);
  source.playbackRate.linearRampToValueAtTime(1, now + START_SLUR);
  const highpass = context.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 90;
  const lowpass = context.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 6000;
  const saturation = context.createWaveShaper();
  saturation.curve = softClip(1.6);
  const level = context.createGain();
  level.gain.value = LEVEL;
  source.connect(highpass).connect(lowpass).connect(saturation).connect(level).connect(output);

  const modulators = [WOW, FLUTTER].map(({ rate, depth }) => {
    const oscillator = context.createOscillator();
    oscillator.frequency.value = rate;
    const amount = context.createGain();
    amount.gain.value = depth;
    oscillator.connect(amount).connect(source.playbackRate);
    return oscillator;
  });

  const hissFilter = context.createBiquadFilter();
  hissFilter.type = "highpass";
  hissFilter.frequency.value = 3500;
  const hiss = context.createGain();
  hiss.gain.value = HISS_LEVEL;
  hissFilter.connect(hiss).connect(output);

  const sources = [looped(rig, hissFilter), ...modulators];
  for (const node of sources) node.start(now);
  source.start(now, offset);
  return { context, output, sources: [source, ...sources], rate: source.playbackRate, offset, startedAt: now };
};

const startWhirr = (rig: AudioRig): Whirr => {
  const { context } = rig;
  const now = context.currentTime;
  const output = context.createGain();
  output.gain.setValueAtTime(0, now);
  output.gain.linearRampToValueAtTime(WHIRR.level, now + 0.25);
  output.connect(rig.output);
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 2.5;
  band.connect(output);
  const noise = looped(rig, band);
  noise.start(now);
  return { context, output, sources: [noise], band };
};

const release = ({ context, output, sources }: Voice, fade: number) => {
  const now = context.currentTime;
  output.gain.cancelScheduledValues(now);
  output.gain.setValueAtTime(output.gain.value, now);
  output.gain.linearRampToValueAtTime(0, now + fade);
  for (const source of sources) source.stop(now + fade + 0.02);
  setTimeout(() => output.disconnect(), (fade + 0.1) * 1000);
};

const stopPlayback = (playback: Playback) => {
  const now = playback.context.currentTime;
  playback.rate.cancelScheduledValues(now);
  playback.rate.setValueAtTime(playback.rate.value, now);
  playback.rate.linearRampToValueAtTime(0.5, now + STOP_SLUR);
  release(playback, STOP_SLUR);
};

export class TapeDeck {
  position = 0;
  private transport: Transport = "stopped";
  private paused = false;
  private buffer: AudioBuffer | null = null;
  private unavailable = false;
  private playback: Playback | null = null;
  private whirr: Whirr | null = null;

  constructor(private readonly recording: TapeRecording) {}

  get duration() {
    return this.buffer?.duration ?? this.recording.seconds;
  }

  prepare() {
    if (this.buffer || this.unavailable) return;
    void loadRecording(this.recording.src).then((buffer) => {
      this.buffer = buffer;
      this.unavailable = buffer === null;
    });
  }

  isLatched(key: TapeKey) {
    if (key === "pause") return this.paused;
    if (key === "play") return this.transport === "playing";
    if (key === "rewind") return this.transport === "rewinding";
    if (key === "forward") return this.transport === "forwarding";
    return false;
  }

  get speed() {
    if (this.transport === "rewinding") return -WIND_SPEED;
    if (this.transport === "forwarding") return WIND_SPEED;
    return this.rolling ? 1 : 0;
  }

  get engaged() {
    return this.transport !== "stopped" || this.paused;
  }

  get playing() {
    return this.transport === "playing" && !this.paused;
  }

  get progress() {
    return this.position / this.duration;
  }

  press(key: TapeKey): boolean {
    const atStart = this.position <= 0;
    const atEnd = this.position >= this.duration - END_MARGIN;
    switch (key) {
      case "play":
        this.prepare();
        this.transport = "playing";
        return true;
      case "rewind":
        if (atStart) return false;
        this.transport = "rewinding";
        return true;
      case "forward":
        if (atEnd) return false;
        this.transport = "forwarding";
        return true;
      case "pause":
        this.paused = !this.paused;
        return this.paused;
      case "stop":
        this.transport = "stopped";
        this.paused = false;
        return false;
      case "record":
        return false;
    }
  }

  update(delta: number): boolean {
    this.syncAudio();
    if (this.playback) {
      this.position = this.playback.offset + (this.playback.context.currentTime - this.playback.startedAt);
    } else {
      this.position += this.speed * delta;
    }
    this.position = Math.min(this.duration, Math.max(0, this.position));
    if (this.whirr) this.tuneWhirr(this.whirr);

    const ranOut = this.transport === "rewinding" ? this.position <= 0 : this.transport !== "stopped" && this.position >= this.duration - END_MARGIN;
    if (!ranOut) return false;
    this.transport = "stopped";
    this.syncAudio();
    return true;
  }

  dispose() {
    this.transport = "stopped";
    this.paused = false;
    this.syncAudio();
  }

  private get winding() {
    return this.transport === "rewinding" || this.transport === "forwarding";
  }

  private get rolling() {
    return this.playing && (this.playback !== null || this.unavailable);
  }

  private syncAudio() {
    const rig = this.playing || this.winding ? audioRig() : null;
    if (!rig && this.playing) this.unavailable = true;

    const play = this.playing && this.buffer !== null && rig !== null;
    if (play && !this.playback && this.buffer && rig) this.playback = startPlayback(rig, this.buffer, this.position);
    if (!play && this.playback) {
      stopPlayback(this.playback);
      this.playback = null;
    }

    if (this.winding && !this.whirr && rig) this.whirr = startWhirr(rig);
    if (!this.winding && this.whirr) {
      release(this.whirr, WHIRR.fade);
      this.whirr = null;
    }
  }

  private tuneWhirr({ band, context }: Whirr) {
    const toward = this.transport === "forwarding" ? this.progress : 1 - this.progress;
    band.frequency.setTargetAtTime(WHIRR.low + (WHIRR.high - WHIRR.low) * toward, context.currentTime, 0.1);
  }
}
