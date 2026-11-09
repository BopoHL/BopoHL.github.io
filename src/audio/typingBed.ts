import { loadRecording } from "./recordings";
import { audioRig } from "./rig";

const SRC = "/audio/typewriter.mp3";
const LEVEL = 0.45;
const FADE_IN = 0.04;
const FADE_OUT = 0.2;

interface Voice {
  context: AudioContext;
  source: AudioBufferSourceNode;
  output: GainNode;
}

export const preloadTypingBed = () => void loadRecording(SRC);

export class TypingBed {
  private voice: Voice | null = null;
  private wanted = false;

  async start() {
    this.wanted = true;
    const buffer = await loadRecording(SRC);
    const rig = audioRig();
    if (!buffer || !rig || !this.wanted || this.voice) return;
    const { context } = rig;
    const output = context.createGain();
    output.gain.value = 0;
    output.gain.setTargetAtTime(LEVEL, context.currentTime, FADE_IN / 3);
    output.connect(rig.output);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(output);
    source.start(0, Math.random() * buffer.duration);
    this.voice = { context, source, output };
  }

  stop() {
    this.wanted = false;
    if (!this.voice) return;
    const { context, source, output } = this.voice;
    output.gain.cancelScheduledValues(context.currentTime);
    output.gain.setTargetAtTime(0, context.currentTime, FADE_OUT / 3);
    source.stop(context.currentTime + FADE_OUT);
    source.onended = () => output.disconnect();
    this.voice = null;
  }
}
