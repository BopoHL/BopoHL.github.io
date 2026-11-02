import { seededRandom, type Random } from "@/lib/random";

const SAMPLE_RATE = 22050;
const BPM = 74;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const SWING = 0.64;
const INTRO_BARS = 4;
const OUTRO_BARS = 4;
const FADE_OUT = 3;
const REVERB_SECONDS = 1.8;
const REVERB_MIX = 0.22;
const PEAK = 0.8;

interface Chord {
  root: number;
  voicing: number[];
}

const CHORDS: Record<string, Chord> = {
  Dm9: { root: 38, voicing: [53, 57, 60, 64] },
  Gm9: { root: 43, voicing: [58, 62, 65, 69] },
  Em7b5: { root: 40, voicing: [55, 58, 62, 64] },
  A7b9: { root: 45, voicing: [61, 64, 67, 70] },
  Bb13: { root: 46, voicing: [56, 60, 62, 67] },
  C13: { root: 48, voicing: [58, 62, 64, 69] },
  Fmaj9: { root: 41, voicing: [57, 60, 64, 67] },
  Bbmaj9: { root: 46, voicing: [57, 60, 62, 65] },
};

const FORM = [
  "Dm9", "Dm9", "Gm9", "Gm9", "Em7b5", "A7b9", "Dm9", "Bb13",
  "Gm9", "C13", "Fmaj9", "Bbmaj9", "Em7b5", "A7b9", "Dm9", "A7b9",
];

type Note = [beat: number, midi: number, beats: number];

const MELODY: Note[][] = [
  [[0, 69, 1.5], [1.5, 72, 0.5], [2, 69, 1], [3, 65, 1]],
  [[0, 64, 3]],
  [[0, 74, 1.5], [1.5, 70, 0.5], [2, 69, 1], [3, 67, 1]],
  [[0, 65, 3]],
  [[0, 67, 1.5], [1.5, 70, 0.5], [2, 74, 1.5]],
  [[0, 73, 1], [1, 70, 1], [2, 69, 1], [3, 67, 1]],
  [[0, 65, 1], [1, 64, 1], [2, 62, 2]],
  [],
  [[0, 70, 1], [1, 74, 1], [2, 77, 1.5], [3.5, 76, 0.5]],
  [[0, 74, 2], [2, 70, 1], [3, 69, 1]],
  [[0, 69, 1.5], [1.5, 67, 0.5], [2, 64, 2]],
  [[0, 62, 3]],
  [[0, 67, 1], [1, 70, 1], [2, 74, 1], [3, 77, 1]],
  [[0, 76, 1.5], [1.5, 73, 0.5], [2, 70, 1], [3, 67, 1]],
  [[0, 69, 1], [1, 65, 1], [2, 64, 1], [3, 62, 1]],
  [[0, 64, 3]],
];

const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

const swung = (beat: number) => {
  const whole = Math.floor(beat);
  const fraction = beat - whole;
  return (whole + (fraction === 0.5 ? SWING : fraction)) * BEAT;
};

interface Studio {
  context: OfflineAudioContext;
  dry: AudioNode;
  noise: AudioBuffer;
  random: Random;
}

const decayingGain = (studio: Studio, at: number, peak: number, attack: number, decay: number, end?: number) => {
  const gain = studio.context.createGain();
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(peak, at + attack);
  gain.gain.setTargetAtTime(0, at + attack, decay / 4);
  if (end !== undefined) {
    gain.gain.cancelScheduledValues(end);
    gain.gain.setTargetAtTime(0, end, 0.06);
  }
  return gain;
};

const electricPiano = (studio: Studio, at: number, midi: number, beats: number, velocity: number) => {
  const { context } = studio;
  const f = frequency(midi);
  const end = at + beats * BEAT;
  const carrier = context.createOscillator();
  carrier.frequency.value = f;
  const modulator = context.createOscillator();
  modulator.frequency.value = f;
  const index = context.createGain();
  index.gain.setValueAtTime(f * 2.2, at);
  index.gain.setTargetAtTime(f * 0.25, at, 0.18);
  modulator.connect(index).connect(carrier.frequency);
  const amp = decayingGain(studio, at, 0.065 * velocity, 0.004, 2.6, end);
  carrier.connect(amp).connect(studio.dry);
  for (const node of [carrier, modulator]) {
    node.start(at);
    node.stop(end + 0.5);
  }
};

