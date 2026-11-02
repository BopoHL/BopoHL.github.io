const HEADER_BYTES = 44;
const BYTES_PER_SAMPLE = 2;

export const encodeWav = (buffer: AudioBuffer): Blob => {
  const channels = buffer.numberOfChannels;
  const frames = buffer.length;
  const dataBytes = frames * channels * BYTES_PER_SAMPLE;
  const view = new DataView(new ArrayBuffer(HEADER_BYTES + dataBytes));
  const text = (offset: number, value: string) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));

  text(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * BYTES_PER_SAMPLE, true);
  view.setUint16(32, channels * BYTES_PER_SAMPLE, true);
  view.setUint16(34, BYTES_PER_SAMPLE * 8, true);
  text(36, "data");
  view.setUint32(40, dataBytes, true);

  const samples = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel));
  let offset = HEADER_BYTES;
  for (let frame = 0; frame < frames; frame++) {
    for (const channel of samples) {
      view.setInt16(offset, Math.round(Math.max(-1, Math.min(1, channel[frame])) * 0x7fff), true);
      offset += BYTES_PER_SAMPLE;
    }
  }
  return new Blob([view.buffer], { type: "audio/wav" });
};
