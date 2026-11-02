export interface FocusBlur {
  resolutionScale: number;
  bokehScale: number;
  peripheralRadius: number;
}

export interface Quality {
  tier: "high" | "low";
  dpr: [number, number];
  shadowMapSize: number;
  pixelsPerUnit: number;
  dustCount: number;
  chromaticAberration: boolean;
  multisampling: number;
  flashlightShadows: boolean;
  focusBlur: FocusBlur;
}

const HIGH: Quality = {
  tier: "high",
  dpr: [1, 2],
  shadowMapSize: 2048,
  pixelsPerUnit: 300,
  dustCount: 900,
  chromaticAberration: true,
  multisampling: 4,
  flashlightShadows: false,
  focusBlur: { resolutionScale: 0.5, bokehScale: 2.4, peripheralRadius: 5 },
};

const LOW: Quality = {
  tier: "low",
  dpr: [1, 1.5],
  shadowMapSize: 1024,
  pixelsPerUnit: 190,
  dustCount: 350,
  chromaticAberration: false,
  multisampling: 0,
  flashlightShadows: false,
  focusBlur: { resolutionScale: 0.3, bokehScale: 1.6, peripheralRadius: 4 },
};

export const detectQuality = (): Quality => {
  if (typeof window === "undefined") return HIGH;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.screen.width, window.screen.height) < 820;
  const weakCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
  return coarse || small || weakCpu ? LOW : HIGH;
};