const bass = (studio: Studio, at: number, midi: number, velocity: number) => {
  const { context } = studio;
  const f = frequency(midi);
  const end = at + BEAT * 0.95;
  const amp = decayingGain(studio, at, 0.3 * velocity, 0.006, 1.1, end);
  const tone = context.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 900;
  tone.connect(amp).connect(studio.dry);
  for (const [ratio, level] of [
    [1, 1],
    [2, 0.35],
    [3, 0.1],
  ] as const) {
    const oscillator = context.createOscillator();
    oscillator.frequency.setValueAtTime(f * ratio * 1.015, at);
    oscillator.frequency.exponentialRampToValueAtTime(f * ratio, at + 0.03);
    const partial = context.createGain();
    partial.gain.value = level;
    oscillator.connect(partial).connect(tone);
    oscillator.start(at);
    oscillator.stop(end + 0.3);
  }
};

const vibraphone = (studio: Studio, at: number, midi: number, beats: number) => {
  const { context } = studio;
  const f = frequency(midi);
  const ring = Math.max(1.6, beats * BEAT + 0.8);
  const tremolo = context.createOscillator();
  tremolo.frequency.value = 5.2;
  const depth = context.createGain();
  depth.gain.value = 0.25;
  const pulse = context.createGain();
  tremolo.connect(depth).connect(pulse.gain);
  pulse.connect(studio.dry);
  const body = decayingGain(studio, at, 0.09, 0.002, ring);
  body.connect(pulse);
  for (const [ratio, level, decay] of [
    [1, 1, ring],
    [4, 0.22, 0.5],
    [10, 0.05, 0.12],
  ] as const) {
    const oscillator = context.createOscillator();
    oscillator.frequency.value = f * ratio;
    const partial = decayingGain(studio, at, level, 0.001, decay);
    oscillator.connect(partial).connect(body);
    oscillator.start(at);
    oscillator.stop(at + ring + 0.5);
  }
  tremolo.start(at);
  tremolo.stop(at + ring + 0.5);
};

const noiseBurst = (studio: Studio, at: number, centre: number, q: number, peak: number, attack: number, decay: number) => {
  const { context, noise, random } = studio;
  const source = context.createBufferSource();
  source.buffer = noise;
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = centre;
  filter.Q.value = q;
  source.connect(filter).connect(decayingGain(studio, at, peak, attack, decay)).connect(studio.dry);
  source.start(at, random() * (noise.duration - decay - 0.2), attack + decay + 0.1);
};

const ride = (studio: Studio, at: number, accent: number) => {
  noiseBurst(studio, at, 7200, 0.8, 0.045 * accent, 0.002, 0.45);
  for (const partial of [5150, 6930, 8120, 9340]) {
    const oscillator = studio.context.createOscillator();
    oscillator.frequency.value = partial * (1 + (studio.random() - 0.5) * 0.004);
    oscillator.connect(decayingGain(studio, at, 0.004 * accent, 0.001, 1.2)).connect(studio.dry);
    oscillator.start(at);
    oscillator.stop(at + 1.4);
  }
};

const brushes = (studio: Studio, barStart: number) => {
  for (let beat = 0; beat < 4; beat++) {
    const at = barStart + beat * BEAT;
    noiseBurst(studio, at, 2400, 0.5, 0.018, 0.12, BEAT * 0.9);
    if (beat % 2 === 1) noiseBurst(studio, at, 3200, 0.7, 0.07, 0.01, 0.28);
  }
  for (const beat of [0, 2]) {
    const oscillator = studio.context.createOscillator();
    oscillator.frequency.setValueAtTime(70, barStart + beat * BEAT);
    oscillator.frequency.exponentialRampToValueAtTime(48, barStart + beat * BEAT + 0.2);
    oscillator.connect(decayingGain(studio, barStart + beat * BEAT, 0.12, 0.004, 0.25)).connect(studio.dry);
    oscillator.start(barStart + beat * BEAT);
    oscillator.stop(barStart + beat * BEAT + 0.4);
  }
};

