export interface PrintedLine {
  text: string;
  offsets: number[];
  baseline: number;
  size: number;
}

export interface PrintedSpan {
  left: number;
  right: number;
  baseline: number;
  size: number;
}

interface LineOptions {
  wordGap?: number;
}

const alignedStart = (ctx: CanvasRenderingContext2D, x: number, width: number) => {
  if (ctx.textAlign === "center") return x - width / 2;
  if (ctx.textAlign === "right" || ctx.textAlign === "end") return x - width;
  return x;
};

const glyphOffsets = (ctx: CanvasRenderingContext2D, text: string, start: number, wordGap?: number) => {
  const offsets: number[] = [];
  if (wordGap === undefined) {
    for (let i = 0; i <= text.length; i++) offsets.push(start + ctx.measureText(text.slice(0, i)).width);
    return offsets;
  }
  let cursor = start;
  let wordStart = 0;
  for (let i = 0; i <= text.length; i++) {
    if (i === text.length || text[i] === " ") {
      const word = text.slice(wordStart, i);
      for (let k = 0; k <= word.length; k++) offsets[wordStart + k] = cursor + ctx.measureText(word.slice(0, k)).width;
      cursor += ctx.measureText(word).width + wordGap;
      wordStart = i + 1;
    }
  }
  return offsets;
};

export class TextLedger {
  private readonly lines: PrintedLine[] = [];

  record(ctx: CanvasRenderingContext2D, text: string, x: number, baseline: number, size: number, options: LineOptions = {}) {
    const width = ctx.measureText(text).width;
    const start = options.wordGap === undefined ? alignedStart(ctx, x, width) : x;
    this.lines.push({ text, offsets: glyphOffsets(ctx, text, start, options.wordGap), baseline, size });
  }

  find(phrase: string): PrintedSpan[] {
    let stream = "";
    const starts: number[] = [];
    for (const line of this.lines) {
      starts.push(stream.length);
      stream += `${line.text} `;
    }
    const at = stream.indexOf(phrase);
    if (at < 0 || phrase.length === 0) return [];
    const end = at + phrase.length;
    const spans: PrintedSpan[] = [];
    this.lines.forEach((line, index) => {
      const lineStart = starts[index];
      let from = Math.max(at, lineStart) - lineStart;
      let to = Math.min(end, lineStart + line.text.length) - lineStart;
      while (from < to && line.text[from] === " ") from++;
      while (to > from && line.text[to - 1] === " ") to--;
      if (to <= from) return;
      spans.push({ left: line.offsets[from], right: line.offsets[to], baseline: line.baseline, size: line.size });
    });
    return spans;
  }
}
