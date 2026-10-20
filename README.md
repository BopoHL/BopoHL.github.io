# Case № 404

Developer portfolio of Leonid Voronin, built as a noir investigation board. Scrolling moves a camera across a cork board of evidence; the investigation ends with the suspect's identity and contacts.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
```

Open the site on a phone in the same network: `npm run dev -- -H 0.0.0.0` and visit `http://<computer-ip>:3000`.

```bash
npm test             # content and camera framing tests
npm run lint
npm run typecheck
npm run build        # static export to ./out
```

The build is a static site (`output: "export"`). Serve `out/` with any static server, for example nginx.

## Pilot variants

The pilot panel in the bottom-left corner switches the variants under review. The same switches live in the URL:

| Query | Meaning |
|---|---|
| `route=linear` | Scroll route only |
| `route=free` | Scroll route, then free exploration of the board |
| `finale=a` | The hooded mugshot flips over and gets stamped |
| `finale=b` | A separate "case closed" folder collects every thread |
| `look=warm` | Warm desk lamp on a cork board |
| `look=noir` | Black and white with hard light through venetian blinds; threads and the closing stamp keep their colour |
| `look=mono` | Pure black and white |
| `camera=classic` | Each stop frames a whole cluster of evidence |
| `camera=cinema` | Close-ups of one or two pieces, dutch angles, sharp arcing moves through depth, rack focus |

## Where things live

```
src/content/        typed board content: evidence, threads, route, dossier, UI strings (RU/EN)
src/experience/     the 3D experience
  painters/         canvas painters that draw every piece of evidence
  scene/            board, cards, pins, threads, lighting, post-processing
  camera/           shot framing, scroll route camera, free exploration camera
  hud/              subtitles, progress thread, finale card, pilot panel
src/dossier/        server-rendered résumé shown by "Skip the investigation"
src/audio/          synthesized typewriter sounds
docs/plan.md        concept, route, visual system and image prompts
```

`src/content/board.ts` is the single source of truth for the board. Positions are in board units: the board is 32 × 18, the centre is `[0, 0]`.

## Replacing placeholder images

Every photo and newspaper picture is painted procedurally until a real image is provided. To use a real one, put the file in `public/evidence/` and add `src` next to the placeholder scene:

```ts
image: { scene: "mountains", src: "/evidence/mountains.jpg" },
```

The painter crops the image to the frame and grades it to match the board (warm monochrome, grain, vignette; halftone for newspapers). The portrait used in both finales is `portrait` in `src/content/profile.ts`.

## Texture review

`npm run dev` also serves `/{ru|en}/evidence-sheet/`, a page that paints every piece of evidence flat for review. It is excluded from production builds.
