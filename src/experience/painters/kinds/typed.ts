import type { TypedEvidence } from "@/content/types";
import { ui } from "@/content/ui";
import { font } from "../fonts";
import { feltTipRedaction } from "../ink";
import { INDEX_CARD, INK, MANILA, PAPER } from "../palette";
import { clipEdges, coffeeRing, paintPaper } from "../paper";
import { range } from "@/lib/random";
import { drawStamp } from "../stamp";
import type { Rect, Surface } from "../surface";
import { drawTypewriterBlock, drawTypewriterLine, fitLines, fitText, type InkOptions } from "../text";
import type { PaintJob } from "./job";

const ruleIndexCard = ({ ctx, width, height }: Surface, headerLine: number, firstRule: number, spacing: number) => {
  ctx.save();
  ctx.strokeStyle = "rgba(170, 40, 40, 0.55)";
  ctx.lineWidth = Math.max(1, height * 0.004);
  ctx.beginPath();
  ctx.moveTo(0, headerLine);
  ctx.lineTo(width, headerLine);
  ctx.stroke();
  ctx.strokeStyle = "rgba(60, 100, 160, 0.35)";
  ctx.lineWidth = Math.max(1, height * 0.0025);
  for (let y = firstRule; y < height - spacing * 0.2; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
};

const punchHoles = ({ ctx, height, width }: Surface) => {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  for (const t of [0.25, 0.75]) {
    ctx.beginPath();
    ctx.arc(width * 0.045, height * t, width * 0.017, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

const classifiedHeight = (rows: number, size: number) => (rows + 1) * size * 1.75 + size * 0.5;

const paintClassified = (surface: Surface, header: string, fields: string[], box: Rect, size: number, ink: InkOptions) => {
  const { ctx, random, fonts } = surface;
  const pad = size * 0.6;
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = Math.max(1, size * 0.07);
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  ctx.globalAlpha = 1;
  ctx.font = font(600, size, fonts.typewriter);
  let baseline = box.y + size * 1.45;
  drawTypewriterLine(ctx, header.toUpperCase(), box.x + pad, baseline, size, ink);
  ctx.globalAlpha = 0.75;
  ctx.fillRect(box.x, baseline + size * 0.45, box.width, Math.max(1, size * 0.06));
  ctx.globalAlpha = 1;
  ctx.font = font(400, size, fonts.typewriter);
  for (const field of fields) {
    baseline += size * 1.75;
    drawTypewriterLine(ctx, field, box.x + pad, baseline, size, ink);
    const start = box.x + pad + ctx.measureText(`${field} `).width;
    const end = box.x + box.width - pad - range(random, 0, 0.25) * (box.x + box.width - pad - start);
    feltTipRedaction(surface, { x: start, y: baseline - size * 0.95, width: end - start, height: size * 1.2 });
  }
  ctx.restore();
};

export const paintTyped = ({ item, locale, surface }: PaintJob<TypedEvidence>) => {
  const { ctx, width: W, height: H, random, fonts } = surface;
  const isManila = item.paper === "manila";
  const isIndex = item.paper === "index";
  ctx.save();
  clipEdges(surface, {
    top: "straight",
    right: isManila ? "straight" : "cut",
    bottom: "cut",
    left: "straight",
  });
  paintPaper(surface, {
    base: isManila ? MANILA : isIndex ? INDEX_CARD : PAPER,
    grain: isManila ? 0.09 : 0.05,
    mottle: isManila ? 0.14 : 0.08,
    burn: isManila ? 0.3 : 0.16,
  });
  if (!isManila && random() < 0.35) coffeeRing(surface);

  const pad = Math.min(W, H) * (isManila ? 0.12 : 0.075);
  const left = item.paper === "sheet" ? W * 0.1 : pad;
  const right = W - pad;
  const ink = { color: INK, random, ledger: surface.ledger };
  let y = pad;

  const titleBoxHeight = isManila && item.lines[locale].length === 0 ? H * 0.42 : H * 0.18;
  const title = fitText(
    ctx,
    item.title[locale],
    { x: left, y, width: right - left, height: titleBoxHeight },
    { fontAt: (s) => font(600, s, fonts.typewriter), maxSize: isManila ? H * 0.26 : Math.min(H * 0.1, W * 0.085), minSize: W * 0.03, lineHeight: 1.1 },
  );
  ctx.font = font(600, title.size, fonts.typewriter);
  y = drawTypewriterBlock(ctx, title.lines, left, y + title.size, title.size, title.lineHeightPx, ink) - title.size * 0.2;

  if (item.subtitle) {
    const subtitle = fitText(
      ctx,
      item.subtitle[locale],
      { x: left, y, width: right - left, height: H * 0.2 },
      { fontAt: (s) => font(400, s, fonts.typewriter), maxSize: title.size * (isManila ? 0.62 : 0.55), minSize: W * 0.025, lineHeight: 1.2 },
    );
    ctx.font = font(400, subtitle.size, fonts.typewriter);
    y = drawTypewriterBlock(ctx, subtitle.lines, left, y + subtitle.size * 1.2, subtitle.size, subtitle.lineHeightPx, ink);
  }

  const stampHeight = Math.min(W * 0.15, H * 0.22);
  const classified = item.classified?.[locale] ?? [];
  const classifiedSize = Math.min(W * 0.034, H * 0.032);
  const classifiedBox = {
    x: left,
    y: H - pad - classifiedHeight(classified.length, classifiedSize),
    width: (right - left) * 0.6,
    height: classifiedHeight(classified.length, classifiedSize),
  };
  const reserved = Math.max(item.stamp ? stampHeight * 1.1 : 0, classified.length > 0 ? classifiedBox.height + H * 0.03 : 0);
  const lines = item.lines[locale];
  if (lines.length > 0) {
    y += H * 0.03;
    const box = { x: left, y, width: right - left - W * 0.04, height: H - y - pad - reserved };
    const fitted = fitLines(ctx, lines.map((line) => `— ${line}`), box, {
      fontAt: (s) => font(400, s, fonts.typewriter),
      maxSize: W * 0.05,
      minSize: W * 0.022,
      lineHeight: 1.32,
      paragraphGap: 0.35,
    });
    if (isIndex) ruleIndexCard(surface, y - fitted.size * 0.15, y + fitted.size * 1.2, fitted.lineHeightPx);
    ctx.font = font(400, fitted.size, fonts.typewriter);
    let cursor = y + fitted.size;
    for (const block of fitted.blocks) {
      block.forEach((line, index) => {
        const indent = index === 0 ? 0 : ctx.measureText("— ").width;
        drawTypewriterLine(ctx, line, left + indent, cursor, fitted.size, ink);
        cursor += fitted.lineHeightPx;
      });
      cursor += isIndex ? 0 : fitted.size * 0.35;
    }
  } else if (isIndex) {
    ruleIndexCard(surface, y + H * 0.02, y + H * 0.14, H * 0.12);
  }

  if (classified.length > 0) {
    paintClassified(surface, ui.print.topSecret[locale], classified, classifiedBox, classifiedSize, ink);
  }

  if (item.stamp) {
    drawStamp(surface, {
      text: item.stamp[locale],
      x: W * range(random, 0.62, 0.7),
      y: H - pad * 0.6 - stampHeight * 0.6,
      height: stampHeight,
      rotation: range(random, -14, -6),
    });
  }
  ctx.restore();
  if (item.paper === "sheet") punchHoles(surface);
};
