export interface FontFamilies {
  typewriter: string;
  headline: string;
  newsprint: string;
  hand: string;
  stamp: string;
}

const FONT_VARIABLES: Record<keyof FontFamilies, string> = {
  typewriter: "--font-typewriter",
  headline: "--font-headline",
  newsprint: "--font-newsprint",
  hand: "--font-hand",
  stamp: "--font-stamp",
};

const FALLBACKS: FontFamilies = {
  typewriter: "monospace",
  headline: "serif",
  newsprint: "serif",
  hand: "cursive",
  stamp: "sans-serif",
};

const LOAD_REQUESTS: Array<[keyof FontFamilies, string]> = [
  ["typewriter", "400"],
  ["typewriter", "600"],
  ["headline", "700"],
  ["headline", "900"],
  ["newsprint", "400"],
  ["newsprint", "700"],
  ["hand", "500"],
  ["hand", "700"],
  ["stamp", "600"],
];

const SAMPLE = "Дело № 404 Case closed";

export const resolveFontFamilies = (): FontFamilies => {
  const styles = getComputedStyle(document.documentElement);
  const entries = Object.entries(FONT_VARIABLES).map(([key, variable]) => {
    const value = styles.getPropertyValue(variable).trim();
    return [key, value || FALLBACKS[key as keyof FontFamilies]];
  });
  return Object.fromEntries(entries) as FontFamilies;
};

const primaryFamily = (stack: string) => stack.split(",")[0].trim();

export const loadFonts = async (families: FontFamilies): Promise<void> => {
  await Promise.all(
    LOAD_REQUESTS.map(([key, weight]) =>
      document.fonts.load(`${weight} 32px ${primaryFamily(families[key])}`, SAMPLE).catch(() => []),
    ),
  );
  await document.fonts.ready;
};

export const font = (weight: number | string, sizePx: number, family: string, style = "") =>
  `${style} ${weight} ${Math.max(1, Math.round(sizePx * 10) / 10)}px ${family}`.trim();
