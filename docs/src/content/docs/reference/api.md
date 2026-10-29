---
title: Methods and properties
description: Working with <lite-3d> from JavaScript.
---

```js
const el = document.querySelector('lite-3d');
```

Methods that work with the model return results after the `load` event. Before that they return `null`, `false` or an empty list.

## Methods

| Method | Returns | Meaning |
|---|---|---|
| `activate()` | `Promise<void>` | Load 3D now, whatever the `loading` value is |
| `resetCamera()` | — | Return the camera to its initial position |
| `getCameraOrbit()` | `{ azimuth, polar, distance }` | Camera angles in degrees |
| `play(name?)` | — | Start or resume an animation |
| `pause()` | — | Pause the animation |
| `setMaterialColor(name, color)` | `boolean` | Change a material color, `null` for the original |
| `positionFromPoint(x, y)` | `{ position, normal }` or `null` | The model surface under a screen point (for hotspots) |
| `createPoster(options?)` | `Blob` or `null` | An image from the initial camera |
| `toDataURL(type?)` | `string` or `null` | The current frame, PNG by default |

## Properties

| Property | Type | Meaning |
|---|---|---|
| `src` | `string` | Model URL (changing it loads a new model) |
| `loading` | `'lazy' \| 'eager' \| 'interaction'` | Loading mode |
| `loaded` | `boolean` | Whether the model is ready |
| `variants` | `string[]` | Variant names in the model |
| `animations` | `string[]` | Animation names in the model |
| `materials` | `string[]` | Current material names in the scene |
| `paused` | `boolean` | Whether the animation is paused |

## TypeScript

Types ship with the package. `document.querySelector('lite-3d')` returns `Lite3DElement` automatically.

```ts
import type { Lite3DElement, ModelInfo, PosterOptions } from 'lite3d';
```
