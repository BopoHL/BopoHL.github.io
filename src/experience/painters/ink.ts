import type { Annotations, InkMark, InkTool, MarginNote } from "@/content/types";
import { font } from "./fonts";
import type { PrintedSpan } from "./ledger";
import { jitter, range, type Random } from "@/lib/random";
import type { Rect, Surface } from "./surface";

const PEN = "#1f2c6b";
const MARKER = "#d4161d";
const FELT_TIP = "#121110";

type Point = [number, number];

interface InkStyle {
  width: number;
  tool: InkTool;
}

const wobblyLine = (random: Random, from: Point, to: Point, wobble: number): Point[] => {
  const steps = 10;
  const bend = jitter(random, wobble);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const sway = Math.sin(Math.PI * t) * bend + jitter(random, wobble * 0.25);
    return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t + sway];
  });
};

const tracePath = (ctx: CanvasRenderingContext2D, points: Point[]) => {
  ctx.beginPath();
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
};

const inkStroke = (surface: Surface, points: Point[], { width, tool }: InkStyle) => {
  const { ctx } = surface;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = width;
  if (tool === "marker") {
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.82;
    ctx.strokeStyle = MARKER;
  } else {
    ctx.globalAlpha = 0.86;
    ctx.strokeStyle = PEN;
  }
  tracePath(ctx, points);
  ctx.stroke();
  ctx.restore();
  if (tool !== "marker") return;
  const accent = surface.accent.context();
  accent.save();
  accent.setTransform(ctx.getTransform());
  accent.lineCap = "round";
  accent.lineJoin = "round";
  accent.lineWidth = width * 1.15;
  accent.strokeStyle = "#fff";
  tracePath(accent, points);
  accent.stroke();
  accent.restore();
};

const strokeWidth = (tool: InkTool, size: number) => (tool === "marker" ? size * 0.13 : Math.max(1.2, size * 0.06));

const underline = (surface: Surface, span: PrintedSpan, tool: InkTool) => {
  const { random } = surface;
  const y = span.baseline + span.size * 0.24;
  const from: Point = [span.left - span.size * range(random, 0.05, 0.15), y + jitter(random, span.size * 0.04)];
  const to: Point = [span.right + span.size * range(random, 0.05, 0.25), y + jitter(random, span.size * 0.06)];
  const style = { width: strokeWidth(tool, span.size), tool };
  inkStroke(surface, wobblyLine(random, from, to, span.size * 0.05), style);
  if (tool === "pen" && random() < 0.35) {
    const lower: Point[] = [
      [from[0] + span.size * 0.3, from[1] + span.size * 0.16],
      [to[0] - span.size * 0.2, to[1] + span.size * 0.13],
    ];
    inkStroke(surface, wobblyLine(random, lower[0], lower[1], span.size * 0.05), style);
  }
};

const strikeThrough = (surface: Surface, span: PrintedSpan, tool: InkTool, passes: number) => {
  const { random } = surface;
  const style = { width: strokeWidth(tool, span.size), tool };
  for (let pass = 0; pass < passes; pass++) {
    const y = span.baseline - span.size * (0.28 + jitter(random, 0.06));
    const from: Point = [span.left - span.size * 0.15, y + jitter(random, span.size * 0.08)];
    const to: Point = [span.right + span.size * 0.15, y + jitter(random, span.size * 0.08)];
    inkStroke(surface, wobblyLine(random, from, to, span.size * 0.04), style);
  }
};

const encircle = (surface: Surface, spans: PrintedSpan[], tool: InkTool) => {
  const { random } = surface;
  const size = Math.max(...spans.map((span) => span.size));
  const left = Math.min(...spans.map((span) => span.left));
  const right = Math.max(...spans.map((span) => span.right));
  const top = Math.min(...spans.map((span) => span.baseline - span.size * 0.82));
  const bottom = Math.max(...spans.map((span) => span.baseline + span.size * 0.24));
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const rx = (right - left) / 2 + size * 0.45;
  const ry = (bottom - top) / 2 + size * 0.4;
  const tilt = jitter(random, 0.06);
  const start = range(random, 0, Math.PI * 2);
  const sweep = Math.PI * 2 * range(random, 1.05, 1.15);
  const phase = random() * Math.PI * 2;
  const steps = 64;
  const points: Point[] = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const angle = start + sweep * t;
    const radius = 1 + 0.04 * Math.sin(3 * angle + phase) + 0.07 * t;
    const x = Math.cos(angle) * rx * radius;
    const y = Math.sin(angle) * ry * radius;
    return [cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)];
  });
  inkStroke(surface, points, { width: strokeWidth(tool, size) * (tool === "marker" ? 0.7 : 1), tool });
};

