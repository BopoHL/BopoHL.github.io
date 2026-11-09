# Case № 404

Developer portfolio of Leonid Voronin, built as a noir investigation board. Scrolling moves a camera across a cork board of evidence; the investigation ends with the suspect's identity and contacts.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
```

Open the site on a phone in the same network: `npm run dev -- -H 0.0.0.0` and visit `http://<computer-ip>:3000`.

```bash
npm test             # unit tests: content, camera framing, contact rules, analytics
npm run lint
npm run typecheck
npm run build        # static export to ./out
npm run start        # serve ./out on http://localhost:3000
npm run e2e          # build, serve on :4310 and run the browser scenarios in e2e/
```

The build is a static site (`output: "export"`). It is published to GitHub Pages (see Deploy) and can be served by any static server.

The browser scenarios need Chromium once: `npx playwright install chromium`. They cover the recruiter's fast path (skip → dossier → PDF), the English version and its metadata, the fallback without WebGL and after a lost GPU context, the title card, and the route from the last chapter to the desk. WebGL runs in software, so a full run takes a few minutes.

## Configuration

Copy `.env.example` to `.env.local` (or set the variables in the build environment). All of them are read at build time.

| Variable | Meaning |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public address of the site. Canonical links, `sitemap.xml`, `robots.txt` and the Open Graph images are built from it |
| `NEXT_PUBLIC_CONTACT_ENDPOINT` | Where the typewriter posts statements: the contact Worker's URL with `/contact`. Without it the statement is copied and Telegram opens instead |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key. Without it no analytics code is loaded |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog ingestion host, `https://eu.i.posthog.com` by default |

## Deploy

Pushing to `main` builds the site and publishes it to GitHub Pages (`.github/workflows/pages.yml`). The repository is `BopoHL.github.io`, so the site lives at the root of `https://bopohl.github.io/` and needs no base path; the workflow takes that address from GitHub and passes it as `NEXT_PUBLIC_SITE_URL`.

Once, in the repository settings:

