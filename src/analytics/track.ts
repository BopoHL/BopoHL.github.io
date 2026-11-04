import type { Contact, Locale } from "@/content/types";

export type ContactChannel = Contact["id"];
export type Placement = "finale" | "dossier" | "drawer" | "statement" | "phone";

export interface AnalyticsEvents {
  case_station_reached: { station: number; stations: number };
  case_solved: Record<string, never>;
  investigation_skipped: { station: number };
  explore_started: Record<string, never>;
  desk_visited: Record<string, never>;
  case_file_opened: { file: string };
  dossier_opened: { board: boolean };
  board_unavailable: { reason: "no-webgl" | "context-lost" };
  resume_downloaded: { from: Placement };
  contact_clicked: { channel: ContactChannel; from: Placement };
  contact_copied: { channel: ContactChannel; from: Placement };
  statement_sent: { result: "sent" | "slow" | "failed" };
  phone_dialed: Record<string, never>;
  drawer_opened: Record<string, never>;
  secret_found: { secret: string; found: number };
  sound_toggled: { on: boolean };
  locale_switched: { to: Locale };
}

export type AnalyticsEvent = keyof AnalyticsEvents;

const EVENT_NAMES = {
  case_station_reached: true,
  case_solved: true,
  investigation_skipped: true,
  explore_started: true,
  desk_visited: true,
  case_file_opened: true,
  dossier_opened: true,
  board_unavailable: true,
  resume_downloaded: true,
  contact_clicked: true,
  contact_copied: true,
  statement_sent: true,
  phone_dialed: true,
  drawer_opened: true,
  secret_found: true,
  sound_toggled: true,
  locale_switched: true,
} satisfies Record<AnalyticsEvent, true>;

export const isAnalyticsEvent = (name: string | undefined): name is AnalyticsEvent =>
  name !== undefined && Object.hasOwn(EVENT_NAMES, name);
type Properties = Record<string, unknown>;
export type AnalyticsSink = (event: AnalyticsEvent, properties: Properties) => void;

const QUEUE_LIMIT = 50;

export class AnalyticsChannel {
  private sink: AnalyticsSink | null = null;
  private readonly queue: Array<[AnalyticsEvent, Properties]> = [];
  private readonly enabled: boolean;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  send<E extends AnalyticsEvent>(event: E, properties: AnalyticsEvents[E]) {
    if (!this.enabled) return;
    if (this.sink) {
      this.sink(event, properties);
      return;
    }
    if (this.queue.length < QUEUE_LIMIT) this.queue.push([event, properties]);
  }

  connect(sink: AnalyticsSink) {
    this.sink = sink;
    for (const [event, properties] of this.queue.splice(0)) sink(event, properties);
  }
}

export const ANALYTICS_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || null;

const channel = new AnalyticsChannel(ANALYTICS_KEY !== null);

export const track = <E extends AnalyticsEvent>(event: E, properties: AnalyticsEvents[E]) => channel.send(event, properties);

export const trackOnClick = <E extends AnalyticsEvent>(event: E, properties: AnalyticsEvents[E]) => ({
  "data-track": event,
  "data-track-properties": JSON.stringify(properties),
});

export type TrackedClick = ReturnType<typeof trackOnClick>;

export const trackFromElement = (element: HTMLElement) => {
  const event = element.dataset.track;
  if (!isAnalyticsEvent(event)) return;
  try {
    channel.send(event, JSON.parse(element.dataset.trackProperties ?? "{}"));
  } catch {}
};

export const connectAnalytics = (sink: AnalyticsSink) => channel.connect(sink);
