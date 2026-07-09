# PhotoLab

Offline-first, non-destructive photo editing suite for iOS, Android, and Web. Built with **Expo SDK 54**, **React Native 0.81**, **TypeScript**, **React Native Skia** on native, and a Canvas 2D renderer on web.

No backend. No authentication. No cloud inference. All edits are serialized as JSON recipes; originals are never mutated.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Presentation                            │
│  HomeScreen ──► EditorScreen ──► Tool Panels (Adjust/Crop/…)   │
│       │              │                                          │
│       │         ImageCanvas (Skia / Canvas 2D on Web)           │
└───────┼──────────────┼──────────────────────────────────────────┘
        │              │
┌───────▼──────────────▼──────────────────────────────────────────┐
│                    State (Zustand)                              │
│  useEditorStore ──► recipe, gallery, tools, brush/mask settings │
│  historyManager ──► undo/redo stack (50 entries, timeline scrub)│
└───────┬──────────────┬──────────────────────────────────────────┘
        │              │
┌───────▼──────┐ ┌─────▼──────────────────────────────────────────┐
│   Storage    │ │              Rendering Pipeline                  │
│ AsyncStorage │ │  adjustments ──► buildColorMatrix()              │
│ + FileSystem │ │             ──► hslToColorMatrix()               │
│  (native)    │ │             ──► colorGradeToMatrix()             │
│              │ │             ──► curveToLUT()                     │
│              │ │             ──► Skia ColorMatrix (live preview)  │
└──────────────┘ └──────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                   Processing (Algorithmic)                        │
│  progressiveUpscale() ──► 2× bicubic passes + unsharp mask        │
│  applyDenoise()       ──► Gaussian blend (sharp ⊕ blur)           │
│  applyPortraitEnhance() ──► denoise → acutance → warmth           │
│  applyLowLightRecovery() ──► shadow-lift color matrix             │
└───────────────────────────────────────────────────────────────────┘
```

---

## Directory Layout

| Path | Responsibility |
|------|----------------|
| `src/core/` | Recipe schema, edit engine, undo/redo, Zustand store |
| `src/rendering/` | Color matrix math, HSL/curve processors, debounced preview |
| `src/processing/` | Offline image ops: upscale, denoise, portrait, masks |
| `src/storage/` | Gallery index + recipe persistence (FS native, IndexedDB web) |
| `src/features/` | Tool panels: adjust, crop, mask, brush, enhance, export |
| `src/ui/` | Theme tokens, glass panels, sliders, canvas, toolbar |
| `src/platform/` | Platform abstractions (haptics, image picker) |
| `src/assets/presets/` | Filter preset definitions (Cinematic, HDR, Moody, …) |

---

## Non-Destructive Edit Model

Every edit session produces an `ImageRecipe` persisted as JSON:

```json
{
  "imageId": "uuid",
  "originalUri": "file:///…/images/uuid.jpg",
  "workingUri": "file:///…/processed/uuid_sharp.png",
  "adjustments": {
    "exposure": 0.2,
    "contrast": 0.15,
    "highlights": -0.1,
    "shadows": 0.25,
    "temperature": 12,
    "sharpness": 0.08
  },
  "hsl": { "orange": { "hue": 5, "saturation": 10, "luminance": 0 } },
  "colorGrade": { "shadows": {…}, "midtones": {…}, "highlights": {…} },
  "curves": { "rgb": [{ "x": 0, "y": 0 }, { "x": 255, "y": 255 }] },
  "enhancements": [{ "type": "upscale", "factor": 2, "strength": 0.7 }],
  "masks": [],
  "drawingLayers": []
}
```

- `originalUri` — immutable import source
- `workingUri` — latest algorithmically processed raster (upscale, denoise, etc.)
- `adjustments` — live Skia/CSS preview layer applied at render time
- Full undo/redo via deep-cloned recipe snapshots

---

## Rendering Pipeline

### Color Matrix Composition

Adjustments compile into a 4×5 row-major matrix consumed by Skia's `ColorMatrix` filter:

```
finalMatrix = exposure × contrast × saturation × temperature × toneOffsets × hsl × grade × curveLUT
```

Implemented in `src/rendering/colorMatrix.ts` and `filterPipeline.ts`. Slider changes debounce at 16 ms to avoid redundant GPU work.

### Native Preview

`ImageCanvas.tsx` loads the display URI through Skia `useImage`, applies the composed matrix, composites drawing layers and mask overlays, and supports:

- Pinch-to-zoom (Reanimated shared values)
- Long-press before/after comparison against `originalUri`
- Live brush stroke preview via `liveStroke` prop

### Web Preview

Metro resolves `.web.tsx` variants automatically:

| Native | Web Fallback |
|--------|-------------|
| Skia `ColorMatrix` | Canvas 2D color-matrix renderer |
| Skia surface filters | HTML Canvas 2D + `ctx.filter` |
| `expo-file-system` | IndexedDB blobs + AsyncStorage recipes |
| `expo-media-library` | `<a download>` / `navigator.share()` |
| `expo-haptics` | No-op shim |

---

## Algorithmic Enhancement Stack

### Super Resolution (`upscaler.ts` + `skiaResize.ts` + `detailEnhancement.ts`)

Multi-pass GPU pipeline designed to mimic higher-resolution sensor output:

1. **Pre-denoise** — suppress sensor grain before amplification
2. **Progressive 2× Skia upscales** — cubic GPU sampling (not single-step jump)
3. **Edge-adaptive detail recovery** — acutance on edges, smooth on flat areas
4. **Luminance-only sharpening** — no color fringing halos
5. **Local contrast + clarity** — micro-detail boost

Quality modes: **Fast** / **High** / **Max**. Factors: 2×, 4×, 8×.

### Background Replacement (`segmentation.ts` + `compositor.ts`)

Auto-segments subjects via corner color-distance sampling, builds feathered alpha mask, and composites over:

- **Blur** — portrait-mode background blur
- **Solid color** — 10 preset swatches
- **Gradient** — 5 cinematic gradients
- **Custom photo** — pick from library

### Filters (`FiltersPanel` + 26 presets)

Non-destructive color looks with intensity slider (0–100%). Packs: Cinematic, Film, Vintage, Neon, HDR, Moody, Portrait, Vivid, Monochrome.

### Edge-Preserving Denoise

Bilateral-style approximation via Skia `MakeArithmetic`:

```
output = sharp × (1 − t) + blur × t     where t = strength, σ = 0.5 + 2.5t
```

### Portrait Polish

Chained pipeline: mild denoise → 3×3 acutance convolution → subtle warmth matrix.

---

## Masking

Procedural region masks (no ML segmentation):

| Preset | Geometry | Use Case |
|--------|----------|----------|
| Sky | Linear gradient, top 42% | Sky replacement / selective grade |
| Subject | Center ellipse | Portrait isolation |
| Foreground | Radial gradient | Depth-style selection |
| Background | Inverted radial | Background blur prep |
| Highlights / Shadows | Luminance threshold zones | Tone isolation |

Masks render as Skia overlays; brush tool refines boundaries on-canvas.

---

## Storage Layout (Native)

```
Documents/
├── images/          # Imported originals (UUID.ext)
├── recipes/         # JSON edit stacks (UUID.json)
└── processed/       # Enhancement outputs (UUID_suffix.png)
```

Gallery index cached in AsyncStorage (`@photolab/gallery`).

---

## Tool Surface

| Tool | Capabilities |
|------|-------------|
| **Adjust** | 13 sliders, HSL×8 channels, RGB curves, color grade, 10 presets |
| **Crop** | Aspect ratios (1:1, 4:3, 16:9, …), 90° rotation steps |
| **Mask** | 6 procedural selectors + brush refinement |
| **Brush** | Pencil, brush, eraser, enhancement paint (soft-light blend) |
| **Enhance** | Upscale 2×/4×/8×, denoise, portrait, shadow recovery, auto color |
| **Export** | PNG/JPEG, 1×/2×/4× scale, gallery save or share sheet |

---

## Tech Stack

| Layer | Package |
|-------|---------|
| Framework | Expo ~54, React 19, React Native 0.81 |
| GPU | `@shopify/react-native-skia` 2.6 |
| Gestures | `react-native-gesture-handler`, `react-native-reanimated` 4.3 |
| State | Zustand 5 |
| Storage | `expo-file-system`, `@react-native-async-storage/async-storage` |
| Media | `expo-image-picker`, `expo-image-manipulator`, `expo-media-library` |
| Web | `react-native-web`, `react-dom` |

---

## Development

```bash
# Install
npm install

