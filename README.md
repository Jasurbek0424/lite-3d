# lite3d

A lightweight web component for 3D product viewers. One tag, 4.5 KB up front, three.js only when the model is needed.

```html
<lite-3d src="chair.glb" autorotate shadow ar></lite-3d>
```

**[Live demo and docs](https://jasurbek0424.github.io/lite-3d/)** · [O'zbekcha](https://jasurbek0424.github.io/lite-3d/uz/) · [Русский](https://jasurbek0424.github.io/lite-3d/ru/)

| | First load | After 3D starts |
|---|---:|---:|
| **lite3d** | 4.5 KB | 178.4 KB |
| @google/model-viewer 4.4.0 | 294.8 KB | 294.8 KB |

<sub>esbuild, minify, gzip -9, three 0.186.1. Model files not included.</sub>

## Install

```bash
npm i lite3d three
# pnpm add lite3d three
# yarn add lite3d three
# bun add lite3d three
```

```js
import 'lite3d'; // registers <lite-3d>
```

React and Next.js (the file ships with `'use client'`, so it works inside server components):

```tsx
import { Lite3D } from 'lite3d/react';

<Lite3D src="/chair.glb" poster="/chair.webp" autorotate shadow ar onLoad={(e) => console.log(e.detail.ms)} />;
```

Without a bundler (three.js included):

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/lite3d/dist/cdn/lite3d.cdn.js"></script>
```

## Features

- **Lazy by default.** Shows a poster until the element nears the screen, then loads three.js and the model. `loading="interaction"` waits for a click.
- **Zero setup.** Camera, environment lighting and a soft contact shadow fit the model automatically.
- **Hotspots.** Any HTML element pinned to a point on the model, hidden when it faces away or is blocked.
- **Variants and colors.** `KHR_materials_variants` support plus `setMaterialColor()` for plain materials.
- **Animations.** `autoplay`, `animation-name`, speed, loop, `play()` / `pause()` and an `animation-finish` event.
- **Posters.** `createPoster()` renders a clean WebP from the initial camera; `poster="auto"` caches one in the browser.
- **AR.** Scene Viewer on Android, Quick Look on iOS (with `ios-src`).
- **Efficient.** Renders only when something changes, pauses off screen, caps pixel ratio at 2, frees GPU memory on removal.
- **Accessible.** `alt` text, keyboard-reachable hotspots, respects `prefers-reduced-motion`.

## Attributes

| Attribute | Default | Description |
|---|---|---|
| `src` | — | `.glb` / `.gltf` model URL |
| `poster` | — | Image shown until 3D is ready; `auto` caches the first frame |
| `alt` | `3D model` | Description for screen readers |
| `loading` | `lazy` | `lazy` near the viewport, `eager` immediately, `interaction` on click |
| `autorotate` | off | Slow rotation (off under `prefers-reduced-motion`) |
| `autorotate-speed` | `1` | Rotation speed |
| `camera-controls` | on | `"false"` locks the camera |
| `exposure` | `1` | Brightness |
| `tone-mapping` | `neutral` | `neutral` (true product colors), `aces` or `agx` |
| `environment` | room light | `"none"` for simple lights |
| `shadow` | off | Contact shadow under the model |
| `background` | transparent | Scene background color |
| `ar` | off | AR button (Android Scene Viewer; iOS needs `ios-src`) |
| `ios-src` | — | `.usdz` file for iOS Quick Look |
| `draco-decoder` | — | Decoder folder for Draco-compressed models |
| `variant` | — | Material variant name |
| `autoplay` | off | Play animation automatically (off under `prefers-reduced-motion`) |
| `animation-name` | first | Which animation to play |
| `animation-speed` | `1` | Animation speed |
| `animation-loop` | on | `"false"` plays once and holds the last frame |

Meshopt-compressed models work out of the box.

## Hotspots

```html
<lite-3d src="chair.glb">
  <button slot="hotspot" data-position="0.0068 0.597 -0.1446" data-normal="0.026 0.281 0.959">
    Velvet fabric
  </button>
</lite-3d>
```

Get coordinates by clicking the model during development: `el.positionFromPoint(e.clientX, e.clientY)` returns ready-to-paste `{ position, normal }` strings.

## JavaScript API

```js
const el = document.querySelector('lite-3d');

el.addEventListener('load', (e) => {
  e.detail; // { url, ms, variants, animations, materials }
});

el.setAttribute('variant', 'Peacock Velvet');
el.setMaterialColor('metal', '#c9a227'); // null restores the original
el.play('Walking');
el.pause();
el.resetCamera();
const blob = el.createPoster({ width: 1024 });
```

Events: `progress`, `load`, `error`, `camera-change`, `animation-finish`. Full reference in the [docs](https://jasurbek0424.github.io/lite-3d/reference/api/).

## Styling

```css
lite-3d {
  --lite3d-aspect: 1 / 1;
  --lite3d-bg: #f5f5f5;
  --lite3d-accent: #111;
  --lite3d-accent-fg: #fff;
  --lite3d-radius: 12px;
}
lite-3d::part(activate-button) { font-weight: 600; }
```

Button text is English by default. Translate it with slots:

```html
<lite-3d src="chair.glb" loading="interaction" ar>
  <span slot="activate-label">Смотреть в 3D</span>
  <span slot="ar-label">Смотреть в AR</span>
</lite-3d>
```

## Preparing models

```bash
npx @gltf-transform/cli optimize input.glb output.glb \
  --compress meshopt --texture-compress webp --texture-size 2048 --simplify false
```

`scripts/subdivide.mjs` smooths low-poly models (keeps skinning, UVs and morph targets). See [Preparing models](https://jasurbek0424.github.io/lite-3d/guides/preparing-models/).

## Development

```bash
npm i
npm run build        # dist/
```

The docs site (`docs/`, Astro Starlight, English / Uzbek / Russian) imports the library straight from `src/`:

```bash
cd docs
npm i
npm run dev          # http://localhost:4321/lite-3d/
npm run build        # docs/dist
```

Pull requests run CI (build, types, a 5 KB first-load budget, docs build). Merging to `main` re-runs the checks and deploys the docs to GitHub Pages; publishing a GitHub Release stages the package on npm, where a maintainer approves it with 2FA. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

Sample models on the docs site: Sheen Chair (Wayfair, Eric Chadwick, CC0), Chronograph Watch (Darmstadt Graphics Group, Eric Chadwick, CC-BY 4.0), Robot Expressive (Tomás Laulhé / Quaternius, CC0), Toy Car (Guido Odendahl, Eric Chadwick, CC0).

## License

[MIT](LICENSE) © Jasurbek Khakimbekov
