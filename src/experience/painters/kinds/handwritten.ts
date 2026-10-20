import type { ScrapEvidence, StickyEvidence } from "@/content/types";
import { font } from "../fonts";
import { HAND_INK, STICKY } from "../palette";
import { addGrain, clipEdges, paintPaper } from "../paper";
import { drawHandwrittenBlock, fitText } from "../text";
import type { PaintJob } from "./job";

export const paintSticky = ({ item, locale, surface }: PaintJob<StickyEvidence>) => {
  const { ctx, width: W, height: H, random, fonts } = surface;
  ctx.fillStyle = STICKY;
  ctx.fillRect(0, 0, W, H);
  const body = ctx.createLinearGradient(0, 0, 0, H);
  body.addColorStop(0, "rgba(255, 250, 200, 0.25)");
  body.addColorStop(0.22, "rgba(255, 250, 200, 0)");
  body.addColorStop(1, "rgba(120, 80, 0, 0.18)");
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(150, 110, 10, 0.08)";
  ctx.fillRect(0, 0, W, H * 0.16);
  const curl = ctx.createLinearGradient(W, H, W * 0.75, H * 0.75);
  curl.addColorStop(0, "rgba(90, 60, 0, 0.3)");
  curl.addColorStop(1, "rgba(90, 60, 0, 0)");
  ctx.fillStyle = curl;
  ctx.fillRect(0, 0, W, H);
  addGrain(ctx, W, H, random, 0.018);

  const pad = W * 0.1;
  const box = { x: pad, y: H * 0.2, width: W - pad * 2, height: H * 0.72 };
  const fitted = fitText(ctx, item.text[locale], box, {
    fontAt: (s) => font(700, s, fonts.hand),
    maxSize: W * 0.16,
    minSize: W * 0.07,
    lineHeight: 1.02,
  });
  ctx.font = font(700, fitted.size, fonts.hand);
  const top = box.y + (box.height - fitted.height) / 2 + fitted.size * 0.8;
  drawHandwrittenBlock(ctx, fitted.lines, pad, top, fitted.size, fitted.lineHeightPx, { color: HAND_INK, random });
};

export const paintScrap = ({ item, locale, surface }: PaintJob<ScrapEvidence>) => {
  const { ctx, width: W, height: H, random, fonts } = surface;
  ctx.save();
  clipEdges(surface, { top: "torn", right: "cut", bottom: "straight", left: "straight" });
  paintPaper(surface, { base: "#efe9da", grain: 0.014, mottle: 0.06, burn: 0.12 });

  const pad = W * 0.06;
  const margin = W * 0.13;
  const box = { x: margin + pad * 0.5, y: H * 0.16, width: W - margin - pad * 1.5, height: H * 0.78 };
  const fitted = fitText(ctx, item.text[locale], box, {
    fontAt: (s) => font(500, s, fonts.hand),
    maxSize: H * 0.24,
    minSize: H * 0.1,
    lineHeight: 1.12,
  });
  const first = box.y + fitted.size * 0.95;
  ctx.strokeStyle = "rgba(70, 110, 170, 0.35)";
  ctx.lineWidth = Math.max(1, H * 0.006);
  for (let y = first + fitted.size * 0.12 - fitted.lineHeightPx; y < H; y += fitted.lineHeightPx) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(190, 50, 50, 0.45)";
  ctx.beginPath();
  ctx.moveTo(margin, 0);
  ctx.lineTo(margin, H);
  ctx.stroke();

  ctx.font = font(500, fitted.size, fonts.hand);
  drawHandwrittenBlock(ctx, fitted.lines, box.x, first, fitted.size, fitted.lineHeightPx, { color: HAND_INK, random });
  ctx.restore();
};
