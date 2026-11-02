import type { TextLedger } from "./ledger";
import { jitter, type Random } from "@/lib/random";
import type { Rect } from "./surface";

export const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
};

export interface FitOptions {
  fontAt: (size: number) => string;
  maxSize: number;
  minSize: number;
  lineHeight: number;
}

export interface FittedText {
  size: number;
  lines: string[];
  lineHeightPx: number;
  height: number;
}

export const fitText = (ctx: CanvasRenderingContext2D, text: string, box: Rect, options: FitOptions): FittedText => {
  let size = options.maxSize;
  for (;;) {
    ctx.font = options.fontAt(size);
    const lines = wrapText(ctx, text, box.width);
    const lineHeightPx = size * options.lineHeight;
    const height = lines.length * lineHeightPx;
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
    if ((height <= box.height && widest <= box.width) || size <= options.minSize) {
      return { size, lines, lineHeightPx, height };
    }
    size *= 0.94;
  }
};

export const fitLines = (
  ctx: CanvasRenderingContext2D,
  paragraphs: string[],
  box: Rect,
  options: FitOptions & { paragraphGap: number },
): { size: number; blocks: string[][]; lineHeightPx: number } => {
  let size = options.maxSize;
  for (;;) {
    ctx.font = options.fontAt(size);
    const blocks = paragraphs.map((paragraph) => wrapText(ctx, paragraph, box.width));
    const lineHeightPx = size * options.lineHeight;
    const lineCount = blocks.reduce((sum, block) => sum + block.length, 0);
    const height = lineCount * lineHeightPx + (blocks.length - 1) * size * options.paragraphGap;
    if (height <= box.height || size <= options.minSize) return { size, blocks, lineHeightPx };
    size *= 0.95;
  }
};

export interface InkOptions {
  color: string;
  random: Random;
  ledger?: TextLedger;
}

export const drawTypewriterLine = (
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  size: number,
  { color, random, ledger }: InkOptions,
) => {
  ledger?.record(ctx, line, x, y, size);
  ctx.save();
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  let cursor = x;
  for (const char of line) {
    const advance = ctx.measureText(char).width;
    if (char !== " ") {
      const faded = random() < 0.06;
      ctx.globalAlpha = faded ? 0.5 + random() * 0.15 : 0.78 + random() * 0.22;
      const dx = jitter(random, size * 0.025);
      const dy = jitter(random, size * 0.045);
      ctx.fillText(char, cursor + dx, y + dy);
      if (random() < 0.08) {
        ctx.globalAlpha *= 0.35;
        ctx.fillText(char, cursor + dx + size * 0.03, y + dy + size * 0.02);
      }
    }
    cursor += advance;
  }
  ctx.restore();
};

export const drawTypewriterBlock = (
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  size: number,
  lineHeightPx: number,
  ink: InkOptions,
) => {
  lines.forEach((line, index) => drawTypewriterLine(ctx, line, x, y + index * lineHeightPx, size, ink));
  return y + lines.length * lineHeightPx;
};

export const drawHandwrittenBlock = (
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  size: number,
  lineHeightPx: number,
  { color, random }: InkOptions,
) => {
  ctx.save();
  ctx.fillStyle = color;
  lines.forEach((line, index) => {
    ctx.save();
    const baseline = y + index * lineHeightPx;
    ctx.translate(x + jitter(random, size * 0.08), baseline + jitter(random, size * 0.05));
    ctx.rotate(jitter(random, 0.018));
    ctx.globalAlpha = 0.86 + random() * 0.14;
    ctx.fillText(line, 0, 0);
    ctx.restore();
  });
  ctx.restore();
  return y + lines.length * lineHeightPx;
};

export const drawJustifiedLine = (
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  width: number,
  justify: boolean,
  record?: { ledger: TextLedger; size: number },
) => {
  const words = line.split(" ");
  const wordsWidth = words.reduce((sum, word) => sum + ctx.measureText(word).width, 0);
  const gap = words.length < 2 ? 0 : (width - wordsWidth) / (words.length - 1);
  if (!justify || words.length < 2 || gap > ctx.measureText(" ").width * 3) {
    record?.ledger.record(ctx, line, x, y, record.size);
    ctx.fillText(line, x, y);
    return;
  }
  record?.ledger.record(ctx, line, x, y, record.size, { wordGap: gap });
  let cursor = x;
  for (const word of words) {
    ctx.fillText(word, cursor, y);
    cursor += ctx.measureText(word).width + gap;
  }
};
