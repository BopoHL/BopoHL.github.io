import { sizeOf } from "@/content/geometry";
import type { Evidence, EvidenceImage, Locale, PhotoEvidence } from "@/content/types";
import { wearFor } from "../wear/profile";
import type { FontFamilies } from "./fonts";
import { paintBadge } from "./kinds/badge";
import { paintChart } from "./kinds/chart";
import { paintCertificate, paintRedacted, paintTag } from "./kinds/documents";
import { paintFolder } from "./kinds/folder";
import { paintScrap, paintSticky } from "./kinds/handwritten";
import { paintNewspaper } from "./kinds/newspaper";
import { paintMugshotPrint, paintPhoto } from "./kinds/photo";
import { paintTyped } from "./kinds/typed";
import { seededRandom } from "./random";
import { createSurface, type Surface } from "./surface";
import { applyWear } from "./wear";

export { loadFonts, resolveFontFamilies, type FontFamilies } from "./fonts";

const MAX_TEXTURE_SIZE = 2048;

const surfaceFor = (item: Evidence, pixelsPerUnit: number, fonts: FontFamilies, seed: string): Surface => {
  const { width, height } = sizeOf(item);
  const scale = Math.min(pixelsPerUnit, MAX_TEXTURE_SIZE / Math.max(width, height));
  return createSurface(width * scale, height * scale, seededRandom(seed), fonts);
};

export const paintEvidence = async (
  item: Evidence,
  locale: Locale,
  pixelsPerUnit: number,
  fonts: FontFamilies,
): Promise<HTMLCanvasElement> => {
  const surface = surfaceFor(item, pixelsPerUnit, fonts, item.id);
  switch (item.kind) {
    case "newspaper":
      await paintNewspaper({ item, locale, surface });
      break;
    case "typed":
      paintTyped({ item, locale, surface });
      break;
    case "sticky":
      paintSticky({ item, locale, surface });
      break;
    case "scrap":
      paintScrap({ item, locale, surface });
      break;
    case "photo":
      await paintPhoto({ item, locale, surface });
      break;
    case "chart":
      paintChart({ item, locale, surface });
      break;
    case "badge":
      await paintBadge({ item, locale, surface });
      break;
    case "certificate":
      paintCertificate({ item, locale, surface });
      break;
    case "redacted":
      paintRedacted({ item, locale, surface });
      break;
    case "tag":
      paintTag({ item, locale, surface });
      break;
    case "folder":
      await paintFolder({ item, locale, surface });
      break;
  }
  applyWear(surface, wearFor(item));
  return surface.canvas;
};

export const paintRevealedMugshot = async (
  item: PhotoEvidence,
  image: EvidenceImage,
  placard: string,
  pixelsPerUnit: number,
  fonts: FontFamilies,
): Promise<HTMLCanvasElement> => {
  const surface = surfaceFor(item, pixelsPerUnit, fonts, `${item.id}-revealed`);
  await paintMugshotPrint(surface, image, placard);
  applyWear(surface, wearFor(item));
  return surface.canvas;
};
