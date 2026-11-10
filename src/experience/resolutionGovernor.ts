export interface PixelRatioRange {
  min: number;
  max: number;
}

const STEP = 0.25;
const WINDOW_FRAMES = 40;
const STRUGGLING_MS = 1000 / 45;
const COMFORTABLE_MS = 1000 / 57;
const COMFORTABLE_WINDOWS = 4;

export class ResolutionGovernor {
  private frames = 0;
  private spent = 0;
  private comfortable = 0;

  constructor(
    private readonly range: PixelRatioRange,
    private ratio = range.max,
  ) {}

  get pixelRatio() {
    return this.ratio;
  }

  frame(intervalMs: number): number | null {
    this.frames++;
    this.spent += intervalMs;
    if (this.frames < WINDOW_FRAMES) return null;
    const average = this.spent / this.frames;
    this.frames = 0;
    this.spent = 0;
    if (average > STRUGGLING_MS) {
      this.comfortable = 0;
      return this.change(this.ratio - STEP);
    }
    this.comfortable = average < COMFORTABLE_MS ? this.comfortable + 1 : 0;
    if (this.comfortable < COMFORTABLE_WINDOWS) return null;
    this.comfortable = 0;
    return this.change(this.ratio + STEP);
  }

  private change(wanted: number) {
    const next = Math.min(this.range.max, Math.max(this.range.min, wanted));
    if (next === this.ratio) return null;
    this.ratio = next;
    return next;
  }
}

export const pixelRatioRange = ([min, max]: [number, number], device: number): PixelRatioRange => ({
  min,
  max: Math.min(max, Math.max(min, device)),
});
