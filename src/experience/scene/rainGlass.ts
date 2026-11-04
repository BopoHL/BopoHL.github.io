import { range, type Random } from "@/lib/random";

export interface Bead {
  x: number;
  y: number;
  radius: number;
}

export interface Runner extends Bead {
  top: number;
  speed: number;
  pause: number;
}

export interface RainSettings {
  beads: number;
  runners: number;
  scale: number;
}

export const RAIN = {
  bead: [0.0018, 0.0055],
  runner: [0.005, 0.009],
  maxRunner: 0.013,
  speed: [0.05, 0.16],
  landingsPerSecond: 12,
  referenceBeads: 300,
  slipChancePerSecond: 0.9,
  slipPause: [0.05, 0.5],
  waitBeforeRun: [0.4, 4],
  evaporation: 0.0009,
  residuePerSecond: 2.5,
  residue: 0.35,
} as const;

const span = (random: Random, [min, max]: readonly [number, number]) => range(random, min, max);

export class RainGlass {
  readonly beads: Bead[];
  readonly runners: Runner[];
  private readonly random: Random;
  private readonly scale: number;

  constructor(random: Random, { beads, runners, scale }: RainSettings) {
    this.random = random;
    this.scale = scale;
    this.beads = Array.from({ length: beads }, () => this.freshBead());
    this.runners = Array.from({ length: runners }, () => this.freshRunner(random()));
  }

  step(delta: number) {
    const random = this.random;
    for (const runner of this.runners) {
      if (runner.pause > 0) {
        runner.pause -= delta;
        continue;
      }
      runner.y += runner.speed * delta * (0.5 + runner.radius / (RAIN.maxRunner * this.scale));
      runner.x += (random() - 0.5) * 0.0015 * this.scale;
      runner.radius -= RAIN.evaporation * this.scale * delta;
      if (random() < RAIN.slipChancePerSecond * delta) runner.pause = span(random, RAIN.slipPause);
      if (random() < RAIN.residuePerSecond * delta) this.leaveResidue(runner);
      for (const bead of this.beads) {
        const reach = (runner.radius + bead.radius) * 0.9;
        if ((bead.x - runner.x) ** 2 + (bead.y - runner.y) ** 2 > reach * reach) continue;
        runner.radius = Math.min(RAIN.maxRunner * this.scale, Math.hypot(runner.radius, bead.radius));
        Object.assign(bead, this.freshBead());
      }
      if (runner.y - runner.radius > 1 || runner.radius < RAIN.runner[0] * this.scale * 0.5) {
        Object.assign(runner, this.freshRunner(random() * 0.5));
      }
    }
    let landings = RAIN.landingsPerSecond * (this.beads.length / RAIN.referenceBeads) * delta;
    while (landings > 0) {
      if (random() < landings) Object.assign(this.beads[Math.floor(random() * this.beads.length)], this.freshBead());
      landings -= 1;
    }
  }

  private leaveResidue(runner: Runner) {
    const bead = this.beads[Math.floor(this.random() * this.beads.length)];
    Object.assign(bead, {
      x: runner.x,
      y: Math.max(runner.top, runner.y - runner.radius * 2.5),
      radius: runner.radius * RAIN.residue,
    });
  }

  private freshBead(): Bead {
    const random = this.random;
    return { x: random(), y: random(), radius: span(random, RAIN.bead) * this.scale };
  }

  private freshRunner(y: number): Runner {
    const random = this.random;
    return {
      x: range(random, 0.03, 0.97),
      y,
      top: y,
      radius: span(random, RAIN.runner) * this.scale,
      speed: span(random, RAIN.speed) * this.scale,
      pause: span(random, RAIN.waitBeforeRun),
    };
  }
}
