import { ANALYTICS_KEY, connectAnalytics } from "./track";

const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

export const startAnalytics = async () => {
  if (!ANALYTICS_KEY) return;
  const { default: posthog } = await import("posthog-js");
  posthog.init(ANALYTICS_KEY, {
    api_host: HOST,
    defaults: "2026-08-30",
    autocapture: false,
    disable_session_recording: true,
    disable_surveys: true,
    persistence: "localStorage",
    person_profiles: "identified_only",
    respect_dnt: true,
  });
  connectAnalytics((event, properties) => posthog.capture(event, properties));
};
