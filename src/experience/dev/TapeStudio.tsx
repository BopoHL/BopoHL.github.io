"use client";

import { useEffect, useState } from "react";
import { composeNoirJazz } from "@/audio/noirJazz";
import { encodeWav } from "@/audio/wav";

export function TapeStudio() {
  const [status, setStatus] = useState("composing");
  const [recording, setRecording] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    const run = async () => {
      const started = performance.now();
      const buffer = await composeNoirJazz();
      if (cancelled) return;
      url = URL.createObjectURL(encodeWav(buffer));
      setRecording(url);
      setStatus(`ready in ${Math.round(performance.now() - started)} ms, ${buffer.duration.toFixed(2)} s`);
    };
    void run();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  return (
    <main style={{ padding: 24, background: "#1c1a18", color: "#ece4cf", minHeight: "100vh", fontFamily: "monospace" }}>
      <p data-status={status}>{status}</p>
      {recording && (
        <>
          <audio controls src={recording} />
          <p>
            <a href={recording} download="noir-jazz.wav" data-recording style={{ color: "inherit" }}>
              noir-jazz.wav
            </a>
          </p>
        </>
      )}
    </main>
  );
}
