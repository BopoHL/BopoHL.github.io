import type { ChartEvidence } from "@/content/types";
import { font } from "../fonts";
import { GRAPH_PAPER, HAND_INK, PENCIL, RED_PEN } from "../palette";
import { clipEdges, paintPaper } from "../paper";
import { jitter } from "@/lib/random";
import { drawHandwrittenBlock, fitText } from "../text";
import type { PaintJob } from "./job";

export const paintChart = ({ item, locale, surface }: PaintJob<ChartEvidence>) => {
  const { ctx, width: W, height: H, random, fonts } = surface;
  ctx.save();
  clipEdges(surface, { top: "straight", right: "cut", bottom: "straight", left: "cut" });
  paintPaper(surface, { base: GRAPH_PAPER, grain: 0.012, mottle: 0.06, burn: 0.12 });

  const minor = W / 40;
  ctx.lineWidth = Math.max(1, W * 0.0012);
  for (let x = 0; x < W; x += minor) {
    const major = Math.round(x / minor) % 5 === 0;
    ctx.strokeStyle = major ? "rgba(70, 130, 120, 0.45)" : "rgba(70, 130, 120, 0.2)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += minor) {
    const major = Math.round(y / minor) % 5 === 0;
    ctx.strokeStyle = major ? "rgba(70, 130, 120, 0.45)" : "rgba(70, 130, 120, 0.2)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  ctx.fillStyle = HAND_INK;
  ctx.font = font(700, H * 0.12, fonts.hand);
  ctx.fillText(item.title[locale], W * 0.08, H * 0.16);

  const plot = { x: W * 0.2, y: H * 0.25, width: W * 0.72, height: H * 0.58 };
  ctx.strokeStyle = PENCIL;
  ctx.lineWidth = Math.max(1.5, W * 0.004);
  ctx.beginPath();
  ctx.moveTo(plot.x, plot.y - H * 0.02);
  ctx.lineTo(plot.x + jitter(random, 2), plot.y + plot.height);
  ctx.lineTo(plot.x + plot.width, plot.y + plot.height + jitter(random, 2));
  ctx.stroke();

  const max = item.from * 1.15;
  const valueY = (value: number) => plot.y + plot.height - (value / max) * plot.height;
  ctx.font = font(500, H * 0.075, fonts.hand);
  ctx.fillStyle = PENCIL;
  ctx.textAlign = "right";
  ctx.fillText(String(item.from), plot.x - W * 0.02, valueY(item.from) + H * 0.025);
  ctx.fillText(`~${item.to}`, plot.x - W * 0.02, valueY(item.to) + H * 0.025);
  ctx.textAlign = "left";
  ctx.fillText(item.unit[locale], plot.x - W * 0.12, plot.y + plot.height + H * 0.08);

  const points: Array<[number, number]> = [];
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const value = t < 0.45 ? item.from + jitter(random, item.from * 0.05) : item.to + jitter(random, item.to * 0.12);
    points.push([plot.x + t * plot.width, valueY(value)]);
  }
  ctx.strokeStyle = RED_PEN;
  ctx.lineWidth = Math.max(2, W * 0.007);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.fillStyle = RED_PEN;
  for (const [x, y] of points) {
    ctx.beginPath();
    ctx.arc(x, y, W * 0.008, 0, Math.PI * 2);
    ctx.fill();
  }

  const dropX = plot.x + plot.width * 0.5;
  const dropY = (valueY(item.from) + valueY(item.to)) / 2;
  ctx.lineWidth = Math.max(1.5, W * 0.005);
  ctx.beginPath();
  ctx.ellipse(dropX, dropY, W * 0.09, H * 0.27, 0.15, 0.3, Math.PI * 2.15);
  ctx.stroke();
  const noteBox = { x: dropX + W * 0.11, y: plot.y + H * 0.08, width: W * 0.95 - dropX - W * 0.11, height: H * 0.3 };
  const note = fitText(ctx, item.note[locale], noteBox, {
    fontAt: (s) => font(700, s, fonts.hand),
    maxSize: H * 0.12,
    minSize: H * 0.07,
    lineHeight: 0.95,
  });
  ctx.font = font(700, note.size, fonts.hand);
  drawHandwrittenBlock(ctx, note.lines, noteBox.x, noteBox.y + note.size, note.size, note.lineHeightPx, { color: RED_PEN, random });
  ctx.restore();
};
