import { CanvasTexture, CircleGeometry, SRGBColorSpace, type BufferGeometry } from "three";
import type { Locale } from "@/content/types";
import { font, type FontFamilies } from "../painters/fonts";
import { context2d, createCanvas } from "../painters/surface";

export const KEY_ROWS: Record<Locale, string[]> = {
  ru: ["1234567890", "ЙЦУКЕНГШЩЗ", "ФЫВАПРОЛДЖ", "ЯЧСМИТЬБЮ"],
  en: ["1234567890", "QWERTYUIOP", "ASDFGHJKL;", "ZXCVBNM,."],
};

export const TYPEWRITER = {
  keyPitch: 0.36,
  rowStep: 0.38,
  rowStagger: 0.11,
  rowRise: 0.09,
  frontRow: 1.35,
  capRadius: 0.135,
  baseHeight: 0.5,
  platen: { radius: 0.3, length: 3.9, y: 1.5, z: -1.05 },
  paper: { width: 2.5, height: 3.1 },
};

export interface KeySpot {
  char: string;
  position: [number, number, number];
  cell: [number, number];
}

const ATLAS_GRID = 8;

export const keySpots = (locale: Locale): KeySpot[] => {
  const rows = KEY_ROWS[locale];
  return rows.flatMap((row, rowIndex) => {
    const fromFront = rows.length - 1 - rowIndex;
    const z = TYPEWRITER.frontRow - fromFront * TYPEWRITER.rowStep;
    const y = TYPEWRITER.baseHeight + 0.18 + (rows.length - 1 - fromFront) * TYPEWRITER.rowRise;
    const offset = -((row.length - 1) * TYPEWRITER.keyPitch) / 2 + rowIndex * TYPEWRITER.rowStagger - 0.15;
    return [...row].map((char, column) => {
      const index = rows.slice(0, rowIndex).reduce((sum, previous) => sum + previous.length, 0) + column;
      return {
        char,
        position: [offset + column * TYPEWRITER.keyPitch, y, z] as [number, number, number],
        cell: [index % ATLAS_GRID, Math.floor(index / ATLAS_GRID)] as [number, number],
      };
    });
  });
};

export const keyIndexFor = (spots: KeySpot[], char: string) => {
  const upper = char.toLocaleUpperCase();
  const index = spots.findIndex((spot) => spot.char === upper);
  return index >= 0 ? index : null;
};

export const createCapGeometry = ([column, row]: [number, number]): BufferGeometry => {
  const geometry = new CircleGeometry(TYPEWRITER.capRadius * 0.82, 28);
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (column + uv.getX(i)) / ATLAS_GRID, 1 - (row + 1) / ATLAS_GRID + uv.getY(i) / ATLAS_GRID);
  }
  geometry.rotateX(-Math.PI / 2);
  return geometry;
};

export const paintKeyAtlas = (spots: KeySpot[], fonts: FontFamilies) => {
  const cell = 64;
  const canvas = createCanvas(cell * ATLAS_GRID, cell * ATLAS_GRID);
  const ctx = context2d(canvas);
  ctx.fillStyle = "#151413";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#efe9dc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font(600, cell * 0.5, fonts.typewriter);
  for (const { char, cell: [column, row] } of spots) ctx.fillText(char, (column + 0.5) * cell, (row + 0.53) * cell);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};
