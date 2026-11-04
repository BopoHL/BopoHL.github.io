import type { CaseFigure as Figure, FlowNode } from "@/content/caseFiles";
import type { Locale } from "@/content/types";
import styles from "./caseFile.module.css";

const NODE = { width: 124, height: 34, columnGap: 26, rowGap: 18 };
const PAD = 6;

const nodeBox = ({ at: [column, row] }: FlowNode) => ({
  x: PAD + column * (NODE.width + NODE.columnGap),
  y: PAD + row * (NODE.height + NODE.rowGap),
});

function Flow({ figure, locale }: { figure: Extract<Figure, { kind: "flow" }>; locale: Locale }) {
  const byId = new Map(figure.nodes.map((node) => [node.id, node]));
  const width = Math.max(...figure.nodes.map((node) => nodeBox(node).x)) + NODE.width + PAD;
  const height = Math.max(...figure.nodes.map((node) => nodeBox(node).y)) + NODE.height + PAD;
  return (
    <svg className={styles.flow} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={figure.caption[locale]}>
      <defs>
        <marker id="case-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" className={styles.arrowHead} />
        </marker>
      </defs>
      {figure.links.map(([fromId, toId]) => {
        const from = byId.get(fromId);
        const to = byId.get(toId);
        if (!from || !to) return null;
        const a = nodeBox(from);
        const b = nodeBox(to);
        const sameColumn = from.at[0] === to.at[0];
        const start = sameColumn ? { x: a.x + NODE.width / 2, y: a.y + NODE.height } : { x: a.x + NODE.width, y: a.y + NODE.height / 2 };
        const end = sameColumn ? { x: b.x + NODE.width / 2, y: b.y } : { x: b.x, y: b.y + NODE.height / 2 };
        return (
          <line
            key={`${fromId}-${toId}`}
            x1={start.x}
            y1={start.y}
            x2={end.x - (sameColumn ? 0 : 2)}
            y2={end.y - (sameColumn ? 2 : 0)}
            className={styles.wire}
            markerEnd="url(#case-arrow)"
          />
        );
      })}
      {figure.nodes.map((node) => {
        const { x, y } = nodeBox(node);
        return (
          <g key={node.id}>
            <rect x={x} y={y} width={NODE.width} height={NODE.height} className={node.accent ? styles.nodeAccent : styles.node} />
            <text x={x + NODE.width / 2} y={y + NODE.height / 2} className={styles.nodeLabel}>
              {node.label[locale]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function BeforeAfter({ figure, locale }: { figure: Extract<Figure, { kind: "before-after" }>; locale: Locale }) {
  const unit = figure.unit[locale];
  const factor = Math.round(figure.before / figure.after);
  const rows = [
    { label: locale === "ru" ? "было" : "before", value: figure.before, prefix: "" },
    { label: locale === "ru" ? "стало" : "after", value: figure.after, prefix: "~" },
  ];
  return (
    <div className={styles.bars} role="img" aria-label={`${figure.caption[locale]}: ${figure.before} → ~${figure.after} ${unit}`}>
      {rows.map((row, index) => (
        <div key={row.label} className={styles.barRow}>
          <span className={styles.barLabel}>{row.label}</span>
          <span className={styles.barTrack}>
            <span
              className={index === 0 ? styles.barBefore : styles.barAfter}
              style={{ width: `${(row.value / figure.before) * 100}%` }}
            />
          </span>
          <span className={styles.barValue}>
            {row.prefix}
            {row.value} {unit}
          </span>
        </div>
      ))}
      <p className={styles.factor}>×{factor}</p>
    </div>
  );
}

export function CaseFigure({ figure, locale }: { figure: Figure; locale: Locale }) {
  return (
    <figure className={styles.figure}>
      {figure.kind === "flow" ? <Flow figure={figure} locale={locale} /> : <BeforeAfter figure={figure} locale={locale} />}
      <figcaption className={styles.caption}>{figure.caption[locale]}</figcaption>
    </figure>
  );
}
