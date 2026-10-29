---
title: Metodlar va xususiyatlar
description: JavaScript orqali <lite-3d> bilan ishlash.
---

```js
const el = document.querySelector('lite-3d');
```

Model bilan ishlaydigan metodlar `load` event'idan keyin natija beradi. Undan oldin ular `null`, `false` yoki bo'sh ro'yxat qaytaradi.

## Metodlar

| Metod | Qaytaradi | Ma'nosi |
|---|---|---|
| `activate()` | `Promise<void>` | 3D'ni hozir yuklash, `loading` qiymatidan qat'i nazar |
| `resetCamera()` | — | Kamerani boshlang'ich holatga qaytarish |
| `getCameraOrbit()` | `{ azimuth, polar, distance }` | Kamera burchaklari gradusda |
| `play(name?)` | — | Animatsiyani boshlash yoki davom ettirish |
| `pause()` | — | Animatsiyani to'xtatish |
| `setMaterialColor(name, color)` | `boolean` | Material rangini o'zgartirish, `null` — asl rang |
| `positionFromPoint(x, y)` | `{ position, normal }` yoki `null` | Ekrandagi nuqta ostidagi model sirti (hotspot uchun) |
| `createPoster(options?)` | `Blob` yoki `null` | Boshlang'ich kameradan rasm |
| `toDataURL(type?)` | `string` yoki `null` | Joriy kadr, standart PNG |

## Xususiyatlar

| Xususiyat | Turi | Ma'nosi |
|---|---|---|
| `src` | `string` | Model manzili (o'zgartirish yangi model yuklaydi) |
| `loading` | `'lazy' \| 'eager' \| 'interaction'` | Yuklash rejimi |
| `loaded` | `boolean` | Model tayyormi |
| `variants` | `string[]` | Modeldagi variant nomlari |
| `animations` | `string[]` | Modeldagi animatsiya nomlari |
| `materials` | `string[]` | Sahnadagi joriy material nomlari |
| `paused` | `boolean` | Animatsiya to'xtaganmi |

## TypeScript

Tiplar paket bilan birga keladi. `document.querySelector('lite-3d')` avtomatik `Lite3DElement` turini qaytaradi.

```ts
import type { Lite3DElement, ModelInfo, PosterOptions } from 'lite3d';
```
