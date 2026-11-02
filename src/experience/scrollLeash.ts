export const leashed = (progress: number, viewed: number | null, lead: number) =>
  viewed === null ? progress : Math.min(Math.max(progress, viewed - lead), viewed + lead);