const RIDE_PATTERN: Array<[number, number]> = [
  [0, 1],
  [1, 0.8],
  [1.5, 0.55],
  [2, 1],
  [3, 0.8],
  [3.5, 0.55],
];

const walk = (chord: Chord, next: Chord, random: Random) => {
  const fifth = chord.root + 7;
  const third = chord.root + (random() < 0.5 ? 3 : 4);
  const approach = next.root + (random() < 0.5 ? -1 : 1);
  return [chord.root, random() < 0.6 ? fifth : third, random() < 0.5 ? chord.root + 12 : fifth + 2, approach];
};

const comp = (studio: Studio, barStart: number, chord: Chord, sparse: boolean) => {
  const hits: Array<[number, number, number]> = sparse
    ? [[0, 3.5, 0.8]]
    : studio.random() < 0.5
      ? [
          [0, 1.4, 0.9],
          [1.5, 0.45, 0.65],
          [3.5, 0.5, 0.55],
        ]
      : [
          [0.5, 1, 0.75],
          [2, 1.5, 0.85],
        ];
  for (const [beat, beats, velocity] of hits) {
    chord.voicing.forEach((midi, index) =>
      electricPiano(studio, barStart + swung(beat) + index * 0.012, midi, beats, velocity),
    );
  }
};

const reverbResponse = (context: OfflineAudioContext, random: Random) => {
  const length = Math.round(context.sampleRate * REVERB_SECONDS);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (random() * 2 - 1) * (1 - i / length) ** 3;
  return buffer;
};

const normalize = (buffer: AudioBuffer) => {
  const data = buffer.getChannelData(0);
  let peak = 0;
  for (const sample of data) peak = Math.max(peak, Math.abs(sample));
  if (peak === 0) return buffer;
  const scale = PEAK / peak;
  for (let i = 0; i < data.length; i++) data[i] *= scale;
  return buffer;
};

const RECORDING_SECONDS = (INTRO_BARS + FORM.length + OUTRO_BARS) * BAR;

export const composeNoirJazz = async (): Promise<AudioBuffer> => {
  const context = new OfflineAudioContext(1, Math.ceil(RECORDING_SECONDS * SAMPLE_RATE), SAMPLE_RATE);
  const random = seededRandom("noir-jazz");
  const noise = context.createBuffer(1, SAMPLE_RATE * 2, SAMPLE_RATE);
  const noiseData = noise.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = random() * 2 - 1;

  const master = context.createGain();
  master.gain.setValueAtTime(0, 0);
  master.gain.linearRampToValueAtTime(1, 0.6);
  master.gain.setValueAtTime(1, RECORDING_SECONDS - FADE_OUT);
  master.gain.linearRampToValueAtTime(0, RECORDING_SECONDS);
  master.connect(context.destination);
  const reverb = context.createConvolver();
  reverb.buffer = reverbResponse(context, random);
  const wet = context.createGain();
  wet.gain.value = REVERB_MIX;
  reverb.connect(wet).connect(master);
  const dry = context.createGain();
  dry.connect(master);
  dry.connect(reverb);
  const studio: Studio = { context, dry, noise, random };

  const bars = [
    ...Array<string>(INTRO_BARS).fill("Dm9"),
    ...FORM,
    ...Array<string>(OUTRO_BARS).fill("Dm9"),
  ];
  bars.forEach((name, bar) => {
    const chord = CHORDS[name];
    const next = CHORDS[bars[bar + 1] ?? "Dm9"];
    const barStart = bar * BAR;
    walk(chord, next, random).forEach((midi, beat) => bass(studio, barStart + beat * BEAT, midi, beat === 0 ? 1 : 0.85));
    RIDE_PATTERN.forEach(([beat, accent]) => ride(studio, barStart + swung(beat), accent));
    brushes(studio, barStart);
    const inHead = bar >= INTRO_BARS && bar < INTRO_BARS + FORM.length;
    comp(studio, barStart, chord, !inHead);
    if (inHead) {
      for (const [beat, midi, beats] of MELODY[bar - INTRO_BARS]) vibraphone(studio, barStart + swung(beat), midi, beats);
    }
  });

  return normalize(await context.startRendering());
};
