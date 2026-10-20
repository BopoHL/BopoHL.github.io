"use client";

import type { FinaleVariant, Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience, variantToQuery } from "../state/store";
import styles from "./hud.module.css";

export function PilotPanel({ locale }: { locale: Locale }) {
  const variant = useExperience((state) => state.variant);
  const setVariant = useExperience((state) => state.setVariant);

  const update = (next: { finale?: FinaleVariant; explore?: boolean }) => {
    window.history.replaceState(null, "", variantToQuery({ ...variant, ...next }));
    setVariant(next);
  };

  return (
    <details className={styles.pilot}>
      <summary>{ui.pilot.title[locale]}</summary>
      <fieldset>
        <legend>{ui.pilot.route[locale]}</legend>
        <label>
          <input type="radio" name="route" checked={!variant.explore} onChange={() => update({ explore: false })} />
          {ui.pilot.linear[locale]}
        </label>
        <label>
          <input type="radio" name="route" checked={variant.explore} onChange={() => update({ explore: true })} />
          {ui.pilot.linearFree[locale]}
        </label>
      </fieldset>
      <fieldset>
        <legend>{ui.pilot.finale[locale]}</legend>
        <label>
          <input type="radio" name="finale" checked={variant.finale === "reveal"} onChange={() => update({ finale: "reveal" })} />
          {ui.pilot.reveal[locale]}
        </label>
        <label>
          <input type="radio" name="finale" checked={variant.finale === "folder"} onChange={() => update({ finale: "folder" })} />
          {ui.pilot.folder[locale]}
        </label>
      </fieldset>
    </details>
  );
}
