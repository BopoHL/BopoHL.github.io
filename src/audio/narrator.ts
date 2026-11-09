import { loadRecording } from "./recordings";
import { audioRig } from "./rig";

const LEVEL = 1;
const FADE_OUT = 0.3;

interface Line {
  context: AudioContext;
  source: AudioBufferSourceNode;
  output: GainNode;
}

export class Narrator {
  private line: Line | null = null;
  private wanted: string | null = null;

  preload(sources: string[]) {
    for (const src of sources) void loadRecording(src);
  }

  async say(src: string) {
    this.wanted = src;
    const buffer = await loadRecording(src);
    const rig = audioRig();
    if (!buffer || !rig || this.wanted !== src) return;
    this.fade();
    const { context } = rig;
    const output = context.createGain();
    output.gain.value = LEVEL;
    output.connect(rig.output);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(output);
    source.onended = () => output.disconnect();
    source.start();
    this.line = { context, source, output };
  }

  hush() {
    this.wanted = null;
    this.fade();
  }

  private fade() {
    if (!this.line) return;
    const { context, source, output } = this.line;
    output.gain.cancelScheduledValues(context.currentTime);
    output.gain.setTargetAtTime(0, context.currentTime, FADE_OUT / 3);
    source.stop(context.currentTime + FADE_OUT);
    this.line = null;
  }
}
