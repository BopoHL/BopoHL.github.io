export const LOCALES = ["ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export type Localized<T = string> = Record<Locale, T>;

export type Area = "case" | "work" | "study" | "hobby";

export type Vec2 = readonly [number, number];

export type PlaceholderScene =
  | "hood"
  | "portrait"
  | "mountains"
  | "marathon"
  | "phone"
  | "servers"
  | "corridor"
  | "students"
  | "busStop";

export interface EvidenceImage {
  scene: PlaceholderScene;
  src?: string;
}

export type InkTool = "pen" | "marker";
export type InkStroke = "underline" | "circle" | "strike";

export interface InkMark {
  phrase: string;
  stroke: InkStroke;
  tool: InkTool;
}

export interface MarginNote {
  text: string;
  at: Vec2;
  size: number;
  rotation?: number;
  struck?: boolean;
  tool?: InkTool;
}

export interface Annotations {
  marks?: InkMark[];
  notes?: MarginNote[];
}

interface EvidenceBase {
  id: string;
  area: Area;
  position: Vec2;
  rotation: number;
  width: number;
  aspect?: number;
  link?: string;
  variant?: FinaleVariant;
  ink?: Localized<Annotations>;
}

export interface NewspaperEvidence extends EvidenceBase {
  kind: "newspaper";
  masthead: Localized;
  dateline: Localized;
  headline: Localized;
  body: Localized;
  image?: EvidenceImage;
}

export type TypedPaper = "index" | "sheet" | "manila";

export interface TypedEvidence extends EvidenceBase {
  kind: "typed";
  paper: TypedPaper;
  title: Localized;
  subtitle?: Localized;
  lines: Localized<string[]>;
  stamp?: Localized;
  classified?: Localized<string[]>;
}

export interface StickyEvidence extends EvidenceBase {
  kind: "sticky";
  text: Localized;
}

export interface ScrapEvidence extends EvidenceBase {
  kind: "scrap";
  text: Localized;
}

export interface PhotoEvidence extends EvidenceBase {
  kind: "photo";
  frame: "polaroid" | "mugshot";
  image: EvidenceImage;
  caption: Localized;
}

export interface ChartEvidence extends EvidenceBase {
  kind: "chart";
  title: Localized;
  from: number;
  to: number;
  unit: Localized;
  note: Localized;
}

export interface BadgeEvidence extends EvidenceBase {
  kind: "badge";
  style: "event" | "student";
  header: Localized;
  title: Localized;
  details: Localized<string[]>;
}

export interface CertificateEvidence extends EvidenceBase {
  kind: "certificate";
  issuer: Localized;
  title: Localized;
  details: Localized;
  year: string;
}

export interface RedactedLine {
  text?: Localized;
  redact?: number;
}

export interface RedactedEvidence extends EvidenceBase {
  kind: "redacted";
  title: Localized;
  subtitle: Localized;
  lines: RedactedLine[];
  stamp: Localized;
}

export interface TagEvidence extends EvidenceBase {
  kind: "tag";
  header: Localized;
  lines: Localized<string[]>;
}

export interface FolderEvidence extends EvidenceBase {
  kind: "folder";
  tab: Localized;
  name: Localized;
  role: Localized;
  lines: Localized<string[]>;
  stamp: Localized;
  image: EvidenceImage;
}

export type Evidence =
  | NewspaperEvidence
  | TypedEvidence
  | StickyEvidence
  | ScrapEvidence
  | PhotoEvidence
  | ChartEvidence
  | BadgeEvidence
  | CertificateEvidence
  | RedactedEvidence
  | TagEvidence
  | FolderEvidence;

export type EvidenceKind = Evidence["kind"];

export interface Thread {
  from: string;
  to: string;
  area: Exclude<Area, "case">;
  variant?: FinaleVariant;
}

export type FinaleVariant = "reveal" | "folder";

export interface Station {
  id: string;
  label: Localized;
  focus: readonly string[] | "all";
  subtitle: Localized;
  angle?: Vec2;
  reserveBottom?: number;
}

export interface Contact {
  id: "telegram" | "linkedin" | "email" | "github";
  label: Localized;
  value: string;
  href: string;
  copy?: string;
}
