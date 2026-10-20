import { Caveat, IBM_Plex_Mono, Old_Standard_TT, Oswald, Playfair_Display } from "next/font/google";

const typewriter = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600"],
  variable: "--font-typewriter",
  display: "swap",
});

const headline = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["700", "900"],
  variable: "--font-headline",
  display: "swap",
});

const newsprint = Old_Standard_TT({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-newsprint",
  display: "swap",
});

const hand = Caveat({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700"],
  variable: "--font-hand",
  display: "swap",
});

const stamp = Oswald({
  subsets: ["latin", "cyrillic"],
  weight: ["600"],
  variable: "--font-stamp",
  display: "swap",
});

export const fontVariables = [typewriter, headline, newsprint, hand, stamp].map((f) => f.variable).join(" ");
