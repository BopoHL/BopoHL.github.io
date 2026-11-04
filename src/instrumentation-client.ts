import { startAnalytics } from "./analytics/posthog";

startAnalytics().catch((error: unknown) => console.warn("Analytics did not start", error));
