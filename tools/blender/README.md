# Blender previs

Builds the same board in Blender from the site's content, so the offline render and the browser scene never drift apart.

## 1. Export assets from the running site

```bash
npm run dev
npm run blender:assets            # writes tools/blender/out/scene.json and textures/
npm run blender:assets -- --finale b --locale en
```

The script opens `/{locale}/evidence-sheet/` in your installed Chrome, saves every painted texture as PNG and the board layout, threads and camera route as `scene.json`. Pass `--chrome /path/to/chrome` if Chrome is not found.

## 2. Build the scene

```bash
blender --background --python tools/blender/build_scene.py -- --assets tools/blender/out
```

Options after `--`:

| Option | Default | Meaning |
|---|---|---|
| `--render` | `stills` | `stills` renders one frame per station, `animation` renders the whole route to MP4, `none` only saves the file |
| `--stills` | all | Comma-separated station ids, e.g. `intro,overview,finale` |
| `--engine` | `CYCLES` | `EEVEE` for fast previews |
| `--samples` | `64` | Cycles samples |
| `--resolution` | `50` | Percent of 1920×1080 |
| `--haze` | `0.012` | Density of the dusty air that makes the lamp beam visible; `0` disables it |

The result is `tools/blender/out/case-404.blend` with textures packed in, plus renders in `tools/blender/out/renders/`.

## Inside the .blend

- The camera flies along the same stations as the site: 1 second hold and 2 seconds of travel per station. Timeline markers carry the station ids.
- Threads draw themselves in through animated bevel ends.
- In finale A the mugshot flips over and the "case closed" stamp lands.
- The desk lamp follows the camera focus and keeps exposure constant at every distance.
