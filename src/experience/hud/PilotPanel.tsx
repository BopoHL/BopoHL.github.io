"use client";

import { previewTypewriter } from "@/audio/typewriter";
import type { Locale, Localized } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience } from "../state/store";
import { variantToQuery, type PilotVariant } from "../state/variant";
import styles from "./hud.module.css";
import { switchSoundOn } from "./useAudioMute";

interface PilotGroup<K extends keyof PilotVariant> {
  key: K;
  legend: Localized;
  options: Array<{ value: PilotVariant[K]; label: Localized }>;
  action?: { label: Localized; run: (variant: PilotVariant) => void };
}

type AnyPilotGroup = { [K in keyof PilotVariant]: PilotGroup<K> }[keyof PilotVariant];

const GROUPS: AnyPilotGroup[] = [
  {
    key: "explore",
    legend: ui.pilot.route,
    options: [
      { value: false, label: ui.pilot.linear },
      { value: true, label: ui.pilot.linearFree },
    ],
  },
  {
    key: "finale",
    legend: ui.pilot.finale,
    options: [
      { value: "reveal", label: ui.pilot.reveal },
      { value: "folder", label: ui.pilot.folder },
    ],
  },
  {
    key: "palette",
    legend: ui.pilot.palette,
    options: [
      { value: "warm", label: ui.pilot.warm },
      { value: "noir", label: ui.pilot.noir },
      { value: "mono", label: ui.pilot.mono },
    ],
  },
  {
    key: "camera",
    legend: ui.pilot.camera,
    options: [
      { value: "classic", label: ui.pilot.classic },
      { value: "cinema", label: ui.pilot.cinema },
    ],
  },
  {
    key: "typing",
    legend: ui.pilot.typing,
    options: [
      { value: "heavy", label: ui.pilot.heavy },
      { value: "crisp", label: ui.pilot.crisp },
      { value: "metal", label: ui.pilot.metal },
      { value: "muffled", label: ui.pilot.muffled },
    ],
    action: {
      label: ui.pilot.listen,
      run: (variant) => {
        switchSoundOn();
        previewTypewriter(variant.typing);
      },
    },
  },
  {
    key: "pins",
    legend: ui.pilot.pins,
    options: [
      { value: "push", label: ui.pilot.push },
      { value: "map", label: ui.pilot.map },
    ],
  },
];

export function PilotPanel({ locale }: { locale: Locale }) {
  const variant = useExperience((state) => state.variant);
  const setVariant = useExperience((state) => state.setVariant);

  const update = (next: Partial<PilotVariant>) => {
    window.history.replaceState(null, "", variantToQuery({ ...variant, ...next }, true));
    setVariant(next);
  };

  return (
    <details className={styles.pilot}>
      <summary>{ui.pilot.title[locale]}</summary>
      {GROUPS.map((group) => (
        <fieldset key={group.key}>
          <legend>{group.legend[locale]}</legend>
          {group.options.map((option) => (
            <label key={String(option.value)}>
              <input
                type="radio"
                name={group.key}
                checked={variant[group.key] === option.value}
                onChange={() => update({ [group.key]: option.value })}
              />
              {option.label[locale]}
            </label>
          ))}
          {group.action && (
            <button type="button" className={styles.pilotAction} onClick={() => group.action?.run(variant)}>
              ▶ {group.action.label[locale]}
            </button>
          )}
        </fieldset>
      ))}
    </details>
  );
}
