"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { track } from "@/analytics/track";
import { useCallback } from "react";
import { MathUtils, type Texture } from "three";
import { secrets, type Secret } from "@/content/desk";
import { pick } from "@/content/localize";
import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import type { FontFamilies } from "../painters/fonts";
import { useWorldShader } from "../scene/look";
import { isTap } from "../scene/pointer";
import { useFontPainted } from "../textures/useFontPainted";
import { useExperience } from "../state/store";
import { pointerCursor } from "./deskState";
import { onDesk } from "./layout";
import { paintSecret, SECRET_SIZE } from "./secretTextures";

const LIFT = 0.05;

const disposeAll = (textures: Map<string, Texture>) => {
  for (const texture of textures.values()) texture.dispose();
};

function SecretItem({ secret, map, locale }: { secret: Secret; map: Texture; locale: Locale }) {
  const worldShader = useWorldShader();
  const size = SECRET_SIZE[secret.kind];
  const reveal = (event: ThreeEvent<MouseEvent>) => {
    if (!isTap(event)) return;
    event.stopPropagation();
    const state = useExperience.getState();
    const fresh = !state.foundSecrets.includes(secret.id);
    state.findSecret(secret.id);
    if (fresh) track("secret_found", { secret: secret.id, found: useExperience.getState().foundSecrets.length });
    state.showToast({ text: `${pick(ui.secretFound, locale)}: ${pick(secret.reveal, locale)}` });
  };
  const paperProps = { ...worldShader, roughness: 0.8 };

  return (
    <group
      position={onDesk(secret.at, LIFT)}
      rotation={[0, MathUtils.degToRad(secret.yaw), 0]}
      onClick={reveal}
      {...pointerCursor}
    >
      {secret.kind === "matchbook" ? (
        <mesh position={[0, size.thick / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[size.width, size.thick, size.depth]} />
          <meshStandardMaterial attach="material-0" {...paperProps} color="#5a1210" />
          <meshStandardMaterial attach="material-1" {...paperProps} color="#5a1210" />
          <meshStandardMaterial attach="material-2" {...paperProps} map={map} />
          <meshStandardMaterial attach="material-3" {...paperProps} color="#3a0d0b" />
          <meshStandardMaterial attach="material-4" {...paperProps} color="#2e1d14" />
          <meshStandardMaterial attach="material-5" {...paperProps} color="#5a1210" />
        </mesh>
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <planeGeometry args={[size.width, size.depth]} />
          <meshStandardMaterial {...paperProps} map={map} />
        </mesh>
      )}
    </group>
  );
}

export function Secrets({ locale }: { locale: Locale }) {
  const paint = useCallback(
    (fonts: FontFamilies) => new Map(secrets.map((secret) => [secret.id, paintSecret(secret.kind, pick(secret.print, locale), fonts)])),
    [locale],
  );
  const textures = useFontPainted(paint, disposeAll);
  if (!textures) return null;
  return (
    <>
      {secrets.map((secret) => {
        const map = textures.get(secret.id);
        return map ? <SecretItem key={secret.id} secret={secret} map={map} locale={locale} /> : null;
      })}
    </>
  );
}
