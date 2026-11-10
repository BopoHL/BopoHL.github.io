import {
  Camera,
  CanvasTexture,
  CustomBlending,
  DstColorFactor,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  NearestFilter,
  OneFactor,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
  ZeroFactor,
  type BufferGeometry,
  type Texture,
  type WebGLRenderer,
} from "three";
import { seededRandom } from "@/lib/random";
import { context2d, createCanvas } from "../painters/surface";
import { paintBlinds } from "../textures/procedural";
import { DROP_FLOATS, dropCount, writeDrops } from "./rainDrops";
import { RainGlass, type RainSettings } from "./rainGlass";

export interface WindowPane {
  size: number;
  slats: number;
  framesPerSecond: number;
  rain: RainSettings;
}

const LONGEST_STEP = 0.25;
const SPRITE = 64;
const CAUSTIC = 0.5;
const CORE = 0.45;
const TRAIL = { width: 0.8, shade: 100 / 255, strength: 0.75 };

const paintDropSprite = () => {
  const canvas = createCanvas(SPRITE, SPRITE);
  const ctx = context2d(canvas);
  const half = SPRITE / 2;
  const lens = ctx.createRadialGradient(half, half * 1.12, 0, half, half, half);
  lens.addColorStop(0, "rgba(255, 255, 255, 0)");
  lens.addColorStop(0.4, "rgba(214, 214, 214, 0.55)");
  lens.addColorStop(0.78, "rgba(72, 72, 72, 0.9)");
  lens.addColorStop(1, "rgba(72, 72, 72, 0)");
  ctx.fillStyle = lens;
  ctx.fillRect(0, 0, SPRITE, SPRITE);
  return canvas;
};

const paintCausticSprite = () => {
  const canvas = createCanvas(SPRITE, SPRITE);
  const ctx = context2d(canvas);
  const half = SPRITE / 2;
  const glow = ctx.createRadialGradient(half, half, 0, half, half, half);
  glow.addColorStop(0, "rgba(255, 255, 255, 1)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SPRITE, SPRITE);
  return canvas;
};

const ON_THE_PANE = /* glsl */ `
vec4 onThePane(vec2 at) {
  return vec4(at.x * 2.0 - 1.0, 1.0 - at.y * 2.0, 0.0, 1.0);
}
`;

const BLINDS = {
  vertexShader: /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}`,
  fragmentShader: /* glsl */ `
uniform sampler2D uBlinds;
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(texture2D(uBlinds, vUv).rgb, 1.0);
}`,
};

const PRINT = {
  vertexShader: BLINDS.vertexShader,
  fragmentShader: /* glsl */ `
uniform sampler2D uPainted;
varying vec2 vUv;
void main() {
  gl_FragColor = sRGBTransferEOTF(texture2D(uPainted, vUv));
}`,
};

const TRAILS = {
  vertexShader: /* glsl */ `
attribute vec4 aTrail;
varying float vAlong;
${ON_THE_PANE}
void main() {
  vAlong = 0.5 - position.y;
  vec2 middle = vec2(aTrail.x, (aTrail.y + aTrail.z) * 0.5);
  vec2 extent = vec2(aTrail.w * ${TRAIL.width.toFixed(2)}, aTrail.z - aTrail.y);
  gl_Position = onThePane(middle + vec2(position.x, -position.y) * extent);
}`,
  fragmentShader: /* glsl */ `
varying float vAlong;
void main() {
  float wet = ${TRAIL.strength.toFixed(2)} * vAlong;
  gl_FragColor = vec4(vec3(1.0 - wet * ${(1 - TRAIL.shade).toFixed(4)}), 1.0);
}`,
};

const LENSES = {
  vertexShader: /* glsl */ `
attribute vec4 aDrop;
varying vec2 vUv;
${ON_THE_PANE}
void main() {
  vUv = uv;
  gl_Position = onThePane(aDrop.xy + vec2(position.x, -position.y * aDrop.w) * aDrop.z * 2.0);
}`,
  fragmentShader: /* glsl */ `
uniform sampler2D uSprite;
varying vec2 vUv;
void main() {
  vec4 lens = texture2D(uSprite, vUv);
  gl_FragColor = vec4(vec3(1.0 - lens.a) + lens.rgb, 1.0);
}`,
};

const CAUSTICS = {
  vertexShader: /* glsl */ `
attribute vec4 aDrop;
uniform sampler2D uBlinds;
varying vec2 vUv;
varying float vLight;
${ON_THE_PANE}
void main() {
  vUv = uv;
  vLight = ${CAUSTIC.toFixed(2)} * texture2D(uBlinds, vec2(aDrop.x, 1.0 - aDrop.y)).r;
  vec2 core = aDrop.xy + vec2(0.0, aDrop.z * 0.15);
  gl_Position = onThePane(core + vec2(position.x, -position.y) * aDrop.z * ${(CORE * 2).toFixed(2)});
}`,
  fragmentShader: /* glsl */ `
