import { CanvasTexture, SRGBColorSpace } from "three";
import { seededRandom } from "@/lib/random";
import { font, type FontFamilies } from "../painters/fonts";
import { INK, PAPER } from "../painters/palette";
import { context2d, createCanvas } from "../painters/surface";
import { drawTypewriterLine, wrapText } from "../painters/text";

export interface SheetText {
  heading: string;
  signature: string;
  message: string;
  placeholder: string;
  stamp: string;
}

const SIZE = { width: 768, height: 952 };
const MARGIN = 70;
const TYPE_SIZE = 30;
const LINE_HEIGHT = 1.5;

export class StatementSheet {
  readonly texture: CanvasTexture;
  private readonly canvas = createCanvas(SIZE.width, SIZE.height);
  private shown = "";

  constructor(private readonly fonts: FontFamilies) {
    this.texture = new CanvasTexture(this.canvas);
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.anisotropy = 8;
  }

  show(text: SheetText) {
    const key = JSON.stringify(text);
    if (key === this.shown) return;
    this.shown = key;
    const ctx = context2d(this.canvas);
    const random = seededRandom("statement-sheet");
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, SIZE.width, SIZE.height);
    for (let i = 0; i < 2200; i++) {
      ctx.fillStyle = `rgba(90, 70, 40, ${0.02 + random() * 0.04})`;
      ctx.fillRect(random() * SIZE.width, random() * SIZE.height, 1 + random() * 2, 1 + random() * 2);
    }

    const ink = { color: INK, random: seededRandom("statement-ink") };
    ctx.font = font(400, TYPE_SIZE, this.fonts.typewriter);
    const width = SIZE.width - MARGIN * 2;
    const lines = [
      text.heading,
      "",
      ...(text.signature ? [text.signature, ""] : []),
      ...wrapText(ctx, text.message || text.placeholder, width),
    ];
    const lineHeight = TYPE_SIZE * LINE_HEIGHT;
    const bottom = SIZE.height - MARGIN * 0.9;
    ctx.globalAlpha = text.message ? 1 : 0.4;
    lines.forEach((line, index) => {
      const y = bottom - (lines.length - 1 - index) * lineHeight;
      if (y > MARGIN && line) drawTypewriterLine(ctx, line, MARGIN, y, TYPE_SIZE, ink);
    });
    ctx.globalAlpha = 1;
    if (text.stamp) this.stamp(ctx, text.stamp);
    this.texture.needsUpdate = true;
  }

  private stamp(ctx: CanvasRenderingContext2D, label: string) {
    ctx.save();
    ctx.translate(SIZE.width * 0.66, SIZE.height * 0.78);
    ctx.rotate(-0.18);
    ctx.strokeStyle = "rgba(170, 24, 28, 0.85)";
    ctx.fillStyle = "rgba(170, 24, 28, 0.85)";
    ctx.lineWidth = 6;
    ctx.font = font(600, 54, this.fonts.stamp);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const width = ctx.measureText(label.toUpperCase()).width + 44;
    ctx.strokeRect(-width / 2, -42, width, 84);
    ctx.fillText(label.toUpperCase(), 0, 2);
    ctx.restore();
  }

  dispose() {
    this.texture.dispose();
  }
}
