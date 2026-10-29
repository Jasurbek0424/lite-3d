---
title: Events
description: Events fired by <lite-3d> and the data they carry.
---

| Event | `e.detail` | When |
|---|---|---|
| `progress` | `{ progress }` | While the model loads, from 0 to 1 |
| `load` | `{ url, ms, variants, animations, materials }` | When the model is ready and the first frame is drawn |
| `error` | `{ error }` | When the model or the 3D engine fails to load |
| `camera-change` | — | When the user or autorotate moves the camera |
| `animation-finish` | `{ name }` | When an animation with `animation-loop="false"` ends |

```js
el.addEventListener('load', (e) => {
  const { url, ms, variants, animations } = e.detail;
  console.log(`${url} loaded in ${ms} ms`);
});

el.addEventListener('error', (e) => {
  console.error('Model failed to open:', e.detail.error);
});
```

## State attribute

Besides events, the element keeps its current state in the `data-state` attribute: `idle`, `loading`, `ready`, `error`, `fallback`. While loading it sets `aria-busy="true"`.
