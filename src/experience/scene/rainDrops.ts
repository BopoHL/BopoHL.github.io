import type { RainGlass } from "./rainGlass";

export const RUNNER_STRETCH = 1.3;
export const DROP_FLOATS = 4;

export const dropCount = (glass: RainGlass) => glass.beads.length + glass.runners.length;

export const writeDrops = (glass: RainGlass, drops: Float32Array, trails: Float32Array) => {
  let at = 0;
  for (const bead of glass.beads) {
    drops[at++] = bead.x;
    drops[at++] = bead.y;
    drops[at++] = bead.radius;
    drops[at++] = 1;
  }
  glass.runners.forEach((runner, index) => {
    drops[at++] = runner.x;
    drops[at++] = runner.y;
    drops[at++] = runner.radius;
    drops[at++] = RUNNER_STRETCH;
    trails.set([runner.x, runner.top, runner.y, runner.radius], index * DROP_FLOATS);
  });
};
