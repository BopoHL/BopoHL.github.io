import type { CertificateEvidence, RedactedEvidence, TagEvidence } from "@/content/types";
import { ui } from "@/content/ui";
import { font } from "../fonts";
import { feltTipRedaction } from "../ink";
import { AREA_INK, INK, MANILA, PAPER } from "../palette";
import { clipEdges, paintPaper } from "../paper";
import { jitter, range } from "@/lib/random";
import { drawStamp } from "../stamp";
import { fitLines, fitText, drawTypewriterLine } from "../text";
import type { PaintJob } from "./job";

export const paintRedacted = ({ item, locale, surface }: PaintJob<RedactedEvidence>) => {
  const { ctx, width: W, height: H, random, fonts } = surface;
  ctx.save();
  clipEdges(surface, { top: "straight", right: "straight", bottom: "cut", left: "straight" });
  paintPaper(surface, { base: PAPER, grain: 0.017, mottle: 0.08, burn: 0.16 });
  const pad = W * 0.08;
  const ink = { color: INK, random, ledger: surface.ledger };

  ctx.font = font(400, W * 0.03, fonts.typewriter);
  ctx.textAlign = "right";
  ctx.fillStyle = INK;
  ctx.fillText(ui.print.registry[locale], W - pad, pad + W * 0.02);
  ctx.textAlign = "left";

  let y = pad + W * 0.12;
  ctx.font = font(600, W * 0.1, fonts.typewriter);
  drawTypewriterLine(ctx, item.title[locale], pad, y, W * 0.1, ink);
  y += W * 0.065;
  ctx.font = font(400, W * 0.04, fonts.typewriter);
  drawTypewriterLine(ctx, item.subtitle[locale], pad, y, W * 0.04, ink);
  y += W * 0.035;
  ctx.fillRect(pad, y, W - pad * 2, Math.max(1, W * 0.003));
  y += W * 0.05;

  const paragraphs = item.lines.map((line) => line.text?.[locale] ?? "█".repeat(line.redact ?? 0));
  const fitted = fitLines(ctx, paragraphs, { x: pad, y, width: W - pad * 2, height: H - y - pad * 1.6 }, {
    fontAt: (s) => font(400, s, fonts.typewriter),
    maxSize: W * 0.045,
    minSize: W * 0.026,
    lineHeight: 1.35,
    paragraphGap: 0.45,
  });
  ctx.font = font(400, fitted.size, fonts.typewriter);
  let cursor = y + fitted.size;
  item.lines.forEach((line, index) => {
    const block = fitted.blocks[index];
    if (!line.text) {
      const charWidth = ctx.measureText("█").width;
      feltTipRedaction(surface, {
        x: pad,
        y: cursor - fitted.size * 0.85,
        width: Math.min(W - pad * 2, charWidth * (line.redact ?? 0)),
        height: fitted.size * 1.05,
      });
      cursor += fitted.lineHeightPx + fitted.size * 0.45;
      return;
    }
    block.forEach((text, lineIndex) => {
      drawTypewriterLine(ctx, text, pad, cursor, fitted.size, ink);
      const isLast = lineIndex === block.length - 1;
      if (isLast && line.redact) {
        const start = pad + ctx.measureText(`${text} `).width;
        const width = Math.min(W - pad - start, ctx.measureText("█").width * line.redact);
        feltTipRedaction(surface, { x: start, y: cursor - fitted.size * 0.85, width, height: fitted.size * 1.05 });
      }
      cursor += fitted.lineHeightPx;
    });
    cursor += fitted.size * 0.45;
  });

  drawStamp(surface, {
    text: item.stamp[locale],
    x: W * 0.62,
    y: H * 0.8,
    height: W * 0.14,
    rotation: range(random, -18, -10),
  });
  ctx.restore();
};

