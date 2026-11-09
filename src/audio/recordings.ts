const DECODE_SAMPLE_RATE = 44100;

const recordings = new Map<string, Promise<AudioBuffer | null>>();

const decode = async (src: string) => {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Recording ${src} answered ${response.status}`);
  return new OfflineAudioContext(1, 1, DECODE_SAMPLE_RATE).decodeAudioData(await response.arrayBuffer());
};

export const loadRecording = (src: string) => {
  const cached = recordings.get(src);
  if (cached) return cached;
  const loading = decode(src).catch(() => null);
  recordings.set(src, loading);
  return loading;
};
