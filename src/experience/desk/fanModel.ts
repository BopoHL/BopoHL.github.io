import {
  CatmullRomCurve3,
  CylinderGeometry,
  LatheGeometry,
  Shape,
  ShapeGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const FAN = {
  cageRadius: 1.45,
  cageCenter: 0.42,
  rimHalfDepth: 0.05,
  frontDome: 0.42,
  backDome: 0.36,
  bladeRadius: 1.27,
  hubRadius: 0.17,
  motorRadius: 0.46,
  motorLength: 0.95,
};

const WIRE = 0.009;
const RIM = 0.034;
const FRONT_SPOKES = 28;
const BACK_SPOKES = 18;
const RINGS = [0.32, 0.62, 0.92, 1.2];
const BLADES = 4;
const BLADE_PITCH = 0.42;

const dome = (radius: number, depth: number, side: 1 | -1) =>
  FAN.cageCenter + side * (FAN.rimHalfDepth + depth * (1 - (radius / FAN.cageRadius) ** 2));

const ring = (radius: number, z: number, thickness: number) => {
  const geometry = new TorusGeometry(radius, thickness, 6, 96);
  geometry.translate(0, 0, z);
  return geometry;
};

const spokes = (count: number, depth: number, side: 1 | -1, inner: number) =>
  Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    const points = Array.from({ length: 8 }, (_, step) => {
      const radius = inner + ((FAN.cageRadius - inner) * step) / 7;
      return new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, dome(radius, depth, side));
    });
    return new TubeGeometry(new CatmullRomCurve3(points), 10, WIRE, 4, false);
  });

export const BADGE = { radius: 0.2, z: dome(0, FAN.frontDome, 1) };

const rimBand = () => {
  const band = new CylinderGeometry(FAN.cageRadius, FAN.cageRadius, FAN.rimHalfDepth * 2, 96, 1, true);
  band.rotateX(Math.PI / 2);
  band.translate(0, 0, FAN.cageCenter);
  return band;
};

export const createCage = (): BufferGeometry => {
  const parts: BufferGeometry[] = [
    rimBand(),
    ring(FAN.cageRadius, FAN.cageCenter + FAN.rimHalfDepth, RIM),
    ring(FAN.cageRadius, FAN.cageCenter - FAN.rimHalfDepth, RIM),
    ...RINGS.flatMap((radius) => [
      ring(radius, dome(radius, FAN.frontDome, 1), WIRE),
      ring(radius, dome(radius, FAN.backDome, -1), WIRE),
    ]),
    ...spokes(FRONT_SPOKES, FAN.frontDome, 1, BADGE.radius - 0.02),
    ...spokes(BACK_SPOKES, FAN.backDome, -1, 0.12),
  ];
  const merged = mergeGeometries(parts.map((part) => part.toNonIndexed()));
  for (const part of parts) part.dispose();
  return merged;
};

const bladeShape = () => {
  const shape = new Shape();
  shape.moveTo(0.16, -0.08);
  shape.bezierCurveTo(0.5, -0.32, 1.05, -0.34, 1.24, -0.12);
  shape.bezierCurveTo(1.32, 0.02, 1.25, 0.22, 1.05, 0.28);
  shape.bezierCurveTo(0.75, 0.36, 0.42, 0.2, 0.16, 0.08);
  shape.closePath();
  return shape;
};

export const createBlades = (): BufferGeometry => {
  const parts = Array.from({ length: BLADES }, (_, index) => {
    const blade = new ShapeGeometry(bladeShape(), 12);
    blade.rotateX(BLADE_PITCH);
    blade.rotateZ((index / BLADES) * Math.PI * 2);
    return blade.toNonIndexed();
  });
  const merged = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  return merged;
};

export const createMotor = (): BufferGeometry => {
  const profile: Array<[number, number]> = [
    [0, -FAN.motorLength],
    [0.24, -0.93],
    [0.4, -0.78],
    [0.46, -0.5],
    [0.42, -0.2],
    [0.22, -0.06],
    [0.1, 0],
    [0, 0.02],
  ];
  const geometry = new LatheGeometry(
    profile.map(([radius, y]) => new Vector2(radius, y)),
    40,
  );
  geometry.rotateX(Math.PI / 2);
  return geometry;
};

export const createBase = (): BufferGeometry =>
  new LatheGeometry(
    (
      [
        [0, 0],
        [1.05, 0],
        [1.1, 0.06],
        [1.02, 0.2],
        [0.6, 0.33],
        [0.28, 0.4],
        [0, 0.42],
      ] as Array<[number, number]>
    ).map(([radius, y]) => new Vector2(radius, y)),
    48,
  );
