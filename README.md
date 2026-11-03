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
| `camera=cinema` | One or two pieces per stop, a slight change of angle between stops, soft focus at the edges |
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
  desk/             the desk under the board: lamp, fan, ashtray, cassette recorder, loose clippings
  hud/              subtitles, progress thread, finale card, pilot panel
src/dossier/        server-rendered résumé shown by "Skip the investigation"
src/audio/          synthesized typewriter, foley, fan hum, tape deck and the noir jazz score
tools/              asset tooling: Blender previs, tape recording
docs/plan.md        concept, route, visual system and image prompts
```

`src/content/board.ts` is the single source of truth for the board. Positions are in board units: the board is 32 × 18, the centre is `[0, 0]`.

## Camera pacing

Both camera styles keep one height above the board for every investigation stop and glide sideways between stops; only the overview and the finale step back. The camera eases into each stop and rests there for a moment before moving on, at a pace measured in frame heights per second, so a fast scroll never skips anything: the scroll itself is held within about one section of what the camera has shown. Clicking a chapter on the progress thread travels there directly and faster. Scrolling non-stop from the first stop to the finale takes about 45 seconds on desktop. Tuning lives in `src/experience/camera/motion.ts` (`dwell`, `browse`, `travelSettle`) and `SCROLL_LEAD` in `src/experience/useScrollDriver.ts`.

In free exploration the camera never comes closer than `MIN_DISTANCE` in `src/experience/camera/ExploreCamera.tsx`. The cinematic lens blur belongs to the story: it fades out while exploring so every note stays readable, and its focus range grows as the camera pulls back (`src/experience/scene/lens.ts`). Paper textures are sampled with a slight negative mip bias (`PAPER_LOD_BIAS` in `src/experience/scene/look.ts`) so small type stays crisp at a distance.

## The desk

"To the desk" in free exploration turns the camera to the wooden desk under the board. Layout is in `src/experience/desk/layout.ts`; positions are `[x, z]` on the desk top, z grows towards the viewer. The loose clippings are ordinary evidence in `src/content/desk.ts` and support the same ink as the board.

- The banker's lamp switches with a click on it.
- The 1970s fan switches with a click, spins up and down, oscillates slowly and bends the cigarette smoke when it faces the ashtray.
- The heavy glass ashtray is modelled in code (`src/experience/desk/ashtrayModel.ts`): three cigarette rests cut into the rim, a bed of ash, stubbed-out butts and fallen ash. The cigarette in the rest is built from sections (filter, paper, char, ember, ash) in `cigaretteModel.ts`, so its length and how far it has burnt are data. The glass refracts the desk on high quality and falls back to tinted transparent glass on phones.
- The cassette recorder has working piano keys: REC (the tape is write-protected), REW, PLAY, FF, STOP and PAUSE. The reels, the tape packs and the counter follow the tape position, the deck auto-stops at either end and stops when you leave free exploration. PLAY turns the site sound on.

Clicks that end a camera drag are ignored, so dragging across a prop does not switch it.

## Tape recording

The cassette plays `public/audio/case-404.mp3`, set by `cassette.recording` in `src/content/desk.ts`; any MP3 works, update `seconds` to its length. The bundled recording is a noir jazz piece composed in code (`src/audio/noirJazz.ts`) and recorded once, so the site only downloads a 550 KB file when the recorder is touched. To record it again after changing the score:

```bash
npm run dev
npm run tape:render              # needs ffmpeg; pass --chrome /path/to/chrome if Chrome is not found
```

`/{ru|en}/tape-studio/` plays the score in the browser without recording it. Like the evidence sheet, it exists only in development.

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

Threads tie to the top pin of a card, or to a second pin at its bottom when the thread leaves downwards, so they do not run back across their own card. Each thread winds a couple of turns round the pin body above its base, following the pin's tilt, and most cut ends hang down a little below the pin. Pins that hold several threads build the turns up in layers. Tuning is at the top of `src/experience/scene/boardSurface.ts`.

## Replacing placeholder images

Every photo and newspaper picture is painted procedurally until a real image is provided. To use a real one, put the file in `public/evidence/` and add `src` next to the placeholder scene:

```ts
image: { scene: "mountains", src: "/evidence/mountains.jpg" },
```

The painter crops the image to the frame and grades it to match the board (warm monochrome, grain, vignette; halftone for newspapers). The portrait used in both finales is `portrait` in `src/content/profile.ts`.

## Texture review

`npm run dev` also serves `/{ru|en}/evidence-sheet/`, a page that paints every piece of evidence flat for review. It is excluded from production builds.
