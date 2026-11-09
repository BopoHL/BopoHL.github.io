const KEY = "case404:sound";
const OFF = "off";

export const soundPreferred = () => {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(KEY) !== OFF;
  } catch {
    return true;
  }
};

export const rememberSound = (on: boolean) => {
  try {
    if (on) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, OFF);
  } catch {}
};