uniform sampler2D uSprite;
varying vec2 vUv;
varying float vLight;
void main() {
  gl_FragColor = vec4(vec3(texture2D(uSprite, vUv).a * vLight), 0.0);
}`,
};

const MULTIPLY = { blending: CustomBlending, blendSrc: DstColorFactor, blendDst: ZeroFactor } as const;
const ADD = { blending: CustomBlending, blendSrc: OneFactor, blendDst: OneFactor } as const;

const instanced = (quad: PlaneGeometry, name: string, values: Float32Array) => {
  const geometry = new InstancedBufferGeometry();
  geometry.index = quad.index;
  geometry.setAttribute("position", quad.getAttribute("position"));
  geometry.setAttribute("uv", quad.getAttribute("uv"));
  const attribute = new InstancedBufferAttribute(values, DROP_FLOATS);
  geometry.setAttribute(name, attribute);
  geometry.instanceCount = values.length / DROP_FLOATS;
  return { geometry, attribute };
};

const sprite = (canvas: HTMLCanvasElement) => {
  const texture = new CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  return texture;
};

const placed = (geometry: BufferGeometry, material: ShaderMaterial, order: number) => {
  const mesh = new Mesh(geometry, material);
  mesh.renderOrder = order;
  mesh.frustumCulled = false;
  return mesh;
};

export class RainyBlinds {
  private readonly frameTime: number;
  private readonly glass: RainGlass;
  private readonly painted: WebGLRenderTarget;
  private readonly pane: WebGLRenderTarget;
  private readonly layers = new Scene();
  private readonly print = new Scene();
  private readonly camera = new Camera();
  private readonly quad = new PlaneGeometry(1, 1);
  private readonly drops: ReturnType<typeof instanced>;
  private readonly trails: ReturnType<typeof instanced>;
  private readonly textures: Texture[];
  private readonly materials: ShaderMaterial[];
  private pending = 0;
  private fresh = true;

  constructor({ size, slats, framesPerSecond, rain }: WindowPane) {
    this.frameTime = 1 / framesPerSecond;
    this.glass = new RainGlass(seededRandom("rain on the window"), rain);
    this.painted = new WebGLRenderTarget(size, size, { depthBuffer: false, minFilter: NearestFilter, magFilter: NearestFilter });
    this.pane = new WebGLRenderTarget(size, size, {
      depthBuffer: false,
      colorSpace: SRGBColorSpace,
      generateMipmaps: true,
      minFilter: LinearMipmapLinearFilter,
    });
    const blinds = new CanvasTexture(paintBlinds(size, slats));
    const lens = sprite(paintDropSprite());
    lens.premultiplyAlpha = true;
    const glow = sprite(paintCausticSprite());
    this.textures = [blinds, lens, glow];

    this.drops = instanced(this.quad, "aDrop", new Float32Array(dropCount(this.glass) * DROP_FLOATS));
    this.trails = instanced(this.quad, "aTrail", new Float32Array(this.glass.runners.length * DROP_FLOATS));
    const layer = (shader: typeof BLINDS, uniforms: Record<string, Texture>, blend: object = {}) =>
      new ShaderMaterial({
        ...shader,
        ...blend,
        uniforms: Object.fromEntries(Object.entries(uniforms).map(([name, value]) => [name, { value }])),
        depthTest: false,
        depthWrite: false,
      });
    const stacked: Array<[BufferGeometry, ShaderMaterial]> = [
      [this.quad, layer(BLINDS, { uBlinds: blinds })],
      [this.trails.geometry, layer(TRAILS, {}, MULTIPLY)],
      [this.drops.geometry, layer(LENSES, { uSprite: lens }, MULTIPLY)],
      [this.drops.geometry, layer(CAUSTICS, { uSprite: glow, uBlinds: blinds }, ADD)],
    ];
    stacked.forEach(([geometry, material], order) => this.layers.add(placed(geometry, material, order)));
    const print = layer(PRINT, { uPainted: this.painted.texture });
    this.print.add(placed(this.quad, print, 0));
    this.materials = [...stacked.map(([, material]) => material), print];
  }

  get texture() {
    return this.pane.texture;
  }

  update(renderer: WebGLRenderer, delta: number) {
    this.pending += delta;
    if (!this.fresh && this.pending < this.frameTime) return;
    if (this.pending > 0) this.glass.step(Math.min(this.pending, LONGEST_STEP));
    this.pending = 0;
    this.fresh = false;
    writeDrops(this.glass, this.drops.attribute.array as Float32Array, this.trails.attribute.array as Float32Array);
    this.drops.attribute.needsUpdate = true;
    this.trails.attribute.needsUpdate = true;
    const target = renderer.getRenderTarget();
    renderer.setRenderTarget(this.painted);
    renderer.render(this.layers, this.camera);
    renderer.setRenderTarget(this.pane);
    renderer.render(this.print, this.camera);
    renderer.setRenderTarget(target);
  }

  dispose() {
    this.painted.dispose();
    this.pane.dispose();
    this.quad.dispose();
    this.drops.geometry.dispose();
    this.trails.geometry.dispose();
    for (const texture of this.textures) texture.dispose();
    for (const material of this.materials) material.dispose();
  }
}
