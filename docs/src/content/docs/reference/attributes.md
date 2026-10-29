---
title: Attributes
description: Every attribute of the <lite-3d> element.
---

## Model and loading

| Attribute | Default | Meaning |
|---|---|---|
| `src` | — | Model URL: `.glb` or `.gltf` |
| `alt` | `3D model` | Description for screen readers |
| `loading` | `lazy` | `lazy`, `eager` or `interaction`. [Details](../../guides/loading/) |
| `poster` | — | Image shown until 3D is ready. `auto` for automatic. [Details](../../guides/poster/) |
| `draco-decoder` | — | Decoder folder for Draco-compressed models |

## Camera and look

| Attribute | Default | Meaning |
|---|---|---|
| `autorotate` | off | The model slowly rotates |
| `autorotate-speed` | `1` | Rotation speed |
| `camera-controls` | on | With `"false"` the user cannot move the camera |
| `exposure` | `1` | Overall brightness |
| `tone-mapping` | `neutral` | `neutral` (keeps product colors true), `aces` or `agx` |
| `environment` | room lighting | `"none"` for simple lighting |
| `shadow` | off | Contact shadow under the model |
| `background` | transparent | 3D scene background, any CSS color |

## Materials and animation

| Attribute | Default | Meaning |
|---|---|---|
| `variant` | — | Material variant name. [Details](../../guides/variants/) |
| `autoplay` | off | Start the animation automatically |
| `animation-name` | the first one | Which animation |
| `animation-speed` | `1` | Animation speed |
| `animation-loop` | on | `"false"` to play once |

## AR

| Attribute | Default | Meaning |
|---|---|---|
| `ar` | off | "View in AR" button. [Details](../../guides/ar/) |
| `ios-src` | — | `.usdz` file for iOS Quick Look |

## Slots

| Slot | Meaning |
|---|---|
| `hotspot` | A label tied to a point on the model. [Details](../../guides/hotspots/) |
| `fallback` | Shown when WebGL is unavailable |
| `activate-label` | Text of the "View in 3D" button |
| `ar-label` | Text of the "View in AR" button |

Attributes can be changed at any time: the element updates the scene without reloading. Only a change of `src` loads a new model.