export const paintCertificate = ({ item, locale, surface }: PaintJob<CertificateEvidence>) => {
  const { ctx, width: W, height: H, random, fonts } = surface;
  paintPaper(surface, { base: "#ede3c8", grain: 0.014, mottle: 0.1, burn: 0.2 });
  const accent = AREA_INK[item.area];
  const m = W * 0.035;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(2, W * 0.006);
  ctx.strokeRect(m, m, W - m * 2, H - m * 2);
  ctx.lineWidth = Math.max(1, W * 0.002);
  ctx.strokeRect(m * 1.6, m * 1.6, W - m * 3.2, H - m * 3.2);
  ctx.fillStyle = accent;
  for (const [x, y] of [
    [m * 1.6, m * 1.6],
    [W - m * 1.6, m * 1.6],
    [m * 1.6, H - m * 1.6],
    [W - m * 1.6, H - m * 1.6],
  ]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-W * 0.012, -W * 0.012, W * 0.024, W * 0.024);
    ctx.restore();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  ctx.font = font(600, H * 0.06, fonts.stamp);
  ctx.fillText(item.issuer[locale], W / 2, H * 0.17);
  ctx.font = font(900, H * 0.12, fonts.headline);
  ctx.fillText(ui.print.certificate[locale], W / 2, H * 0.32);
  ctx.font = font(400, H * 0.05, fonts.newsprint, "italic");
  const awarded = `${ui.print.awardedTo[locale]} `;
  const awardedWidth = ctx.measureText(awarded).width;
  const barWidth = W * 0.28;
  const startX = W / 2 - (awardedWidth + barWidth) / 2;
  ctx.textAlign = "left";
  ctx.fillText(awarded, startX, H * 0.42);
  feltTipRedaction(surface, { x: startX + awardedWidth, y: H * 0.38, width: barWidth, height: H * 0.055 });
  ctx.textAlign = "center";

  const title = fitText(ctx, item.title[locale], { x: W * 0.12, y: H * 0.47, width: W * 0.76, height: H * 0.16 }, {
    fontAt: (s) => font(700, s, fonts.headline),
    maxSize: H * 0.085,
    minSize: H * 0.05,
    lineHeight: 1.1,
  });
  ctx.font = font(700, title.size, fonts.headline);
  title.lines.forEach((line, index) => {
    const baseline = H * 0.47 + title.size + index * title.lineHeightPx;
    surface.ledger.record(ctx, line, W / 2, baseline, title.size);
    ctx.fillText(line, W / 2, baseline);
  });
  const detailsTop = H * 0.5 + title.height + H * 0.02;
  const details = fitText(ctx, item.details[locale], { x: W * 0.15, y: detailsTop, width: W * 0.7, height: H * 0.16 }, {
    fontAt: (s) => font(400, s, fonts.newsprint, "italic"),
    maxSize: H * 0.05,
    minSize: H * 0.032,
    lineHeight: 1.2,
  });
  ctx.font = font(400, details.size, fonts.newsprint, "italic");
  details.lines.forEach((line, index) => {
    const baseline = detailsTop + details.size + index * details.lineHeightPx;
    surface.ledger.record(ctx, line, W / 2, baseline, details.size);
    ctx.fillText(line, W / 2, baseline);
  });

  ctx.font = font(400, H * 0.045, fonts.typewriter);
  ctx.fillText(item.year, W / 2, H * 0.86);

  ctx.strokeStyle = "rgba(29, 40, 71, 0.85)";
  ctx.lineWidth = Math.max(1.5, W * 0.003);
  ctx.beginPath();
  let sx = W * 0.14;
  ctx.moveTo(sx, H * 0.84);
  for (let i = 0; i < 9; i++) {
    sx += W * 0.018;
    ctx.quadraticCurveTo(sx - W * 0.01, H * (0.78 + jitter(random, 0.04)), sx, H * (0.84 + jitter(random, 0.02)));
  }
  ctx.stroke();

  const sealX = W * 0.8;
  const sealY = H * 0.8;
  const sealR = H * 0.09;
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  for (let i = 0; i <= 36; i++) {
    const angle = (i / 36) * Math.PI * 2;
    const r = sealR * (i % 2 ? 0.9 : 1);
    ctx.lineTo(sealX + Math.cos(angle) * r, sealY + Math.sin(angle) * r);
  }
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(255, 240, 220, 0.5)";
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealR * 0.65, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = "left";
};

export const paintTag = ({ item, locale, surface }: PaintJob<TagEvidence>) => {
  const { ctx, width: W, height: H, random, fonts } = surface;
  const notch = H * 0.28;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(notch, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, H);
  ctx.lineTo(notch, H);
  ctx.lineTo(0, H - notch);
  ctx.lineTo(0, notch);
  ctx.closePath();
  ctx.clip();
  paintPaper(surface, { base: MANILA, grain: 0.028, mottle: 0.12, burn: 0.28 });

  const holeX = notch * 0.85;
  const holeY = H / 2;
  ctx.fillStyle = "rgba(235, 220, 190, 0.85)";
  ctx.beginPath();
  ctx.arc(holeX, holeY, H * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(holeX, holeY, H * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  const left = notch * 1.7;
  const right = W - W * 0.05;
  ctx.fillStyle = INK;
  ctx.font = font(600, H * 0.075, fonts.stamp);
  ctx.fillText(ui.print.evidence[locale].toUpperCase(), left, H * 0.13);
  const header = fitText(ctx, item.header[locale], { x: left, y: H * 0.14, width: right - left, height: H * 0.12 }, {
    fontAt: (s) => font(900, s, fonts.headline),
    maxSize: H * 0.12,
    minSize: H * 0.07,
    lineHeight: 1,
  });
  ctx.font = font(900, header.size, fonts.headline);
  ctx.fillText(header.lines.join(" "), left, H * 0.14 + header.size * 0.95);
  ctx.fillRect(left, H * 0.29, right - left, Math.max(1, H * 0.008));
  const fitted = fitLines(ctx, item.lines[locale], { x: left, y: H * 0.34, width: right - left, height: H * 0.6 }, {
    fontAt: (s) => font(400, s, fonts.typewriter),
    maxSize: H * 0.1,
    minSize: H * 0.06,
    lineHeight: 1.3,
    paragraphGap: 0.1,
  });
  ctx.font = font(400, fitted.size, fonts.typewriter);
  let y = H * 0.34 + fitted.size;
  for (const block of fitted.blocks) {
    for (const line of block) {
      drawTypewriterLine(ctx, line, left, y, fitted.size, { color: INK, random, ledger: surface.ledger });
      y += fitted.lineHeightPx;
    }
  }
  ctx.restore();
};