1. **Pages → Build and deployment → Source:** GitHub Actions.
2. **Secrets and variables → Actions → Variables:** `CONTACT_ENDPOINT` (the contact Worker's URL with `/contact`), and later `POSTHOG_KEY` and `POSTHOG_HOST`. Unset variables simply leave that feature off.

The contact handler is deployed separately to Cloudflare: [server/contact/README.md](server/contact/README.md).

## Pilot variants

The pilot panel in the bottom-left corner switches the variants under review. It is always there in development; in production it appears only with `?pilot=1` in the URL. The same switches live in the URL and work without the panel:

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
src/content/        typed board content: evidence, threads, route, dossier, case files, UI strings (RU/EN)
src/experience/     the 3D experience
  painters/         canvas painters that draw every piece of evidence
  wear/             deterministic folds, curled corners and scuffs shared by geometry and painters
  scene/            board, cards, pins, threads, lighting, rain and neon, post-processing
  camera/           shot framing, scroll route camera, free exploration camera
  desk/             the desk under the board and everything on it
  hud/              title card, subtitles, progress thread, finale card, case files, statement form, pilot panel
src/dossier/        server-rendered résumé shown by "Skip the investigation" and printed to PDF
src/contact/        statement rules shared by the form and the handler, and the form's client
src/analytics/      typed analytics events and the lazy PostHog start
src/seo/            site address, Open Graph images, structured data
src/audio/          synthesized typewriter, foley, fan hum, rain, tape deck and the noir jazz score
server/contact/     the Cloudflare Worker that forwards statements to Telegram
e2e/                browser scenarios (Playwright)
tools/              asset tooling: Blender previs, tape recording, résumé PDF, Open Graph images
docs/plan.md        concept, route, visual system and image prompts
```

`src/content/board.ts` is the single source of truth for the board. Positions are in board units: the board is 32 × 18, the centre is `[0, 0]`.

## Camera pacing

Both camera styles keep one height above the board for every investigation stop and glide sideways between stops; only the overview and the finale step back. The camera eases into each stop and rests there for a moment before moving on, at a pace measured in frame heights per second, so a fast scroll never skips anything: the scroll itself is held within about one section of what the camera has shown. Clicking a chapter on the progress thread travels there directly and faster. Scrolling non-stop from the first stop to the finale takes about 45 seconds on desktop. Tuning lives in `src/experience/camera/motion.ts` (`dwell`, `browse`, `travelSettle`) and `SCROLL_LEAD` in `src/experience/useScrollDriver.ts`.

## Free exploration

The finale card offers three actions: explore the board, download the résumé, get in touch. Exploring has no buttons of its own; the camera follows the cursor (`src/experience/camera/lookAround.ts`, driven by `ExploreCamera.tsx`):

- The cursor position maps onto the board, so the spot under the cursor stays put while you zoom, and the camera turns slightly towards it. When the whole board fits on screen it only turns.
- The wheel (or a pinch) zooms, between `LOOK.boardDistance.min` and `max`. Pushing on past the farthest zoom leaves exploration; on the desk it steps back to the board.
- Resting the cursor at the bottom edge for a moment (`LOOK.deskEdge`, `LOOK.dwell`) lowers the camera to the desk; resting it at the top edge raises it back to the board. The bands are far apart, so the cursor can travel across the desk to a prop without the view flipping back.
- On touch screens a drag moves the view, dragging past the bottom or top switches between board and desk, and a pinch zooms.
- From the keyboard, the arrow keys move the view, `+` and `-` zoom, Esc closes an open case file and then leaves exploration. Tab reaches a list of the case files on the board, hidden until it has focus.
- With reduced motion the camera follows without turning.

The cinematic lens blur belongs to the story: it fades out while exploring so every note stays readable, and its focus range grows as the camera pulls back (`src/experience/scene/lens.ts`). Paper textures are sampled with a slight negative mip bias (`PAPER_LOD_BIAS` in `src/experience/scene/look.ts`) so small type stays crisp at a distance.

## The desk

Lowering the cursor to the bottom edge in free exploration turns the camera to the wooden desk under the board. Layout is in `src/experience/desk/layout.ts`; positions are `[x, z]` on the desk top, z grows towards the viewer. The loose clippings are ordinary evidence in `src/content/desk.ts` and support the same ink as the board.

- The banker's lamp switches with a click on it.
- The 1970s fan switches with a click, spins up and down, oscillates slowly and bends the cigarette smoke when it faces the ashtray.
- The heavy glass ashtray is modelled in code (`src/experience/desk/ashtrayModel.ts`): three cigarette rests cut into the rim, a bed of ash, stubbed-out butts and fallen ash. The cigarette in the rest is built from sections (filter, paper, char, ember, ash) in `cigaretteModel.ts`, so its length and how far it has burnt are data. The glass refracts the desk on high quality and falls back to tinted transparent glass on phones.
- The cassette recorder has working piano keys: REC (the tape is write-protected), REW, PLAY, FF, STOP and PAUSE. The reels, the tape packs and the counter follow the tape position, the deck auto-stops at either end and stops when you leave free exploration. PLAY turns the site sound on.
- The typewriter takes a statement: "Get in touch" (in the finale card, or a click on the machine) turns the camera to it, and what you type in the form appears on the sheet in the platen, key by key. Sending goes to the contact handler (see below).
- The rotary phone dials 404 when clicked and offers to continue in Telegram.
- The right-hand drawer slides out with the résumé folder; clicking the folder downloads the PDF.
- Four pieces of hidden evidence lie among the props (`secrets` in `src/content/desk.ts`). Each reveals a fact when clicked; the count of found ones is shown in the exploration bar and remembered in the browser.

On touch screens, a tap that ends a drag is ignored, so dragging across a prop does not switch it.

## Atmosphere

- After loading, a short title card ("Tashkent · night · rain") plays once per browser session; any key or tap skips it, and it is left out entirely when the system asks for reduced motion (`src/experience/hud/useTitleCard.ts`).
- Light from the window falls through the blinds onto the board and the desk as one skewed pane of slats, and rain runs down the glass: drops sit, merge, slide down and leave a trail (`src/experience/scene/rainGlass.ts`, painted into the light's gobo by `rainyBlinds.ts`). The window light belongs to the room, not the camera (`WindowLight.tsx`): it creeps slowly across the board (`windowDrift.ts`) and ignores the camera's travel; the lamp that follows the camera only fills in, more strongly in the warm look, which has no blinds. With reduced motion the window and the drops stay still.
- A red neon sign outside spills onto the left edge of the frame and stutters now and then, never more than three times a second (`neonLife.ts`, `NeonSpill.tsx`).
- With the sound on, rain against the window plays quietly under everything (`src/audio/rain.ts`), synthesized once and looped.
- While a subtitle types itself out, a recorded typewriter plays under it (`public/audio/typewriter.mp3`, a 13-second stretch without the carriage-return bell, looped from a random point by `src/audio/typingBed.ts`). It follows the text as a whole rather than each letter; the statement form still strikes a synthesized key for every character you type.

## Case files

In free exploration a click on the main evidence of a job opens its case file: what was done, a small diagram where it helps (a before/after bar, a request flow) and the stack. Files live in `src/content/caseFiles.ts`; `evidence` lists the cards that open each one.

## Contact by typewriter

The statement form ("Contact the author") posts to a Cloudflare Worker in `server/contact/`, which checks it, keeps a rate limit and forwards it to Telegram, so the bot token never reaches the browser. Setup is in [server/contact/README.md](server/contact/README.md). Until `NEXT_PUBLIC_CONTACT_ENDPOINT` is set, sending copies the statement and opens Telegram.

## Analytics

With `NEXT_PUBLIC_POSTHOG_KEY` set, PostHog loads after the page starts and records page views and the events listed in `src/analytics/track.ts`: how far the visitor got through the case, the solved case, skips, exploration, case files, the dossier, résumé downloads (and from where), contact clicks and copies, statements, the phone, the drawer, hidden evidence, sound and language. Links rendered on the server declare their event with `trackOnClick`, everything else calls `track`.

It runs without autocapture, session recording or surveys, keeps its identifier in local storage instead of cookies, creates no person profiles and respects Do Not Track. Without the key nothing is loaded and `track` does nothing.

## Résumé PDF and link previews

The downloadable résumés in `public/cv/` are printed from the same data as the dossier, and the Open Graph images in `public/og/` are rendered from the board itself. With `npm run dev` running:

```bash
npm run resume:render          # public/cv/leonid-voronin-cv-{ru,en}.pdf
npm run og:render              # public/og/case-404-{ru,en}.jpg; add -- --software without a GPU
```

Both use the installed Chrome; pass `--chrome /path/to/chrome` or set `CHROME_PATH` otherwise. `/{ru|en}/resume/` shows the print layout in development.

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
