import { describe, expect, it, vi } from "vitest";
import { AnalyticsChannel } from "../track";

describe("analytics channel", () => {
  it("stays silent when analytics is not configured", () => {
    const channel = new AnalyticsChannel(false);
    const sink = vi.fn();
    channel.send("case_solved", {});
    channel.connect(sink);
    channel.send("phone_dialed", {});
    expect(sink).not.toHaveBeenCalled();
  });

  it("holds early events until the SDK connects, then sends them in order", () => {
    const channel = new AnalyticsChannel(true);
    channel.send("case_station_reached", { station: 1, stations: 9 });
    channel.send("sound_toggled", { on: true });
    const sink = vi.fn();
    channel.connect(sink);
    expect(sink.mock.calls).toEqual([
      ["case_station_reached", { station: 1, stations: 9 }],
      ["sound_toggled", { on: true }],
    ]);
    channel.send("case_solved", {});
    expect(sink).toHaveBeenLastCalledWith("case_solved", {});
  });

  it("does not hoard events if the SDK never loads", () => {
    const channel = new AnalyticsChannel(true);
    for (let i = 0; i < 500; i++) channel.send("drawer_opened", {});
    const sink = vi.fn();
    channel.connect(sink);
    expect(sink.mock.calls.length).toBeLessThanOrEqual(50);
  });
});
