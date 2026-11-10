import type { EffectComposer } from "postprocessing";

export const plainPassBuffer = (composer: EffectComposer | null) => {
  if (!composer) return;
  const buffer = composer.outputBuffer;
  buffer.samples = 0;
  buffer.depthBuffer = false;
  buffer.dispose();
};
