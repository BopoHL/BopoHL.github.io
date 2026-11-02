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
| `camera=cinema` | Close-ups of one or two pieces, gentle dutch angles, smooth arcing moves through depth, rack focus |
| `typing=heavy` | Heavy office typewriter: deep platen thud |
| `typing=crisp` | Portable typewriter: dry, bright click |
| `typing=metal` | Ringing metal frame |
| `typing=muffled` | Soft and distant, as if from the next room |
| `pins=push` | Plastic push pins |
| `pins=map` | Round-headed map pins |

The typewriter group has a "Listen" button that plays a short phrase with the selected sound.

## Where things live

```
src/content/        typed board content: evidence, threads, route, dossier, UI strings (RU/EN)
src/experience/     the 3D experience
  painters/         canvas painters that draw every piece of evidence
  wear/             deterministic folds, curled corners and scuffs shared by geometry and painters
  scene/            board, cards, pins, threads, lighting, post-processing
  camera/           shot framing, scroll route camera, free exploration camera
  hud/              subtitles, progress thread, finale card, pilot panel
src/dossier/        server-rendered résumé shown by "Skip the investigation"
src/audio/          synthesized typewriter profiles and the closing stamp
docs/plan.md        concept, route, visual system and image prompts
```

`src/content/board.ts` is the single source of truth for the board. Positions are in board units: the board is 32 × 18, the centre is `[0, 0]`.

## Annotating evidence

Any piece of evidence can carry ink, per language, in `src/content/board.ts`:

```ts
ink: l(
  {
    marks: [{ phrase: "~200 мс", stroke: "circle", tool: "marker" }],
    notes: [{ text: "подрядчик?", at: [0.64, 0.29], size: 0.065, rotation: -5, struck: true }],
  },
  { marks: [{ phrase: "~200", stroke: "circle", tool: "marker" }] },
),
```

- `marks` find a printed phrase and `underline`, `circle` or `strike` it with a blue `pen` or a red `marker`. Red marker stays red on the black-and-white board. A test checks that every phrase is actually printed on that card.
- `notes` are handwritten: `at` is the position on the card from its top-left corner (0–1), `size` is the letter height as a share of the card width, `struck` crosses the note out.
- Typed sheets accept `classified: l(["Зарплата:", ...], ["Salary:", ...])`, which adds a top secret box with each field blacked out by a felt-tip marker. Redacted documents do the same with `{ text, redact }` lines.

Threads tie to the top pin of a card, or to a second pin at its bottom when the thread leaves downwards, so they do not run back across their own card.

## Replacing placeholder images

Every photo and newspaper picture is painted procedurally until a real image is provided. To use a real one, put the file in `public/evidence/` and add `src` next to the placeholder scene:

```ts
image: { scene: "mountains", src: "/evidence/mountains.jpg" },
```

The painter crops the image to the frame and grades it to match the board (warm monochrome, grain, vignette; halftone for newspapers). The portrait used in both finales is `portrait` in `src/content/profile.ts`.

## Texture review

`npm run dev` also serves `/{ru|en}/evidence-sheet/`, a page that paints every piece of evidence flat for review. It is excluded from production builds.