const COMPACT_BLOCK = 1.35;

const widthOf = (span: PrintedSpan) => span.right - span.left;

const circledSpans = (spans: PrintedSpan[]) => {
  const left = Math.min(...spans.map((span) => span.left));
  const right = Math.max(...spans.map((span) => span.right));
  const widest = spans.reduce((best, span) => (widthOf(span) > widthOf(best) ? span : best));
  return right - left <= widthOf(widest) * COMPACT_BLOCK ? spans : [widest];
};

const drawMark = (surface: Surface, mark: InkMark) => {
  const spans = surface.ledger.find(mark.phrase);
  if (spans.length === 0) return;
  if (mark.stroke === "circle") encircle(surface, circledSpans(spans), mark.tool);
  else if (mark.stroke === "underline") spans.forEach((span) => underline(surface, span, mark.tool));
  else spans.forEach((span) => strikeThrough(surface, span, mark.tool, 1));
};

const drawNote = (surface: Surface, note: MarginNote) => {
  const { ctx, width, height, random, fonts } = surface;
  const tool = note.tool ?? "pen";
  const size = note.size * width;
  ctx.save();
  ctx.translate(note.at[0] * width, note.at[1] * height);
  ctx.rotate(((note.rotation ?? 0) * Math.PI) / 180);
  ctx.font = font(600, size, fonts.hand);
  const spans = note.text.split("\n").map((line, index) => {
    const baseline = index * size * 1.05;
    const x = jitter(random, size * 0.08);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = tool === "marker" ? MARKER : PEN;
    ctx.fillText(line, x, baseline);
    if (tool === "marker") {
      const accent = surface.accent.context();
      accent.save();
      accent.setTransform(ctx.getTransform());
      accent.font = ctx.font;
      accent.fillStyle = "#fff";
      accent.fillText(line, x, baseline);
      accent.restore();
    }
    return { left: x, right: x + ctx.measureText(line).width, baseline, size };
  });
  if (note.struck) spans.forEach((span) => strikeThrough(surface, span, tool, 2));
  ctx.restore();
};

export const feltTipRedaction = ({ ctx, random }: Surface, rect: Rect) => {
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = FELT_TIP;
  const passes = 3;
  ctx.lineWidth = (rect.height / passes) * 1.7;
  for (let pass = 0; pass < passes; pass++) {
    const y = rect.y + (rect.height * (pass + 0.5)) / passes;
    const from: Point = [rect.x + range(random, 0.1, 0.3) * rect.height, y + jitter(random, rect.height * 0.05)];
    const to: Point = [rect.x + rect.width - range(random, 0, 0.3) * rect.height, y + jitter(random, rect.height * 0.08)];
    ctx.globalAlpha = range(random, 0.88, 0.96);
    tracePath(ctx, wobblyLine(random, from, to, rect.height * 0.06));
    ctx.stroke();
  }
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = Math.max(1, rect.height * 0.04);
  ctx.strokeStyle = "#8a8580";
  for (let streak = 0; streak < 4; streak++) {
    const y = rect.y + range(random, 0.15, 0.85) * rect.height;
    const start = rect.x + range(random, 0, 0.3) * rect.width;
    tracePath(ctx, [
      [start, y],
      [start + range(random, 0.3, 0.7) * rect.width, y + jitter(random, rect.height * 0.04)],
    ]);
    ctx.stroke();
  }
  ctx.restore();
};

export const applyInk = (surface: Surface, annotations: Annotations | undefined) => {
  if (!annotations) return;
  for (const mark of annotations.marks ?? []) drawMark(surface, mark);
  for (const note of annotations.notes ?? []) drawNote(surface, note);
};
