---
title: Event'lar
description: <lite-3d> chiqaradigan event'lar va ularning ma'lumotlari.
---

| Event | `e.detail` | Qachon |
|---|---|---|
| `progress` | `{ progress }` | Model yuklanayotganda, 0 dan 1 gacha |
| `load` | `{ url, ms, variants, animations, materials }` | Model tayyor bo'lib, birinchi kadr chizilganda |
| `error` | `{ error }` | Model yoki 3D dvigatel yuklanmasa |
| `camera-change` | — | Foydalanuvchi yoki autorotate kamerani surganda |
| `animation-finish` | `{ name }` | `animation-loop="false"` bilan animatsiya tugaganda |

```js
el.addEventListener('load', (e) => {
  const { url, ms, variants, animations } = e.detail;
  console.log(`${url} ${ms} ms da yuklandi`);
});

el.addEventListener('error', (e) => {
  console.error('Model ochilmadi:', e.detail.error);
});
```

## Holat atributi

Event'lardan tashqari element joriy holatini `data-state` atributida saqlaydi: `idle`, `loading`, `ready`, `error`, `fallback`. Yuklanish paytida `aria-busy="true"` qo'yiladi.