# iOS Simulator (dev client — no Expo Go required)
npx expo run:ios

# Android
npx expo run:android

# Web browser
npm run web
# → http://localhost:8081

# Static production web export for Vercel
npm run build:web
# → dist/

# Type check
npm run typecheck

# Full local release check
npm run verify
```

## Deployment

### Vercel

This repo includes `vercel.json`. In Vercel, use framework preset **Other**, build command `npm run build:web`, and output directory `dist`.

### TestFlight

Native build settings live in `app.json` and `eas.json`. See [`RELEASE.md`](./RELEASE.md) for the iOS TestFlight checklist.

## Privacy

PhotoLab is local-first. See [`PRIVACY.md`](./PRIVACY.md) and [`TERMS.md`](./TERMS.md).

### Expo Go Compatibility

This project targets **SDK 54**, compatible with the current **Expo Go** app from the App Store. Scan the QR code from `npx expo start` to run on a physical device.

---

## Performance Notes

- Adjustment sliders debounce at 16 ms (one frame at 60 Hz)
- GPU preview uses Skia color matrix — no full raster recompute per slider tick
- Enhancement ops (upscale, denoise) bake pixels to `workingUri` once on apply
- History capped at 50 entries to bound memory

---

## License

MIT — see [LICENSE](./LICENSE).
\n\n---\n\n**Author:** [Dhruv Hegde](https://github.com/DDVHegde100) · CS @ University of Michigan\n
