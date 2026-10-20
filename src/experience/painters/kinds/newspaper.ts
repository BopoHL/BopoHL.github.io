import type { NewspaperEvidence } from "@/content/types";
import { ui } from "@/content/ui";
import { font } from "../fonts";
import { gradePhoto, halftone, renderImage } from "../imaging";
import { INK, NEWSPRINT } from "../palette";
import { clipEdges, fold, paintPaper } from "../paper";
import type { Rect } from "../surface";
import { drawJustifiedLine, fitText, wrapText } from "../text";
import type { PaintJob } from "./job";

const layoutColumns = (
  ctx: CanvasRenderingContext2D,
  text: string,
  area: Rect,
  columns: number,
  gap: number,
  fontAt: (size: number) => string,
  maxSize: number,
  minSize: number,
) => {
  const columnWidth = (area.width - gap * (columns - 1)) / columns;
  let size = maxSize;
  for (;;) {
    ctx.font = fontAt(size);
    const lines = wrapText(ctx, text, columnWidth);
    const lineHeight = size * 1.28;
    const perColumn = Math.floor(area.height / lineHeight);
    if (Math.ceil(lines.length / columns) <= perColumn || size <= minSize) {
      return { size, lines, lineHeight, perColumn: Math.max(1, Math.ceil(lines.length / columns)), columnWidth };
    }
    size *= 0.95;
  }
};

export const paintNewspaper = async ({ item, locale, surface }: PaintJob<NewspaperEvidence>) => {
  const { ctx, width: W, height: H, random, fonts } = surface;
  ctx.save();
  clipEdges(surface, { top: "cut", right: "cut", bottom: "cut", left: "cut" });
  paintPaper(surface, { base: NEWSPRINT, grain: 0.08, mottle: 0.12, burn: 0.24, stains: random() < 0.3 ? 1 : 0 });
  if (random() < 0.5) fold(surface, random() < 0.5);

  const pad = W * 0.065;
  const inner = W - pad * 2;
  ctx.fillStyle = INK;
  ctx.textBaseline = "alphabetic";

  const mastheadSize = W * 0.04;
  ctx.font = font(700, mastheadSize, fonts.newsprint);
  ctx.textAlign = "center";
  let y = pad + mastheadSize;
  ctx.fillText(item.masthead[locale], W / 2, y);
  y += mastheadSize * 0.45;
  ctx.fillRect(pad, y, inner, Math.max(1, W * 0.003));
  y += mastheadSize * 0.95;
  const metaSize = W * 0.024;
  ctx.font = font(400, metaSize, fonts.newsprint, "italic");
  ctx.textAlign = "left";
  ctx.fillText(item.dateline[locale], pad, y);
  ctx.textAlign = "right";
  ctx.fillText(ui.print.page[locale], W - pad, y);
  y += metaSize * 0.6;
  ctx.fillRect(pad, y, inner, Math.max(1, W * 0.0015));
  y += W * 0.035;

  ctx.textAlign = "left";
  const headline = fitText(
    ctx,
    item.headline[locale],
    { x: pad, y, width: inner, height: H * (item.image ? 0.2 : 0.3) },
    { fontAt: (s) => font(900, s, fonts.headline), maxSize: W * 0.09, minSize: W * 0.045, lineHeight: 1.06 },
  );
  ctx.font = font(900, headline.size, fonts.headline);
  headline.lines.forEach((line, index) => ctx.fillText(line, pad, y + headline.size * 0.85 + index * headline.lineHeightPx));
  y += headline.height + W * 0.03;

  if (item.image) {
    const reservedForBody = H * 0.28;
    const imageHeight = Math.max(inner * 0.3, Math.min(inner * 0.5, H - y - reservedForBody - W * 0.06));
    const imageRect = { x: pad, y, width: inner, height: imageHeight };
    const sourceWidth = 480;
    const source = await renderImage(item.image, sourceWidth, (sourceWidth * imageHeight) / inner, random, fonts);
    const graded = gradePhoto(source, random, { warmth: 0, contrast: 1.25, lift: 0.04, vignette: 0.2, grain: 0.04 });
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(imageRect.x, imageRect.y, imageRect.width, imageRect.height);
    halftone(graded, ctx, imageRect, Math.max(2.5, W / 120), "rgba(28,26,23,0.92)");
    y += imageRect.height + W * 0.012;
    ctx.fillStyle = INK;
    ctx.font = font(400, W * 0.021, fonts.newsprint, "italic");
    ctx.fillText(ui.print.photoCredit[locale], pad, y + W * 0.02);
    y += W * 0.045;
  }

  const area = { x: pad, y, width: inner, height: H - y - pad * 0.8 };
  const columns = W >= 950 ? 2 : 1;
  const body = layoutColumns(
    ctx,
    item.body[locale],
    area,
    columns,
    W * 0.04,
    (s) => font(400, s, fonts.newsprint),
    W * 0.042,
    W * 0.024,
  );
  ctx.fillStyle = INK;
  ctx.font = font(400, body.size, fonts.newsprint);
  body.lines.forEach((line, index) => {
    const column = Math.floor(index / body.perColumn);
    const row = index % body.perColumn;
    const isLastInParagraph = index === body.lines.length - 1;
    drawJustifiedLine(
      ctx,
      line,
      area.x + column * (body.columnWidth + W * 0.04),
      area.y + body.size + row * body.lineHeight,
      body.columnWidth,
      !isLastInParagraph,
    );
  });
  if (columns > 1) {
    ctx.fillRect(area.x + body.columnWidth + W * 0.02, area.y, Math.max(1, W * 0.0012), body.perColumn * body.lineHeight);
  }
  ctx.restore();
};
